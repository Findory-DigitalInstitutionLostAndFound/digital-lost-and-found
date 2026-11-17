import json
import pytest
from app.service import matching_service as service


@pytest.fixture
def dataset(tmp_path,monkeypatch):
    (tmp_path/'data').mkdir()
    lost=[dict(id='L',item_type='lost',title='wallet',ai_tags=['black'])]
    found=[dict(id=f'F{i}',item_type='found',title='wallet',ai_tags=['black']) for i in range(5)]
    rows=[dict(lost_item_id='L',found_item_id=f'F{i}',score=80,conflicts=[]) for i in range(5)]
    rows[4]['conflicts']=['different_screen_sizes']
    images=[dict(lost_item_id='L',found_item_id=f'F{i}',cosine_similarity=i/10) for i in range(5)]
    for path,data in [('data/lost_items.json',lost),('data/found_items.json',found),('robust_results.json',rows),('text_results.json',rows),('image_results.json',images)]:
        (tmp_path/path).write_text(json.dumps(data))
    monkeypatch.setattr(service,'MATCHING_DIR',tmp_path)
    return tmp_path


def test_images_only_break_ties_and_limit_is_per_lost_report(dataset):
    rows=service.get_dataset_matches()
    assert [r['foundItem']['id'] for r in rows]==['F3','F2','F1']


def test_conflicts_cannot_be_rescued_even_with_low_cutoff(dataset):
    rows=service.get_dataset_matches(min_score=0,top_k=None)
    assert len(rows)==4
    assert not any(r['foundItem']['id']=='F4' for r in rows)


def test_high_threshold_returns_no_match(dataset):
    assert service.get_dataset_matches(min_score=90)==[]


def test_missing_images_do_not_prevent_text_matches(dataset):
    (dataset/'image_results.json').unlink()
    rows=service.get_dataset_matches()
    assert rows and all(r['imageSimilarity'] is None for r in rows)


def test_baseline_remains_selectable(dataset):
    assert all(r['method']=='baseline' for r in service.get_dataset_matches(source='baseline'))


def test_missing_robust_results_do_not_silently_fall_back(dataset):
    (dataset/'robust_results.json').unlink()
    with pytest.raises(FileNotFoundError):
        service.get_dataset_matches()
    assert service.get_dataset_matches(source='baseline')


def test_private_fields_are_not_in_response(dataset):
    path=dataset/'data/lost_items.json'
    rows=json.loads(path.read_text())
    rows[0].update(secret_code='private',user_id='private',original_image_url='private')
    path.write_text(json.dumps(rows))
    item=service.get_dataset_matches()[0]['lostItem']
    assert not {'secret_code','user_id','original_image_url'} & item.keys()


def test_dataset_images_reject_paths_outside_test_directory(dataset):
    private=dataset/'secret.jpg';private.write_bytes(b'private')
    assert service.dataset_image_path({'id':'L','original_image_url':'../secret.jpg'}) is None


def test_sensitive_dataset_image_never_falls_back_to_original(dataset):
    image=dataset/'data/test_images/original.jpg'
    image.parent.mkdir();image.write_bytes(b'image')
    assert service.dataset_image_path({'has_sensitive_data':True,'original_image_url':'test_images/original.jpg'}) is None


def test_dataset_image_extension_resolution(dataset):
    image=dataset/'data/test_images/example.png'
    image.parent.mkdir();image.write_bytes(b'image')
    assert service.dataset_image_path({'original_image_url':'test_images/example.jpg'})==image


def test_dataset_alternative_extension_symlink_cannot_escape(dataset):
    folder=dataset/'data/test_images';folder.mkdir()
    secret=dataset/'private.png';secret.write_bytes(b'private')
    (folder/'example.png').symlink_to(secret)
    assert service.dataset_image_path({'original_image_url':'test_images/example.jpg'}) is None
