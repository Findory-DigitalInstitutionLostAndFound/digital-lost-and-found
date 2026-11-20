"""Experimental multilingual matcher. Baseline text_matcher remains unchanged.

Run from the repository root:
    python item_matching/matching/robust_matcher.py

Descriptions carry the semantic evidence; titles/tags are a fallback when absent.
Scores are heuristic, not ownership probabilities. No fine-tuning is performed.
"""
import argparse
import json
import math
import re
from pathlib import Path

try:
    from matching.date_utils import is_chronologically_valid
    from matching.text_matcher import category_score, location_score, date_score, normalise_text
except ModuleNotFoundError:
    from date_utils import is_chronologically_valid
    from text_matcher import category_score, location_score, date_score, normalise_text

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_NAME = 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2'
RESULTS_FILE = BASE_DIR / 'robust_results.json'
NUMBERS = {'one':1,'two':2,'three':3,'four':4,'five':5,'six':6,
           'thirteen':13,'fourteen':14,'fifteen':15,'sixteen':16,'seventeen':17}
NUMBER = r'(?:\d+(?:\.\d+)?|' + '|'.join(NUMBERS) + r')'


def evidence_text(item):
    """Avoid letting duplicated titles/tags drown out contradictory descriptions."""
    description = normalise_text(item.get('description'))
    return description or ' '.join(normalise_text(item.get(f)) for f in ('title','ai_tags')).strip()


def number(value):
    return float(NUMBERS[value]) if value in NUMBERS else float(value)


def facts(item):
    """Conservative English attribute rules; absence is not a contradiction.

    Rules are deliberately scoped to units/object nouns, not arbitrary numbers
    (serials, dates, etc.). Multilingual negation remains a known limitation.
    """
    text = normalise_text(item.get('description'))
    # Drop explicit negated alternatives from positive number/colour extraction.
    positive = re.sub(r'\b(?:not|without|no)\b[^.;!?]*', '', text)
    sizes = {number(m.group(1)) for m in re.finditer(
        rf'\b({NUMBER})[ -]*(?:inch(?:es)?|["″])', positive)}
    counts = {number(m.group(1)) for m in re.finditer(
        rf'\b({NUMBER})\s+(?:(?:silver|metal|brass|house|small)\s+)*keys?\b', positive)}
    # Only colours modifying the main object, not stickers, logos, or cases.
    colours = set(re.findall(
        r'\b(black|white|red|blue|green|orange|yellow|purple|pink|grey|gray|brown|silver)\s+(?:leather\s+)?(?:backpack|rucksack|wallet|phone|laptop|umbrella)\b',positive))
    colours = {'grey' if c=='gray' else c for c in colours}
    sticker_present = bool(re.search(r'\bsticker\b',positive))
    sticker_absent = bool(re.search(r'\b(?:no|without|not)\s+(?:(?:a|any|the|red|blue|small|little)\s+)*sticker\b',text))
    return dict(sizes=sizes, counts=counts, colours=colours,
                sticker_present=sticker_present, sticker_absent=sticker_absent)


def find_conflicts(lost, found):
    a,b=facts(lost),facts(found)
    reasons=[]
    for field,label in [('sizes','different_screen_sizes'),('counts','different_key_counts'),('colours','different_object_colours')]:
        if a[field] and b[field] and a[field].isdisjoint(b[field]):
            reasons.append(label)
    if (a['sticker_present'] and b['sticker_absent']) or (b['sticker_present'] and a['sticker_absent']):
        reasons.append('sticker_present_vs_absent')
    return reasons


class SemanticEncoder:
    """Lazy local CPU model, attention-mask mean pooling, cached per text."""
    def __init__(self):
        self.cache={}
        self.model=None

    def encode(self,texts):
        import torch
        missing=list(dict.fromkeys(t for t in texts if t and t not in self.cache))
        if missing and self.model is None:
            from transformers import AutoModel, AutoTokenizer
            self.tokenizer=AutoTokenizer.from_pretrained(MODEL_NAME)
            self.model=AutoModel.from_pretrained(MODEL_NAME).eval()
        for start in range(0,len(missing),16):
            batch=missing[start:start+16]
            encoded=self.tokenizer(batch,padding=True,truncation=True,max_length=128,return_tensors='pt')
            with torch.inference_mode():
                tokens=self.model(**encoded).last_hidden_state
                mask=encoded['attention_mask'].unsqueeze(-1).to(tokens.dtype)
                pooled=(tokens*mask).sum(1)/mask.sum(1).clamp(min=1)
                vectors=torch.nn.functional.normalize(pooled,p=2,dim=-1).tolist()
            self.cache.update(zip(batch,vectors))
        return [self.cache.get(t) for t in texts]


def calculate_robust_score(lost,found,similarity):
    if not math.isfinite(similarity) or not -1 <= similarity <= 1:
        raise ValueError('Semantic similarity must be finite and between -1 and 1')
    if not is_chronologically_valid(lost,found):
        return None
    # Missing evidence must not acquire points from an injected similarity.
    similarity=max(0,similarity) if evidence_text(lost) and evidence_text(found) else 0
    category,location,date=category_score(lost,found),location_score(lost,found),date_score(lost,found)
    text=round(50*similarity)
    score=category+location+date+text
    conflicts=find_conflicts(lost,found)
    # Context alone and high semantic similarity must not override contradictions.
    if similarity < .45:
        score=min(score,49)
    if conflicts:
        score=min(score,49)
    return dict(lost_item_id=lost.get('id'),found_item_id=found.get('id'),score=score,
                category_score=category,location_score=location,date_score=date,
                text_score=text,semantic_similarity=round(similarity,6),conflicts=conflicts,
                method='multilingual_semantic_with_attribute_checks')


def score_pairs(lost_items,found_items,encoder):
    items=lost_items+found_items
    vectors=encoder.encode([evidence_text(item) for item in items])
    left,right=vectors[:len(lost_items)],vectors[len(lost_items):]
    rows=[]
    for a,av in zip(lost_items,left):
        for b,bv in zip(found_items,right):
            sim=sum(x*y for x,y in zip(av,bv)) if av and bv else 0
            result=calculate_robust_score(a,b,max(-1,min(1,sim)))
            if result is not None:
                rows.append(result)
    return sorted(rows,key=lambda r:(-r['score'],r['lost_item_id'],r['found_item_id']))


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',type=Path,default=RESULTS_FILE)
    args=parser.parse_args()
    import torch
    torch.set_num_threads(4)
    read=lambda name: json.loads((BASE_DIR/'data'/name).read_text())
    rows=score_pairs(read('lost_items.json'),read('found_items.json'),SemanticEncoder())
    args.output.write_text(json.dumps(rows,indent=2)+'\n')
    print(f'Saved {len(rows)} robust candidate scores to {args.output}')

if __name__=='__main__':
    main()
