import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
GROUND_TRUTH_FILE = BASE_DIR / "evaluation" / "ground_truth.json"
RESULTS_FILE = BASE_DIR / "baseline_results.json"


def load_ground_truth():
    with open(GROUND_TRUTH_FILE, "r", encoding="utf-8") as file:
        return json.load(file)


def load_results():
    with open(RESULTS_FILE, "r", encoding="utf-8") as file:
        return json.load(file)


def get_true_pairs(ground_truth):
    pairs = set()

    for item in ground_truth:
        if item.get("is_match") is True:
            pairs.add(
                (item["lost_item_id"], item["found_item_id"])
            )

    return pairs


def main():
    ground_truth = load_ground_truth()
    results = load_results()

    true_pairs = get_true_pairs(ground_truth)

    predicted_pairs = {
        (item["lost_item_id"], item["found_item_id"])
        for item in results
        if item.get("score", 0) > 0
    }

    true_positives = len(predicted_pairs & true_pairs)
    false_positives = len(predicted_pairs - true_pairs)
    false_negatives = len(true_pairs - predicted_pairs)

    precision = (
        true_positives / (true_positives + false_positives)
        if true_positives + false_positives
        else 0
    )

    recall = (
        true_positives / (true_positives + false_negatives)
        if true_positives + false_negatives
        else 0
    )

    f1 = (
        2 * precision * recall / (precision + recall)
        if precision + recall
        else 0
    )

    print("\n===== BASELINE EVALUATION =====\n")

    print(f"True matches:      {len(true_pairs)}")
    print(f"Predicted matches: {len(predicted_pairs)}")
    print(f"True positives:    {true_positives}")
    print(f"False positives:   {false_positives}")
    print(f"False negatives:   {false_negatives}")

    print()
    print(f"Precision: {precision:.2%}")
    print(f"Recall:    {recall:.2%}")
    print(f"F1-score:  {f1:.2%}")


if __name__ == "__main__":
    main()