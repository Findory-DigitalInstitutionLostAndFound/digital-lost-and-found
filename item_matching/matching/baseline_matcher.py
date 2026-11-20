import json
from pathlib import Path

try:
    from matching.date_utils import days_between_valid_events, is_chronologically_valid
except ModuleNotFoundError:
    from date_utils import days_between_valid_events, is_chronologically_valid


BASE_DIR = Path(__file__).resolve().parent.parent
LOST_FILE = BASE_DIR / "data" / "lost_items.json"
FOUND_FILE = BASE_DIR / "data" / "found_items.json"
RESULTS_FILE = BASE_DIR / "baseline_results.json"


def normalise_text(value):
    """Convert a possibly missing field to trimmed lowercase text."""
    if value is None:
        return ""
    return str(value).strip().lower()


def category_score(lost_item, found_item):
    """Return 40 points when both non-empty categories match."""
    lost_category = normalise_text(lost_item.get("category"))
    found_category = normalise_text(found_item.get("category"))

    if lost_category and found_category and lost_category == found_category:
        return 40
    return 0


def location_score(lost_item, found_item):
    """Exact location: 30 points; partial containment: 15; otherwise 0."""
    lost_location = normalise_text(lost_item.get("location_name"))
    found_location = normalise_text(found_item.get("location_name"))

    # Empty strings must not count as a partial match against every string.
    if not lost_location or not found_location:
        return 0
    if lost_location == found_location:
        return 30
    if lost_location in found_location or found_location in lost_location:
        return 15
    return 0


def date_score(lost_item, found_item):
    """Same day: 30; one day apart: 20; two days apart: 10; otherwise 0."""
    difference = days_between_valid_events(lost_item, found_item)

    if difference is None:
        return 0
    if difference == 0:
        return 30
    if difference == 1:
        return 20
    if difference == 2:
        return 10
    return 0


def calculate_match_score(lost_item, found_item):
    """Return a scored candidate, or None for an impossible date ordering."""
    if not is_chronologically_valid(lost_item, found_item):
        return None

    category = category_score(lost_item, found_item)
    location = location_score(lost_item, found_item)
    date = date_score(lost_item, found_item)

    return {
        "lost_item_id": lost_item.get("id"),
        "found_item_id": found_item.get("id"),
        "score": category + location + date,
        "category_score": category,
        "location_score": location,
        "date_score": date,
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

    print("\n===== BASELINE MATCHING RESULTS =====\n")
    print(f"Valid candidate pairs: {len(all_matches)}")
    print(f"Excluded impossible date pairs: {excluded_count}\n")

    for match in all_matches[:20]:
        print(
            f'{match["lost_item_id"]} → {match["found_item_id"]} '
            f'| Score: {match["score"]}/100 '
            f'| Category: {match["category_score"]} '
            f'| Location: {match["location_score"]} '
            f'| Date: {match["date_score"]}'
        )


if __name__ == "__main__":
    main()