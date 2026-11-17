from types import SimpleNamespace
import pytest
from fastapi import HTTPException
from app.service import live_matching_service as service


def item(id, type='found', user='other', **kwargs):
    return dict(id=id, item_type=type, user_id=user, status='open', title='Wallet', category='wallet',
        public_description='Black wallet with a red sticker', description='PRIVATE DESCRIPTION',
        secret_code='PRIVATE CODE', original_image_url='https://private/original',
        blurred_image_url='https://example.test/clean.jpg', location_name='Library',
        event_timestamp='2026-11-17', ai_tags=['black'], **kwargs)


class Query:
    def __init__(self, rows): self.rows=rows
    def select(self, fields): return self
    def eq(self, key, value): self.rows=[r for r in self.rows if r.get(key)==value]; return self
    def in_(self, key, values): self.rows=[r for r in self.rows if r.get(key) in values]; return self
    def range(self, first, last): self.first=first; self.last=last; return self
    def execute(self): return SimpleNamespace(data=self.rows[self.first:self.last+1])


@pytest.fixture
def setup(monkeypatch):
    db={'items':[item('L', 'lost', 'me'),item('OTHER-LOST','lost','other'),item('F'),item('OWN-FOUND',user='me')], 'claims':[]}
    class Client:
        def table(self, name): return Query(list(db[name]))
    monkeypatch.setattr(service,'get_user_supabase_client',lambda token:Client())
    def scorer(lost, found, source):
        assert [r['id'] for r in lost]==['L']
        assert all(r['user_id']!='me' for r in found)
        assert all(r['description']==r['public_description'] for r in lost+found)
        return [dict(lost_item_id=a['id'],found_item_id=b['id'],score=90,conflicts=[]) for a in lost for b in found]
    monkeypatch.setattr(service,'score_live',scorer)
    return db


def test_matches_only_owned_lost_reports_and_excludes_own_found(setup):
    rows=service.get_live_matches('token','me')
    assert len(rows)==1 and rows[0]['lostItem']['id']=='L' and rows[0]['foundItem']['id']=='F'


def test_only_cleaned_public_evidence_is_returned(setup):
    row=service.get_live_matches('token','me')[0]
    assert row['imageSimilarity'] is None
    for key in ['lostItem','foundItem']:
        assert row[key]['description']=='Black wallet with a red sticker'
        assert row[key]['imageUrl']=='https://example.test/clean.jpg'
        assert not {'secret_code','user_id','original_image_url'} & row[key].keys()


def test_existing_claim_restores_confirmation(setup):
    setup['claims']=[dict(item_id='F',status='pending',claimant_user_id='me')]
    assert service.get_live_matches('token','me')[0]['status']=='confirmed'


def test_other_users_claim_does_not_change_status(setup):
    setup['claims']=[dict(item_id='F',status='pending',claimant_user_id='other')]
    assert service.get_live_matches('token','me')[0]['status']=='pending'


def test_no_owned_lost_reports_returns_empty_without_model(setup):
    assert service.get_live_matches('token','nobody')==[]


def test_closed_reports_are_excluded(setup):
    setup['items'][2]['status']='resolved'
    assert service.get_live_matches('token','me')==[]


def test_top_k_and_conflicts_are_enforced(setup,monkeypatch):
    setup['items'] += [item('F2'),item('F3')]
    monkeypatch.setattr(service,'score_live',lambda *args:[dict(lost_item_id='L',found_item_id='F',score=99,conflicts=['different_size']),dict(lost_item_id='L',found_item_id='F2',score=80,conflicts=[]),dict(lost_item_id='L',found_item_id='F3',score=75,conflicts=[])])
    rows=service.get_live_matches('token','me',top_k=1)
    assert [r['foundItem']['id'] for r in rows]==['F2']


def test_missing_identity_is_unauthorized(setup):
    with pytest.raises(HTTPException) as error: service.get_live_matches('token',None)
    assert error.value.status_code==401


def test_missing_public_description_does_not_leak_private_data(setup):
    setup['items'][2]['public_description']=None
    # Scoring receives the empty public evidence, not private description.
    setup['items'][2]['public_description']=''
    row=service.get_live_matches('token','me')[0]
    assert row['foundItem']['description']==''


def test_database_errors_are_sanitized(monkeypatch):
    def fail(token): raise RuntimeError('sensitive database info')
    monkeypatch.setattr(service,'get_user_supabase_client',fail)
    with pytest.raises(HTTPException) as error: service.get_live_matches('token','me')
    assert 'sensitive' not in error.value.detail


def test_actual_baseline_scoring_with_live_record_format(setup,monkeypatch):
    # Exercise real scoring (without downloading a model), not only our scorer stub.
    import sys
    from pathlib import Path
    sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'item_matching'))
    from matching.text_matcher import calculate_match_score
    monkeypatch.setattr(service,'score_live',lambda left,right,source:[r for a in left for b in right if (r:=calculate_match_score(a,b)) is not None])
    rows=service.get_live_matches('token','me',source='baseline')
    assert len(rows)==1 and rows[0]['score']==100
