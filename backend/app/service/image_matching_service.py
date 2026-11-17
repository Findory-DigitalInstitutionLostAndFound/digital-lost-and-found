"""Bounded, request-scoped CLIP scoring of cleaned images from configured Storage.

No arbitrary URL fetching, original images, redirects, or cross-user vector cache.
"""
import io
import math
import os
import time
from functools import lru_cache
from threading import Lock
from urllib.parse import unquote, urlsplit

import httpx

MODEL_NAME = 'openai/clip-vit-base-patch32'
IMAGE_LOCK = Lock()
MAX_IMAGES = 40
MAX_BYTES = 5 * 1024 * 1024
MAX_PIXELS = 20_000_000
DOWNLOAD_BUDGET_SECONDS = 20


def storage_path(url):
    if not isinstance(url, str):
        return None
    target, base = urlsplit(url), urlsplit(os.getenv('SUPABASE_URL', ''))
    if not base.netloc or target.scheme != base.scheme or target.netloc != base.netloc or target.username or target.fragment:
        return None
    prefixes = ['/storage/v1/object/public/cleaned_images/', '/storage/v1/object/sign/cleaned_images/', '/storage/v1/object/authenticated/cleaned_images/']
    for prefix in prefixes:
        if target.path.startswith(prefix):
            path = unquote(target.path[len(prefix):])
            if path and not any(p in ('', '.', '..') for p in path.split('/')) and '\\' not in path and '%' not in path:
                return path
    return None


def download_cleaned(path, token, timeout):
    # Rebuild endpoint from trusted configuration, never fetch a supplied URL directly.
    from urllib.parse import quote
    base = os.environ['SUPABASE_URL'].rstrip('/')
    url = base + '/storage/v1/object/authenticated/cleaned_images/' + quote(path, safe='/')
    headers = {'apikey': os.environ.get('SUPABASE_KEY', ''), 'Authorization': f'Bearer {token}'}
    chunks, size = [], 0
    started = time.monotonic()
    with httpx.stream('GET', url, headers=headers, timeout=timeout, follow_redirects=False) as response:
        response.raise_for_status()
        if response.headers.get('content-type', '').split(';')[0].lower() not in {'image/jpeg','image/png','image/webp'}:
            raise ValueError('Unsupported image type')
        for chunk in response.iter_bytes():
            if time.monotonic() - started > timeout:
                raise ValueError('Image download exceeded time budget')
            size += len(chunk)
            if size > MAX_BYTES:
                raise ValueError('Image exceeds size limit')
            chunks.append(chunk)
    return b''.join(chunks)


@lru_cache(maxsize=1)
def clip_model():
    from transformers import CLIPModel, CLIPProcessor
    import torch
    torch.set_num_threads(4)
    return CLIPProcessor.from_pretrained(MODEL_NAME), CLIPModel.from_pretrained(MODEL_NAME).eval()


def embed_bytes(data, processor, model):
    import torch
    from PIL import Image
    with Image.open(io.BytesIO(data)) as image:
        if image.width * image.height > MAX_PIXELS:
            raise ValueError('Image dimensions exceed limit')
        inputs = processor(images=image.convert('RGB'), return_tensors='pt')
    with torch.inference_mode():
        features = model.get_image_features(**inputs)
        if hasattr(features, 'pooler_output'):
            features = features.pooler_output
        return torch.nn.functional.normalize(features, p=2, dim=-1)[0].tolist()


def score_images(lost, found, rows, token):
    """Only text-eligible rows are supplied; return similarities and degraded-state IDs."""
    needed = {r[k] for r in rows for k in ['lost_item_id','found_item_id']}
    items = {r['id']: r for r in lost+found if r['id'] in needed}
    paths = {key: storage_path(row.get('blurred_image_url')) for key, row in items.items()}
    # Download only images participating in a pair with two valid cleaned URLs.
    pairs = [r for r in rows if paths.get(r['lost_item_id']) and paths.get(r['found_item_id'])]
    paired_ids = {r[k] for r in pairs for k in ['lost_item_id','found_item_id']}
    if not pairs:
        return {}, 'missing_or_unsupported_images'
    vectors, by_path = {}, {}
    start = time.monotonic()
    # Better text candidates receive the finite image budget first.
    ordered_ids = list(dict.fromkeys(r[k] for r in sorted(pairs,key=lambda r:-r['score']) for k in ['lost_item_id','found_item_id']))
    try:
        with IMAGE_LOCK:
            processor, model = clip_model()
            for key in ordered_ids:
                path = paths[key]
                if path in by_path:
                    vectors[key] = by_path[path]
                    continue
                remaining = DOWNLOAD_BUDGET_SECONDS - (time.monotonic()-start)
                if len(by_path) >= MAX_IMAGES or remaining <= 0:
                    break
                # Failed paths count toward the budget and are not downloaded repeatedly.
                by_path[path] = None
                try:
                    data = download_cleaned(path, token, min(3, remaining))
                    by_path[path] = embed_bytes(data, processor, model)
                    vectors[key] = by_path[path]
                except Exception:
                    continue
    except Exception:
        return {}, 'model_unavailable'
    similarities = {}
    for row in pairs:
        a,b = vectors.get(row['lost_item_id']), vectors.get(row['found_item_id'])
        if a is not None and b is not None:
            similarity = sum(x*y for x,y in zip(a,b))
            if math.isfinite(similarity):
                similarities[(row['lost_item_id'],row['found_item_id'])] = round(max(-1,min(1,similarity)),6)
    complete = all(vectors.get(key) is not None for key in paired_ids)
    return similarities, 'available' if complete else 'partial_or_unavailable'
