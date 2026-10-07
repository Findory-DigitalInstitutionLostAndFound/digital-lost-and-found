import json
from datetime import datetime
from pathlib import Path
from difflib import SequenceMatcher

BASE_DIR = Path(__file__).resolve().parent.parent

LOST_FILE = BASE_DIR / "data" / "lost_items.json"
FOUND_FILE = BASE_DIR / "data" / "found_items.json"
RESULTS_FILE = BASE_DIR / "text_results.json"


with open(LOST_FILE, "r", encoding="utf-8") as file:
    lost_items = json.load(file)

with open(FOUND_FILE, "r", encoding="utf-8") as file:
    found_items = json.load(file)


def category_score(lost_item, found_item):
    if lost_item["category"].lower() == found_item["category"].lower():
        return 20

    return 0


def location_score(lost_item, found_item):
    lost_location = lost_item["location_name"].lower()
    found_location = found_item["location_name"].lower()

    if lost_location == found_location:
        return 15

    if lost_location in found_location or found_location in lost_location:
        return 8

    return 0


def date_score(lost_item, found_item):
    lost_date = datetime.fromisoformat(
        lost_item["event_timestamp"]
    )

    found_date = datetime.fromisoformat(
        found_item["event_timestamp"]
    )

    difference = abs((lost_date - found_date).days)

    if difference == 0:
        return 15

    if difference <= 1:
        return 10

    if difference <= 2:
        return 5

    return 0


def text_similarity(lost_item, found_item):
    lost_text = " ".join([
        lost_item.get("title", ""),
        lost_item.get("description", ""),
        " ".join(lost_item.get("ai_tags", []))
    ]).lower()

    found_text = " ".join([
        found_item.get("title", ""),
        found_item.get("description", ""),
        " ".join(found_item.get("ai_tags", []))
    ]).lower()

    return SequenceMatcher(
        None,
        lost_text,
        found_text
    ).ratio()


def calculate_match_score(lost_item, found_item):

    category = category_score(
        lost_item,
        found_item
    )

    location = location_score(
        lost_item,
        found_item
    )

    date = date_score(
        lost_item,
        found_item
    )

    similarity = text_similarity(
        lost_item,
        found_item
    )

    text_score = round(similarity * 50)

    total = (
        category
        + location
        + date
        + text_score
    )

    return {
        "lost_item_id": lost_item["id"],
        "found_item_id": found_item["id"],
        "score": total,
        "category_score": category,
        "location_score": location,
        "date_score": date,
        "text_score": text_score,
        "text_similarity": round(similarity, 3),
    }


def main():

    all_matches = []

    for lost_item in lost_items:
        for found_item in found_items:

            result = calculate_match_score(
                lost_item,
                found_item
            )

            all_matches.append(result)

    all_matches.sort(
        key=lambda match: match["score"],
        reverse=True
    )

    with open(RESULTS_FILE, "w", encoding="utf-8") as file:
        json.dump(
            all_matches,
            file,
            indent=2
        )

    print("\n===== TEXT MATCHING RESULTS =====\n")

    for match in all_matches[:20]:

        print(
            f'{match["lost_item_id"]} → '
            f'{match["found_item_id"]} '
            f'| Score: {match["score"]}/100 '
            f'| Category: {match["category_score"]} '
            f'| Location: {match["location_score"]} '
            f'| Date: {match["date_score"]} '
            f'| Text: {match["text_score"]}'
        )


if __name__ == "__main__":
    main()