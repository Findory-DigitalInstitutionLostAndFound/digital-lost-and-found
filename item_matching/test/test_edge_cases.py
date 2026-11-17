import pytest
from matching.text_matcher import calculate_match_score, text_similarity
from matching.date_utils import is_chronologically_valid, days_between_valid_events
from matching.image_matcher import cosine_similarity


def item(**kwargs):
    return dict(id='test', title='', description='', ai_tags=[], category='', location_name='', **kwargs)


@pytest.mark.parametrize('date',[None,'','invalid','2026-99-99'])
def test_unknown_dates_do_not_reject_candidates(date):
    lost,found=item(event_timestamp=date),item(event_timestamp='2026-11-13')
    assert is_chronologically_valid(lost,found)
    assert days_between_valid_events(lost,found) is None
    assert calculate_match_score(lost,found)['date_score']==0


def test_missing_all_evidence_scores_zero():
    assert calculate_match_score({}, {})['score']==0


@pytest.mark.parametrize('value',[None,'',[],['red',None],123])
def test_text_values_are_safe(value):
    assert 0<=text_similarity({'description':value},{'description':value})<=1


def test_earlier_day_is_rejected():
    assert calculate_match_score(item(event_timestamp='2026-11-14'),item(event_timestamp='2026-11-13')) is None


def test_date_rule_is_calendar_day_not_exact_instant():
    # Current intentional rule: reverse times on the same day remain candidates.
    assert is_chronologically_valid(item(event_timestamp='2026-11-13T18:00:00'),item(event_timestamp='2026-11-13T09:00:00'))


@pytest.mark.parametrize('a,b,expected',[([1,0],[1,0],1),([1,0],[0,1],0),([1,0],[-1,0],-1),([0,0],[1,0],0),([2,0],[9,0],1)])
def test_cosine_geometry(a,b,expected):
    assert cosine_similarity(a,b)==pytest.approx(expected)


@pytest.mark.parametrize('a,b',[([],[]),([1],[1,2])])
def test_bad_embedding_shapes_raise(a,b):
    with pytest.raises(ValueError):
        cosine_similarity(a,b)
