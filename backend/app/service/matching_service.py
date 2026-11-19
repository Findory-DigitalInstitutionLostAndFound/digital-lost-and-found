import json
from pathlib import Path

MATCHING_DIR = Path(__file__).resolve().parents[3] / "item_matching"


def load_json(path):
    with path.open(encoding="utf-8") as file:
        return json.load(file)


def display_item(item):
    return {
        "id": item["id"],
        "type": item["item_type"],
        "title": item.get("title", ""),
        "description": item.get("description", ""),
        "location": item.get("location_name", ""),
        "date": item.get("event_timestamp", "").split("T")[0],
        "tags": item.get("ai_tags") or [],
    }


def get_dataset_matches(min_score=70, source="combined", top_k=3):
    """Return up to top_k candidates per lost report; never rescue conflicts with images."""
    if source not in {"baseline", "robust", "combined"}:
        raise ValueError("Unknown matching source")
    if top_k is not None and top_k < 1:
        raise ValueError("top_k must be positive")
    lost = {item["id"]: item for item in load_json(MATCHING_DIR / "data/lost_items.json")}
    found = {item["id"]: item for item in load_json(MATCHING_DIR / "data/found_items.json")}
    image_path = MATCHING_DIR / "image_results.json"
    images = {
        (row["lost_item_id"], row["found_item_id"]): row["cosine_similarity"]
        for row in (load_json(image_path) if image_path.exists() else [])
    }
    matches = []
    results_file = "robust_results.json" if source != "baseline" else "text_results.json"
    for row in load_json(MATCHING_DIR / results_file):
        lost_id, found_id = row["lost_item_id"], row["found_item_id"]
        if row["score"] < min_score or row.get("conflicts") or lost_id not in lost or found_id not in found:
            continue
        lost_item, found_item = display_item(lost[lost_id]), display_item(found[found_id])
        for view, item in [(lost_item, lost[lost_id]), (found_item, found[found_id])]:
            view['imageUrl'] = f"/matches/dataset/images/{item['id']}" if dataset_image_path(item) else None
        matches.append({
            "id": f"{lost_id}:{found_id}",
            "score": row["score"],
            "method": source,
            "imageSimilarity": images.get((lost_id, found_id)) if source == "combined" else None,
            "status": "pending",
            "commonTags": sorted(set(lost_item["tags"]) & set(found_item["tags"])),
            "createdAt": found_item["date"],
            "lostItem": lost_item,
            "foundItem": found_item,
        })
    if source == "combined":
        import sys
        if str(MATCHING_DIR) not in sys.path:
            sys.path.insert(0, str(MATCHING_DIR))
        from matching.combined_matcher import combine_rankings
        scores = [dict(lost_item_id=m['lostItem']['id'], found_item_id=m['foundItem']['id'], score=m['score']) for m in matches]
        fused = combine_rankings(scores, images, min_score)
        views = {m['id']:m for m in matches}
        matches = [dict(views[f"{r['lost_item_id']}:{r['found_item_id']}"], rankingScore=r['rankingScore'], textScore=r['textScore'], imageSimilarity=r['imageSimilarity'], evidence=r['evidence']) for r in fused]
    # Text-only methods retain deterministic text order for a clean comparison.
    if source != "combined":
        matches.sort(key=lambda m: (-m["score"], m["id"]))
    counts = {}
    selected = []
    for match in matches:
        lost_id = match["lostItem"]["id"]
        if top_k is None or counts.get(lost_id, 0) < top_k:
            selected.append(match)
            counts[lost_id] = counts.get(lost_id, 0) + 1
    return selected


def dataset_image_path(item):
    """Allow only local test images; never serve arbitrary paths from JSON."""
    allowed = (MATCHING_DIR / 'data' / 'test_images').resolve()
    fields = ['blurred_image_url'] if item.get('has_sensitive_data') else ['blurred_image_url', 'original_image_url']
    for field in fields:
        value = item.get(field)
        if not isinstance(value, str):
            continue
        candidate = (MATCHING_DIR / 'data' / value).resolve()
        if not candidate.is_relative_to(allowed):
            continue
        suffixes = ['.jpg', '.jpeg', '.png', '.webp']
        if candidate.suffix.lower() in suffixes and candidate.is_file():
            return candidate
        alternatives = [candidate.with_suffix(s).resolve() for s in suffixes
                        if candidate.with_suffix(s).is_file()
                        and candidate.with_suffix(s).resolve().is_relative_to(allowed)]
        if len(alternatives) == 1:
            return alternatives[0]
    return None


def get_dataset_image(item_id):
    for name in ['lost_items.json', 'found_items.json']:
        for item in load_json(MATCHING_DIR / 'data' / name):
            if item['id'] == item_id:
                return dataset_image_path(item)
    return None
