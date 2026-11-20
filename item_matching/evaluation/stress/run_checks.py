"""Repeatable quality audit. Run from any directory; leaves original data/results intact."""
import copy
import hashlib
import json
import sys
from collections import defaultdict
from pathlib import Path

BASE = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(BASE))
from matching.text_matcher import calculate_match_score
from matching.image_matcher import resolve_image_path


def read(path):
    return json.loads((BASE / path).read_text())


def metrics(rows, truth, field, threshold):
    predicted = {(r['lost_item_id'], r['found_item_id']) for r in rows if r[field] >= threshold}
    tp = len(predicted & truth)
    fp = len(predicted - truth)
    fn = len(truth - predicted)
    precision = tp / len(predicted) if predicted else 0
    recall = tp / len(truth) if truth else 0
    return dict(threshold=threshold, tp=tp, fp=fp, fn=fn, precision=round(precision,4), recall=round(recall,4), f1=round(2*precision*recall/(precision+recall),4) if precision+recall else 0)


def ranking(rows, truth, field):
    groups = defaultdict(list)
    for r in rows:
        groups[r['lost_item_id']].append(r)
    totals = {}
    for k in [1,3,5]:
        hits = 0
        for lost_id in {p[0] for p in truth}:
            candidates = sorted(groups[lost_id], key=lambda r: (-r[field], r['found_item_id']))[:k]
            hits += any((lost_id,r['found_item_id']) in truth for r in candidates)
        totals[f'hit_at_{k}'] = round(hits/len({p[0] for p in truth}),4)
    return totals


def main():
    lost, found = read('data/lost_items.json'), read('data/found_items.json')
    annotations = read('evaluation/ground_truth.json')
    truth = {(r['lost_item_id'],r['found_item_id']) for r in annotations if r['is_match']}
    rows = [score for a in lost for b in found if (score := calculate_match_score(a,b)) is not None]
    report = {'notes': ['Threshold metrics assume unlisted pairs are negatives (closed-world assumption); annotations are not exhaustive.', 'Ranking ties use found_item_id; synthetic stress cases are diagnostic, not an independent validation set.'], 'text': {'pairs':len(rows), 'thresholds':[metrics(rows,truth,'score',t) for t in [50,60,70,75,80,85,90]], 'ranking':ranking(rows,truth,'score')}}
    li, fi = {r['id']:r for r in lost}, {r['id']:r for r in found}
    cases=[]
    for c in read('evaluation/stress/text_cases.json'):
        for metadata in ['description_only', 'original_title_tags']:
            a,b=copy.deepcopy(li[c['lost_id']]),copy.deepcopy(fi[c['found_id']])
            a['description'],b['description']=c['lost_description'],c['found_description']
            if metadata == 'description_only':
                for item in [a,b]:
                    item['title']=''
                    item['ai_tags']=[]
            row=calculate_match_score(a,b)
            score=row['score'] if row else None
            predicted=score is not None and score >=70
            cases.append(dict(id=c['id'],metadata=metadata,expected_match=c['expected_match'],score=score,predicted_match=predicted,passed=predicted==c['expected_match']))
    report['text_stress']=cases
    images=read('image_results.json')
    report['saved_image']={'thresholds':[metrics(images,truth,'cosine_similarity',t) for t in [.7,.75,.8,.85,.9,.95]],'ranking':ranking(images,truth,'cosine_similarity')}
    available={r['id']:resolve_image_path(r) for r in lost+found}
    report['image_coverage']={'lost':sum(available[r['id']] is not None for r in lost),'found':sum(available[r['id']] is not None for r in found),'missing':[k for k,v in available.items() if v is None]}
    from PIL import Image
    hashes=defaultdict(list)
    corrupt=[]
    for key,path in available.items():
        if path:
            try:
                with Image.open(path) as im:
                    rgb=im.convert('RGB')
                    digest=hashlib.sha256(str(rgb.size).encode()+rgb.tobytes()).hexdigest()
                    hashes[digest].append(key)
            except Exception:
                corrupt.append(key)
    report['image_duplicates']=[ids for ids in hashes.values() if len(ids)>1]
    report['corrupt_images']=corrupt
    for kind,results,field,cutoff in [('text',rows,'score',70),('image',images,'cosine_similarity',.8)]:
        false=[r for r in results if r[field]>=cutoff and (r['lost_item_id'],r['found_item_id']) not in truth]
        missed=[list(pair) for pair in sorted(truth) if pair not in {(r['lost_item_id'],r['found_item_id']) for r in results if r[field]>=cutoff}]
        report[kind+'_errors']={'highest_false_positives':sorted(false,key=lambda r:r[field],reverse=True)[:10],'missed_pairs':missed}
    output=Path(__file__).with_name('quality_report.json')
    output.write_text(json.dumps(report,indent=2)+'\n')
    print('Saved',output)
    print('Text @70',report['text']['thresholds'][2])
    print('Image @0.8',report['saved_image']['thresholds'][2])
    print('Stress passed',sum(c['passed'] for c in cases),'/',len(cases))
    print('Ranking',report['text']['ranking'],report['saved_image']['ranking'])
    print('Duplicates',report['image_duplicates'])

if __name__=='__main__':
    main()
