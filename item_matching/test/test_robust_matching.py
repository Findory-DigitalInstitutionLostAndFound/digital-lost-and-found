"""No model download needed: test safety rules independently of embeddings."""
import pytest
from matching.robust_matcher import calculate_robust_score, find_conflicts, evidence_text, score_pairs


def item(description='Black leather wallet with a red sticker', **changes):
    row=dict(id='a',description=description,title='Wallet',category='wallet',location_name='Library',event_timestamp='2026-11-13',ai_tags=['black'])
    row.update(changes)
    return row


@pytest.mark.parametrize('left,right,reason',[
    ('13-inch laptop','17-inch laptop','different_screen_sizes'),
    ('Laptop with thirteen inches display','Laptop with seventeen-inch display','different_screen_sizes'),
    ('three silver keys','one silver key, not three','different_key_counts'),
    ('Black leather wallet with a red sticker','Black leather wallet without a red sticker','sticker_present_vs_absent'),
    ('Green backpack with a white logo','Orange backpack with a black logo','different_object_colours'),
])
def test_explicit_conflicts_cannot_be_overridden_by_similarity(left,right,reason):
    row=calculate_robust_score(item(left),item(right),.99)
    assert reason in row['conflicts']
    assert row['score']<70
    assert find_conflicts(item(left),item(right))==find_conflicts(item(right),item(left))


@pytest.mark.parametrize('left,right',[
    ('Black wallet with red sticker','Black wallet'),
    ('Green backpack, white logo','Green backpack with a blue logo'),
    ('Grey phone','Gray phone'),
    ('13-inch laptop','thirteen-inch laptop'),
    ('three silver keys','three keys'),
    ('Black wallet with no sticker','Black wallet without a sticker'),
    ('Case costs 13 euros','Case costs 17 euros'),
])
def test_missing_or_equivalent_details_are_not_conflicts(left,right):
    assert find_conflicts(item(left),item(right))==[]


def test_unrelated_semantics_cannot_pass_on_context_alone():
    assert calculate_robust_score(item(),item('Lunch box'),.1)['score']<70


def test_no_text_does_not_receive_semantic_points():
    empty=dict(description='',title='',ai_tags=[])
    assert calculate_robust_score(item(**empty),item(**empty),1)['text_score']==0


def test_same_day_same_evidence_can_score_100():
    assert calculate_robust_score(item(),item(),1)['score']==100


def test_chronology_still_rejects_pair():
    assert calculate_robust_score(item(event_timestamp='2026-11-14'),item(),1) is None


@pytest.mark.parametrize('similarity',[float('nan'),float('inf'),1.1,-1.1])
def test_invalid_semantics_raise(similarity):
    with pytest.raises(ValueError):
        calculate_robust_score(item(),item(),similarity)


def test_description_takes_precedence_over_stale_tags():
    assert evidence_text(item('Lunch box',title='Wallet',ai_tags=['wallet']))=='lunch box'


def test_title_tags_are_fallback_for_missing_description():
    assert evidence_text(item(None))=='wallet black'


def test_score_pairs_without_model_returns_sorted_candidates():
    class FakeEncoder:
        def encode(self,texts):
            return [[1,0] for _ in texts]
    rows=score_pairs([item(id='lost')],[item(id='z'),item(id='a')],FakeEncoder())
    assert [r['found_item_id'] for r in rows]==['a','z']
