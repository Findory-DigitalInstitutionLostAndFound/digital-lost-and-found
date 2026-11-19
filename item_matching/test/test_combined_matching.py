import pytest
from matching.combined_matcher import combine_rankings


def row(id,score=80,**kw):return dict(lost_item_id='L',found_item_id=id,score=score,**kw)


def test_images_break_text_ties_without_averaging_raw_scores():
    out=combine_rankings([row('A'),row('B')],{('L','A'):.6,('L','B'):.9})
    assert [r['found_item_id'] for r in out]==['B','A']
    assert all(r['textScore']==80 for r in out)


def test_images_cannot_rescue_rejected_pairs():
    assert combine_rankings([row('A',69),row('B',99,conflicts=['size'])],{('L','A'):1,('L','B'):1})==[]


def test_missing_images_preserve_text_order_and_report_fallback():
    out=combine_rankings([row('A',90),row('B',80)],{})
    assert [r['found_item_id'] for r in out]==['A','B']
    assert all(r['evidence']=='text-only' and r['imageSimilarity'] is None for r in out)


@pytest.mark.parametrize('score',[float('nan'),float('inf'),1.2,-1.2,None])
def test_invalid_image_similarity_is_missing(score):
    assert combine_rankings([row('A')],{('L','A'):score})[0]['evidence']=='text-only'


def test_ranks_are_per_lost_report():
    a=row('A');b=dict(row('B'),lost_item_id='L2')
    out=combine_rankings([a,b],{})
    assert out[0]['rankingScore']==out[1]['rankingScore']==100
