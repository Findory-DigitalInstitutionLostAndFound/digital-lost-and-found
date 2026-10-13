import pytest
from matching.text_matcher import category_score, location_score, date_score, text_similarity, calculate_match_score


def make_item(item_id="L001", category="Headphones", location="Library",
              timestamp="2026-10-12T12:00:00", title="Black wireless headphones",
              description="Black headphones with a red carrying case",
              ai_tags=("black", "wireless", "red case")):
    return {
        "id": item_id, "category": category, "location_name": location,
        "event_timestamp": timestamp, "title": title, "description": description,
        "ai_tags": list(ai_tags) if ai_tags is not None else None,
    }


# Category scoring
def test_same_category_gets_full_points():
    assert category_score(make_item(category="Headphones"), make_item(category="Headphones")) == 20


def test_category_is_case_insensitive():
    assert category_score(make_item(category="HEADPHONES"), make_item(category="headphones")) == 20


def test_different_categories_get_zero_points():
    assert category_score(make_item(category="Headphones"), make_item(category="Backpack")) == 0


# Location scoring
def test_same_location_gets_full_points():
    assert location_score(make_item(location="Main Library"), make_item(location="Main Library")) == 15


def test_location_is_case_insensitive():
    assert location_score(make_item(location="MAIN LIBRARY"), make_item(location="main library")) == 15


def test_partial_location_match_gets_partial_points():
    assert location_score(make_item(location="Library"), make_item(location="Main Library")) == 8


def test_unrelated_locations_get_zero_points():
    assert location_score(make_item(location="Library"), make_item(location="Sports Hall")) == 0


# Date scoring
def test_same_day_gets_full_date_points():
    assert date_score(make_item(timestamp="2026-10-12T09:00:00"), make_item(timestamp="2026-10-12T18:00:00")) == 15


def test_one_day_apart_gets_ten_points():
    assert date_score(make_item(timestamp="2026-10-12T09:00:00"), make_item(timestamp="2026-10-13T09:00:00")) == 10


def test_two_days_apart_gets_five_points():
    assert date_score(make_item(timestamp="2026-10-12T09:00:00"), make_item(timestamp="2026-10-14T09:00:00")) == 5


def test_more_than_two_days_apart_gets_zero_points():
    assert date_score(make_item(timestamp="2026-10-12T09:00:00"), make_item(timestamp="2026-10-15T09:00:00")) == 0


def test_date_score_is_symmetric():
    a = make_item(timestamp="2026-10-12T09:00:00")
    b = make_item(timestamp="2026-10-13T09:00:00")
    assert date_score(a, b) == date_score(b, a)


# Text similarity
def test_identical_text_has_similarity_one():
    item = make_item()
    assert text_similarity(item, item) == pytest.approx(1.0)


def test_similar_descriptions_score_higher_than_unrelated_descriptions():
    lost = make_item()
    similar = make_item(title="Black Bluetooth headphones", description="Black wireless headphones and red case", ai_tags=("black", "Bluetooth", "red case"))
    unrelated = make_item(title="Blue backpack", description="Large blue backpack with several pockets", ai_tags=("blue", "bag", "pockets"))
    assert text_similarity(lost, similar) > text_similarity(lost, unrelated)


def test_different_text_scores_lower_than_identical_text():
    item = make_item()
    other = make_item(title="Yellow umbrella", description="Foldable umbrella with a wooden handle", ai_tags=("yellow", "umbrella"))
    assert text_similarity(item, other) < text_similarity(item, item)


def test_empty_tag_lists_do_not_crash():
    assert 0.0 <= text_similarity(make_item(ai_tags=[]), make_item(ai_tags=[])) <= 1.0


def test_empty_title_and_description_do_not_crash():
    a = make_item(title="", description="", ai_tags=[])
    b = make_item(title="", description="", ai_tags=[])
    assert text_similarity(a, b) == pytest.approx(0.0)


# Combined score
def test_exact_match_scores_100():
    result = calculate_match_score(make_item(item_id="L001"), make_item(item_id="F001"))
    assert result["score"] == 100
    assert result["category_score"] == 20
    assert result["location_score"] == 15
    assert result["date_score"] == 15
    assert result["text_score"] == 50


def test_result_contains_lost_and_found_ids():
    result = calculate_match_score(make_item(item_id="L123"), make_item(item_id="F456"))
    assert result["lost_item_id"] == "L123"
    assert result["found_item_id"] == "F456"


def test_score_is_within_zero_to_one_hundred():
    lost = make_item()
    unrelated = make_item(item_id="F999", category="Backpack", location="Sports Hall", timestamp="2026-10-20T12:00:00", title="Green backpack", description="Large green backpack", ai_tags=("green", "bag"))
    assert 0 <= calculate_match_score(lost, unrelated)["score"] <= 100


def test_exact_match_scores_higher_than_unrelated_item():
    lost = make_item()
    exact = make_item(item_id="F001")
    unrelated = make_item(item_id="F002", category="Backpack", location="Sports Hall", timestamp="2026-10-20T12:00:00", title="Green backpack", description="Large green backpack", ai_tags=("green", "bag"))
    assert calculate_match_score(lost, exact)["score"] > calculate_match_score(lost, unrelated)["score"]


# Robustness tests
def test_missing_ai_tags_are_handled():
    a, b = make_item(), make_item()
    a.pop("ai_tags")
    b.pop("ai_tags")
    assert 0.0 <= text_similarity(a, b) <= 1.0


def test_none_description_is_handled():
    a = make_item(description=None)
    b = make_item(description="A black wireless headset")
    assert 0.0 <= text_similarity(a, b) <= 1.0


def test_none_ai_tags_are_handled():
    a = make_item(ai_tags=None)
    b = make_item(ai_tags=[])
    assert 0.0 <= text_similarity(a, b) <= 1.0
