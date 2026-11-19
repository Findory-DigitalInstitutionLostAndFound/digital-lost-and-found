import pytest
from app.service import image_matching_service as service


@pytest.fixture(autouse=True)
def config(monkeypatch): monkeypatch.setenv('SUPABASE_URL','https://project.supabase.co')


@pytest.mark.parametrize('url',[
 'https://evil.test/storage/v1/object/public/cleaned_images/a.jpg',
 'http://project.supabase.co/storage/v1/object/public/cleaned_images/a.jpg',
 'https://project.supabase.co/storage/v1/object/public/original_images/a.jpg',
 'https://project.supabase.co/storage/v1/object/public/cleaned_images/%2e%2e/a.jpg',
 'file:///etc/passwd',None])
def test_untrusted_or_original_image_urls_are_not_fetched(url):
    assert service.storage_path(url) is None


def test_same_project_cleaned_image_path_is_accepted():
    assert service.storage_path('https://project.supabase.co/storage/v1/object/public/cleaned_images/folder/a.jpg')=='folder/a.jpg'


def test_missing_images_does_not_load_model(monkeypatch):
    monkeypatch.setattr(service,'clip_model',lambda:pytest.fail('must not load'))
    assert service.score_images([{'id':'L'}],[{'id':'F'}],[{'lost_item_id':'L','found_item_id':'F','score':90}],'token')[0]=={}


def test_live_image_scoring_uses_cleaned_paths_and_request_token(monkeypatch):
    monkeypatch.setattr(service,'clip_model',lambda:('processor','model'))
    downloads=[]
    monkeypatch.setattr(service,'download_cleaned',lambda path,token,timeout:downloads.append((path,token)) or b'image')
    monkeypatch.setattr(service,'embed_bytes',lambda *args:[1,0])
    make=lambda id:dict(id=id,blurred_image_url=f'https://project.supabase.co/storage/v1/object/public/cleaned_images/{id}.jpg')
    scores,status=service.score_images([make('L')],[make('F')],[dict(lost_item_id='L',found_item_id='F',score=90)],'session')
    assert scores=={('L','F'):1} and status=='available'
    assert downloads==[('L.jpg','session'),('F.jpg','session')]


def test_failed_download_falls_back_without_leaking_exception(monkeypatch):
    monkeypatch.setattr(service,'clip_model',lambda:(None,None))
    def fail(*args):raise RuntimeError('secret')
    monkeypatch.setattr(service,'download_cleaned',fail)
    make=lambda id:dict(id=id,blurred_image_url=f'https://project.supabase.co/storage/v1/object/public/cleaned_images/{id}.jpg')
    scores,status=service.score_images([make('L')],[make('F')],[dict(lost_item_id='L',found_item_id='F',score=90)],'token')
    assert not scores and status=='partial_or_unavailable'


def test_model_load_failure_preserves_text_fallback(monkeypatch):
    def fail():raise OSError('offline')
    monkeypatch.setattr(service,'clip_model',fail)
    make=lambda id:dict(id=id,blurred_image_url=f'https://project.supabase.co/storage/v1/object/public/cleaned_images/{id}.jpg')
    assert service.score_images([make('L')],[make('F')],[dict(lost_item_id='L',found_item_id='F',score=90)],'token')==({},'model_unavailable')


def test_image_count_budget_is_enforced(monkeypatch):
    monkeypatch.setattr(service,'MAX_IMAGES',1)
    monkeypatch.setattr(service,'clip_model',lambda:(None,None))
    calls=[]
    monkeypatch.setattr(service,'download_cleaned',lambda *args:calls.append(args) or b'image')
    monkeypatch.setattr(service,'embed_bytes',lambda *args:[1,0])
    make=lambda id:dict(id=id,blurred_image_url=f'https://project.supabase.co/storage/v1/object/public/cleaned_images/{id}.jpg')
    scores,status=service.score_images([make('L')],[make('F')],[dict(lost_item_id='L',found_item_id='F',score=90)],'token')
    assert len(calls)==1 and scores=={} and status=='partial_or_unavailable'
