"""Compare baseline and semantic methods on existing development fixtures.

These fixtures have informed implementation; this is not held-out validation.
"""
import copy
import json
import sys
from pathlib import Path

BASE=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(BASE))
from matching.robust_matcher import SemanticEncoder, score_pairs, MODEL_NAME
from matching.text_matcher import calculate_match_score
from run_checks import metrics, ranking


def main():
    import torch
    torch.set_num_threads(4)
    read=lambda path:json.loads((BASE/path).read_text())
    lost,found=read('data/lost_items.json'),read('data/found_items.json')
    truth={(r['lost_item_id'],r['found_item_id']) for r in read('evaluation/ground_truth.json') if r['is_match']}
    encoder=SemanticEncoder()
    robust=score_pairs(lost,found,encoder)
    baseline=[r for a in lost for b in found if (r:=calculate_match_score(a,b)) is not None]
    report={'model':MODEL_NAME,'notes':['Development comparison only: stress cases informed the implementation, not held-out validation.','Unlisted pairs treated as negatives; verify ground truth completeness.','Semantic gate .45 and score cutoff 70 are heuristic, not calibrated probabilities.'], 'dataset':{},'stress':[]}
    for name,rows in [('baseline',baseline),('robust',robust)]:
        report['dataset'][name]={'at_70':metrics(rows,truth,'score',70),'ranking':ranking(rows,truth,'score')}
    li,fi={r['id']:r for r in lost},{r['id']:r for r in found}
    for case in read('evaluation/stress/text_cases.json'):
        for metadata in ['description_only','original_title_tags']:
            a,b=copy.deepcopy(li[case['lost_id']]),copy.deepcopy(fi[case['found_id']])
            a['description'],b['description']=case['lost_description'],case['found_description']
            if metadata=='description_only':
                for item in [a,b]:
                    item['title']=''
                    item['ai_tags']=[]
            old=calculate_match_score(a,b)
            new=score_pairs([a],[b],encoder)[0]
            report['stress'].append(dict(id=case['id'],metadata=metadata,expected_match=case['expected_match'],baseline_score=old['score'],robust_score=new['score'],similarity=new['semantic_similarity'],conflicts=new['conflicts'],baseline_pass=(old['score']>=70)==case['expected_match'],robust_pass=(new['score']>=70)==case['expected_match']))
    report['summary']={f'{name}_stress_passed':sum(r[f'{name}_pass'] for r in report['stress']) for name in ['baseline','robust']}
    BASE.joinpath('robust_results.json').write_text(json.dumps(robust,indent=2)+'\n')
    Path(__file__).with_name('robust_comparison.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({'dataset':report['dataset'],'summary':report['summary']},indent=2),flush=True)
    for row in report['stress']:
        if not row['robust_pass']:print('Remaining failure:',row,flush=True)

if __name__=='__main__':
    main()
