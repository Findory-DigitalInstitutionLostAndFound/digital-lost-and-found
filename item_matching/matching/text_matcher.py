import json
from pathlib import Path
from difflib import SequenceMatcher

try:
    from matching.date_utils import days_between_valid_events, is_chronologically_valid
except ModuleNotFoundError:
    from date_utils import days_between_valid_events, is_chronologically_valid


BASE_DIR = Path(__file__).resolve().parent.parent
LOST_FILE = BASE_DIR / "data" / "lost_items.json"
FOUND_FILE = BASE_DIR / "data" / "found_items.json"
RESULTS_FILE = BASE_DIR / "text_results.json"


def normalise_text(value):
    """Convert strings, lists, None, or other values to safe lowercase text."""
    if value is None:
        return ""
    if isinstance(value, list):
        return " ".join(str(item) for item in value if item is not None).strip().lower()
    return str(value).strip().lower()


def category_score(lost_item, found_item):
    lost_category = normalise_text(lost_item.get("category"))
    found_category = normalise_text(found_item.get("category"))
    if lost_category and found_category and lost_category == found_category:
        return 20
    return 0


def location_score(lost_item, found_item):
    lost_location = normalise_text(lost_item.get("location_name"))
    found_location = normalise_text(found_item.get("location_name"))

    # Do not let a missing/empty location match every other location.
    if not lost_location or not found_location:
        return 0
    if lost_location == found_location:
        return 15
    if lost_location in found_location or found_location in lost_location:
        return 8
    return 0


def date_score(lost_item, found_item):
    difference = days_between_valid_events(lost_item, found_item)
    if difference is None:
        return 0
    if difference == 0:
        return 15
    if difference == 1:
        return 10
    if difference == 2:
        return 5
    return 0


def text_similarity(lost_item, found_item):
    """Compare title, description, and AI tags using character-sequence similarity."""
    lost_text = " ".join(
        normalise_text(lost_item.get(field))
        for field in ("title", "description", "ai_tags")
    ).strip()
    found_text = " ".join(
        normalise_text(found_item.get(field))
        for field in ("title", "description", "ai_tags")
    ).strip()

    if not lost_text or not found_text:
        return 0.0

    return SequenceMatcher(None, lost_text, found_text).ratio()


def calculate_match_score(lost_item, found_item):
    """Return a scored candidate, or None for an impossible date ordering."""
    if not is_chronologically_valid(lost_item, found_item):
        return None

    category = category_score(lost_item, found_item)
    location = location_score(lost_item, found_item)
    date = date_score(lost_item, found_item)
    similarity = text_similarity(lost_item, found_item)
    text_score = round(similarity * 50)

    return {
        "lost_item_id": lost_item.get("id"),
        "found_item_id": found_item.get("id"),
        "score": category + location + date + text_score,
        "category_score": category,
        "location_score": location,
        "date_score": date,
        "text_score": text_score,
        "text_similarity": round(similarity, 3),
    }


def main():
    with open(LOST_FILE, "r", encoding="utf-8") as file:
        lost_items = json.load(file)
    with open(FOUND_FILE, "r", encoding="utf-8") as file:
        found_items = json.load(file)

    all_matches = []
    excluded_count = 0

    for lost_item in lost_items:
        for found_item in found_items:
            result = calculate_match_score(lost_item, found_item)
            if result is None:
                excluded_count += 1
                continue
            all_matches.append(result)

    all_matches.sort(key=lambda match: match["score"], reverse=True)

    with open(RESULTS_FILE, "w", encoding="utf-8") as file:
        json.dump(all_matches, file, indent=2)

    print("\n===== TEXT MATCHING RESULTS =====\n")
    print(f"Valid candidate pairs: {len(all_matches)}")
    print(f"Excluded impossible date pairs: {excluded_count}\n")

    for match in all_matches[:20]:
        print(
            f'{match["lost_item_id"]} → {match["found_item_id"]} '
            f'| Score: {match["score"]}/100 '
            f'| Category: {match["category_score"]} '
            f'| Location: {match["location_score"]} '
            f'| Date: {match["date_score"]} '
            f'| Text: {match["text_score"]}'
        )


if __name__ == "__main__":
    main()