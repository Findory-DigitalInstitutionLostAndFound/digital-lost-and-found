from types import SimpleNamespace
import pytest
from fastapi import HTTPException
from app.service import match_dismissal_service as service


class Query:
    def __init__(self, db, name): self.db=db; self.name=name; self.filters=[]; self.action=None; self.data=None; self.first=0; self.last=9999
    def select(self, fields): return self
    def eq(self,key,value): self.filters.append(lambda row:row.get(key)==value); return self
    def in_(self,key,values): self.filters.append(lambda row:row.get(key) in values); return self
    def range(self,first,last): self.first,self.last=first,last; return self
    def upsert(self,data,**kwargs): self.action='upsert';self.data=data;return self
    def delete(self): self.action='delete';return self
    def execute(self):
        rows=self.db[self.name]
        chosen=[r for r in rows if all(f(r) for f in self.filters)]
        if self.action=='upsert':
            if self.data not in rows: rows.append(self.data)
            return SimpleNamespace(data=[self.data])
        if self.action=='delete':
            self.db[self.name]=[r for r in rows if r not in chosen]
        return SimpleNamespace(data=chosen[self.first:self.last+1])


@pytest.fixture
def db(monkeypatch):
    db={'items':[dict(id='L',user_id='me',item_type='lost',status='open'),dict(id='F',user_id='other',item_type='found',status='open')], 'claims':[], 'match_dismissals':[]}
    class Client:
        def table(self,name): return Query(db,name)
    client=Client()
    monkeypatch.setattr(service,'get_user_supabase_client',lambda token:client)
    return db,client


def test_dismissal_is_idempotent_and_does_not_mutate_items(db):
    data,client=db
    service.save_dismissal('token','me','L','F');service.save_dismissal('token','me','L','F')
    assert len(data['match_dismissals'])==1
    assert all(r['status']=='open' for r in data['items'])
    assert service.load_dismissals(client,'me')==({('L','F')},True)


def test_other_user_cannot_dismiss_someone_elses_lost_item(db):
    with pytest.raises(HTTPException) as error: service.save_dismissal('token','attacker','L','F')
    assert error.value.status_code==404 and not db[0]['match_dismissals']


def test_cannot_dismiss_own_found_report(db):
    db[0]['items'][1]['user_id']='me'
    with pytest.raises(HTTPException) as error: service.save_dismissal('token','me','L','F')
    assert error.value.status_code==404


def test_existing_claim_prevents_dismissal(db):
    db[0]['claims']=[dict(id='C',item_id='F',claimant_user_id='me',status='pending')]
    with pytest.raises(HTTPException) as error: service.save_dismissal('token','me','L','F')
    assert error.value.status_code==409


def test_restore_cannot_delete_other_users_review(db):
    data,client=db
    service.save_dismissal('token','me','L','F')
    service.restore_dismissal('token','other','L','F')
    assert service.load_dismissals(client,'me')[0]=={('L','F')}
    service.restore_dismissal('token','me','L','F')
    assert service.load_dismissals(client,'me')[0]==set()


def test_missing_table_keeps_matching_readable_but_disables_sync():
    class Missing(Exception): code='PGRST205'
    class Client:
        def table(self,name):raise Missing()
    assert service.load_dismissals(Client(),'me')==(set(),False)


def test_other_database_errors_are_not_silently_ignored():
    class Client:
        def table(self,name):raise RuntimeError('private details')
    with pytest.raises(HTTPException) as error:service.load_dismissals(Client(),'me')
    assert 'private' not in error.value.detail
