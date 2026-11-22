from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.routers import matches as routes
from app.api.deps import get_current_user


def test_live_route_requires_session():
    app=FastAPI();app.include_router(routes.router)
    with TestClient(app) as client:
        assert client.get('/matches/live').status_code==401


def test_live_route_uses_verified_identity_and_cookie(monkeypatch):
    app=FastAPI();app.include_router(routes.router)
    app.dependency_overrides[get_current_user]=lambda:{'sub':'verified-user'}
    captured=[]
    monkeypatch.setattr(routes,'get_live_matches',lambda *args:captured.append(args) or [])
    with TestClient(app) as client:
        client.cookies.set('access_token','session-token')
        assert client.get('/matches/live?source=baseline&top_k=2').status_code==200
        assert captured==[('session-token','verified-user',70,'baseline',2)]
        assert client.get('/matches/live?source=bad').status_code==422
        assert client.get('/matches/live?top_k=0').status_code==422


def test_dismissal_mutations_require_authentication():
    app=FastAPI();app.include_router(routes.router)
    body={'lost_item_id':'00000000-0000-4000-8000-000000000001','found_item_id':'00000000-0000-4000-8000-000000000002'}
    with TestClient(app) as client:
        assert client.put('/matches/dismissals',json=body).status_code==401
        assert client.request('DELETE','/matches/dismissals',json=body).status_code==401


def test_dismissal_route_uses_verified_user_not_payload(monkeypatch):
    app=FastAPI();app.include_router(routes.router)
    app.dependency_overrides[get_current_user]=lambda:{'sub':'verified-user'}
    captured=[]
    monkeypatch.setattr(routes,'save_dismissal',lambda *args:captured.append(args) or {'status':'dismissed'})
    body={'lost_item_id':'00000000-0000-4000-8000-000000000001','found_item_id':'00000000-0000-4000-8000-000000000002','user_id':'attacker'}
    with TestClient(app) as client:
        client.cookies.set('access_token','session')
        assert client.put('/matches/dismissals',json=body).status_code==200
        assert captured[0]==('session','verified-user',body['lost_item_id'],body['found_item_id'])
        assert client.put('/matches/dismissals',json={'lost_item_id':'bad','found_item_id':'bad'}).status_code==422
