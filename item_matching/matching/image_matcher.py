"""Image-only matching using pretrained CLIP image embeddings.

Images must exist locally. Common image extensions are resolved when a dataset
reference uses a different extension from the local file.

From item_matching:
    pip install -r requirements-image.txt
    python matching/image_matcher.py

The first run downloads the pretrained model and may require internet access.
No model training/fine-tuning is performed.
"""
import json
import math
from pathlib import Path

try:  
    from matching.date_utils import is_chronologically_valid
except ModuleNotFoundError:
    from date_utils import is_chronologically_valid

BASE_DIR = Path(__file__).resolve().parent.parent
LOST_FILE = BASE_DIR / "data" / "lost_items.json"
FOUND_FILE = BASE_DIR / "data" / "found_items.json"
RESULTS_FILE = BASE_DIR / "image_results.json"
MANIFEST_FILE = BASE_DIR / "image_manifest.json"
MODEL_NAME = "openai/clip-vit-base-patch32"


def resolve_image_path(item):
    """Resolve the first existing local image referenced by a report."""
    for field in ("original_image_url", "blurred_image_url"):
        value = item.get(field)
        if not value:
            continue
        raw_path = Path(str(value))
        candidates = [raw_path] if raw_path.is_absolute() else [
            BASE_DIR / raw_path,
            BASE_DIR / "data" / raw_path,
        ]
        for candidate in candidates:
            if candidate.is_file():
                return candidate.resolve()
        # Test datasets may reference .jpg while the supplied image is .jpeg/.png.
        # Only accept an unambiguous alternative with the exact same stem.
        for candidate in candidates:
            alternatives = [
                candidate.with_suffix(suffix)
                for suffix in (".jpg", ".jpeg", ".png", ".webp", ".bmp")
                if candidate.with_suffix(suffix).is_file()
            ]
            if len(alternatives) == 1:
                return alternatives[0].resolve()
    return None


def cosine_similarity(vector_a, vector_b):
    """Calculate cosine similarity for two non-empty numeric vectors."""
    if len(vector_a) != len(vector_b) or not vector_a:
        raise ValueError("Embeddings must be non-empty vectors of equal length")
    dot = sum(float(a) * float(b) for a, b in zip(vector_a, vector_b))
    norm_a = math.sqrt(sum(float(a) ** 2 for a in vector_a))
    norm_b = math.sqrt(sum(float(b) ** 2 for b in vector_b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def load_items(path):
    with open(path, "r", encoding="utf-8") as file:
        return json.load(file)


def main():
    lost_items = load_items(LOST_FILE)
    found_items = load_items(FOUND_FILE)
    lost_paths = {item["id"]: resolve_image_path(item) for item in lost_items}
    found_paths = {item["id"]: resolve_image_path(item) for item in found_items}
    available_lost = [item for item in lost_items if lost_paths[item["id"]] is not None]
    available_found = [item for item in found_items if found_paths[item["id"]] is not None]

    if not available_lost or not available_found:
        raise SystemExit(
            "No usable local images were found for both lost and found reports. "
            "Add images under item_matching/data/test_images/ "
            "or update original_image_url/blurred_image_url before running image matching."
        )

    try:
        import torch
        from PIL import Image
        from transformers import CLIPModel, CLIPProcessor
    except ImportError as exc:
        raise SystemExit(
            "Image matching dependencies are missing. Run: "
            "pip install -r requirements-image.txt"
        ) from exc

    print(f"Loading pretrained model: {MODEL_NAME}")
    processor = CLIPProcessor.from_pretrained(MODEL_NAME)
    model = CLIPModel.from_pretrained(MODEL_NAME)
    model.eval()
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model.to(device)
    embeddings = {}

    def embed(path):
        key = str(path)
        if key not in embeddings:
            with Image.open(path) as image:
                image = image.convert("RGB")
                inputs = processor(images=image, return_tensors="pt")
            inputs = {name: tensor.to(device) for name, tensor in inputs.items()}
            with torch.no_grad():
                features = model.get_image_features(**inputs)
                # Transformers 5 returns a model output; older versions return a tensor.
                if hasattr(features, "pooler_output"):
                    features = features.pooler_output
                features = torch.nn.functional.normalize(features, p=2, dim=-1)
            embeddings[key] = features[0].detach().cpu().tolist()
        return embeddings[key]

    # Cache each image embedding once, then compare all available lost/found pairs.
    all_matches = []
    for lost_item in available_lost:
        lost_embedding = embed(lost_paths[lost_item["id"]])
        for found_item in available_found:
            # Never propose a match when the found date is earlier than the lost date.
            if not is_chronologically_valid(lost_item, found_item):
                continue
            found_embedding = embed(found_paths[found_item["id"]])
            similarity = cosine_similarity(lost_embedding, found_embedding)
            all_matches.append({
                "lost_item_id": lost_item["id"],
                "found_item_id": found_item["id"],
                "cosine_similarity": round(similarity, 6),
            })

    all_matches.sort(key=lambda match: match["cosine_similarity"], reverse=True)
    with open(RESULTS_FILE, "w", encoding="utf-8") as file:
        json.dump(all_matches, file, indent=2)

    print("\n===== IMAGE MATCHING RESULTS =====\n")
    print(f"Lost reports with images:  {len(available_lost)} / {len(lost_items)}")
    print(f"Found reports with images: {len(available_found)} / {len(found_items)}")
    print(f"Candidate pairs compared:  {len(all_matches)}")
    print(f"Saved results to: {RESULTS_FILE}")
    print("Top 20 candidates (cosine similarity is not a probability):")
    for match in all_matches[:20]:
        print(
            f'{match["lost_item_id"]} → {match["found_item_id"]} '
            f'| Cosine similarity: {match["cosine_similarity"]:.4f}'
        )


if __name__ == "__main__":
    main()
