import json
from datetime import datetime
from pathlib import Path

# File paths
BASE_DIR = Path(__file__).resolve().parent.parent

LOST_FILE = BASE_DIR / "data" / "lost_items.json"
FOUND_FILE = BASE_DIR / "data" / "found_items.json"
RESULTS_FILE = BASE_DIR / "baseline_results.json"

# Load data
with open(LOST_FILE, "r", encoding="utf-8") as file:
    lost_items = json.load(file)

with open(FOUND_FILE, "r", encoding="utf-8") as file:
    found_items = json.load(file)

# Helper functions
def category_score(lost_item, found_item):
    """
    Give 40 points if the categories are the same.
    """
    if lost_item["category"].lower() == found_item["category"].lower():
        return 40

    return 0


def location_score(lost_item, found_item):
    """
    Give 30 points if the locations are the same.
    Give 15 points if one location contains the other.
    Otherwise give 0.
    """

    lost_location = lost_item["location_name"].lower()
    found_location = found_item["location_name"].lower()

    if lost_location == found_location:
        return 30

    if lost_location in found_location or found_location in lost_location:
        return 15

    return 0


def date_score(lost_item, found_item):
    """
    Compare the lost and found dates.

    Same day       -> 30 points
    1 day apart    -> 20 points
    2 days apart   -> 10 points
    More than 2    -> 0 points
    """

    lost_date = datetime.fromisoformat(
        lost_item["event_timestamp"]
    )

    found_date = datetime.fromisoformat(
        found_item["event_timestamp"]
    )

    difference = abs((lost_date - found_date).days)

    if difference == 0:
        return 30

    if difference <= 1:
        return 20

    if difference <= 2:
        return 10
    
    return 0

# Calculate total match score
def calculate_match_score(lost_item, found_item):
    category = category_score(lost_item, found_item)
    location = location_score(lost_item, found_item)
    date = date_score(lost_item, found_item)

    total = category + location + date

    return {
        "lost_item_id": lost_item["id"],
        "found_item_id": found_item["id"],
        "score": total,
        "category_score": category,
        "location_score": location,
        "date_score": date,
    }

# Find matches
all_matches = []

for lost_item in lost_items:
    for found_item in found_items:

        result = calculate_match_score(
            lost_item,
            found_item
        )

        all_matches.append(result)

# Sort matches
all_matches.sort(
    key=lambda match: match["score"],
    reverse=True
)

with open(RESULTS_FILE, "w", encoding="utf-8") as file:
    json.dump(all_matches, file, indent=2)

# Display results
print("\n===== BASELINE MATCHING RESULTS =====\n")

for match in all_matches[:20]:

    print(
        f'{match["lost_item_id"]} → '
        f'{match["found_item_id"]} '
        f'| Score: {match["score"]}% '
        f'| Category: {match["category_score"]} '
        f'| Location: {match["location_score"]} '
        f'| Date: {match["date_score"]}'
    )