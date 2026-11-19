"""Development comparison of rank fusion, using existing saved measured scores."""
import json
import sys
from pathlib import Path
BASE=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(BASE))
from matching.combined_matcher import combine_rankings, TEXT_WEIGHT, RANK_CONSTANT
from run_checks import ranking


def main():
    read=lambda path:json.loads((BASE/path).read_text())
    text=read('robust_results.json'); images=read('image_results.json')
    truth={(r['lost_item_id'],r['found_item_id']) for r in read('evaluation/ground_truth.json') if r['is_match']}
    image_map={(r['lost_item_id'],r['found_item_id']):r['cosine_similarity'] for r in images}
    eligible=[r for r in text if r['score']>=70 and not r.get('conflicts')]
    fused=combine_rankings(text,image_map)
    missing=combine_rankings(text,{})
    report={'notes':['Existing development dataset; not held-out validation.','Text cutoff 70 determines eligibility; combined ranking cannot add rejected pairs.','Image-only ranking includes all date-valid image pairs, so candidate sets differ.','Rank fusion weights are heuristic and were not selected by optimizing this report.'],
        'text_weight':TEXT_WEIGHT,'rank_constant':RANK_CONSTANT,
        'text_only':ranking(eligible,truth,'score'),
        'image_only':ranking(images,truth,'cosine_similarity'),
        'combined':ranking(fused,truth,'rankingScore'),
        'all_images_missing':ranking(missing,truth,'rankingScore'),
        'eligible_pairs':len(eligible),'combined_pairs':len(fused),
        'available_image_pairs':sum(r['imageSimilarity'] is not None for r in fused)}
    assert {(r['lost_item_id'],r['found_item_id']) for r in fused}=={(r['lost_item_id'],r['found_item_id']) for r in eligible}
    Path(__file__).with_name('combined_comparison.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))

if __name__=='__main__':main()
