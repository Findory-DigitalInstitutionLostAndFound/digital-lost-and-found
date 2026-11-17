"""Read-only local app smoke check; no login or database writes.

From repo root: backend/.venv/bin/python backend/verify_matching.py
"""
import json
from pathlib import Path
from fastapi.testclient import TestClient
from main import app


def main():
    results={'live_without_session':None,'dataset':{},'notes':['No signed-in Supabase session or real claim creation was tested.']}
    with TestClient(app) as client:
        r=client.get('/matches/live')
        assert r.status_code==401
        results['live_without_session']=r.status_code
        for source in ['combined','robust','baseline']:
            r=client.get('/matches/dataset',params={'source':source},headers={'Origin':'http://localhost:5173'})
            r.raise_for_status()
            assert r.headers.get('access-control-allow-origin')=='http://localhost:5173'
            rows=r.json()
            images=[row[side]['imageUrl'] for row in rows for side in ['lostItem','foundItem'] if row[side].get('imageUrl')]
            assert images
            image=client.get(images[0])
            assert image.status_code==200 and image.headers['content-type'].startswith('image/')
            results['dataset'][source]={'http_status':r.status_code,'cards':len(rows),'photo_references':len(images),'sample_photo_status':image.status_code,'cors_passed':True}
        assert client.get('/matches/dataset/images/not-an-item').status_code==404
    output=Path(__file__).resolve().parent.parent/'item_matching/evaluation/integration/endpoint_results.json'
    output.write_text(json.dumps(results,indent=2)+'\n')
    print(json.dumps(results,indent=2))

if __name__=='__main__': main()
