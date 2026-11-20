import json
import os
import sys
from pathlib import Path
from unittest.mock import patch
ROOT=Path(__file__).resolve().parent.parent
sys.path.insert(0,str(ROOT/'item_matching'))
from app.service import image_matching_service as service
from matching.combined_matcher import combine_rankings


def main():
    base='https://fixture.supabase.co/storage/v1/object/public/cleaned_images/'
    lost=dict(id='L',blurred_image_url=base+'lost_001.jpeg')
    found=dict(id='F',blurred_image_url=base+'found_001.jpeg')
    rows=[dict(lost_item_id='L',found_item_id='F',score=90)]
    def local_download(path,token,timeout):
        return (ROOT/'item_matching/data/test_images'/path).read_bytes()
    with patch.dict(os.environ,{'SUPABASE_URL':'https://fixture.supabase.co'}), patch.object(service,'download_cleaned',side_effect=local_download):
        scores,status=service.score_images([lost],[found],rows,'synthetic-token')
    assert status=='available' and ('L','F') in scores
    combined=combine_rankings(rows,scores)[0]
    assert combined['evidence']=='text+image'
    assert combine_rankings(rows,{})[0]['evidence']=='text-only'
    report=dict(test='actual CLIP inference through live image scoring',storage_download='mocked with local dataset image bytes',database_writes=False,status=status,cosine=scores[('L','F')],evidence=combined['evidence'],missing_image_fallback='passed')
    (ROOT/'item_matching/evaluation/integration/combined_model_smoke.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))

if __name__=='__main__':main()
