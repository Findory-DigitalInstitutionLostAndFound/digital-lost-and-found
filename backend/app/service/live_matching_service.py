import sys
from functools import lru_cache
from pathlib import Path
from threading import Lock

from fastapi import HTTPException
from app.core.supabase_user import get_user_supabase_client
from app.service.matching_service import display_item

ROOT = Path(__file__).resolve().parents[3]
FIELDS = 'id,user_id,item_type,title,category,public_description,location_name,event_timestamp,blurred_image_url,ai_tags'
MODEL_LOCK = Lock()


def fetch_all(query):
    rows = []
    for offset in range(0, 5000, 500):
        batch = query.range(offset, offset + 499).execute().data or []
        rows.extend(batch)
        if len(batch) < 500:
            return rows
    raise HTTPException(status_code=503, detail='Too many matching candidates; narrow candidate retrieval before retrying.')


@lru_cache(maxsize=1)
def encoder():
    path = str(ROOT / 'item_matching')
    if path not in sys.path:
        sys.path.insert(0, path)
    from matching.robust_matcher import SemanticEncoder
    import torch
    torch.set_num_threads(4)
    return SemanticEncoder()


def score_live(lost, found, source):
    path = str(ROOT / 'item_matching')
    if path not in sys.path:
        sys.path.insert(0, path)
    if source == 'baseline':
        from matching.text_matcher import calculate_match_score
        return [r for a in lost for b in found if (r := calculate_match_score(a, b)) is not None]
    from matching.robust_matcher import score_pairs
    with MODEL_LOCK:
        model = encoder()
        try:
            return score_pairs(lost, found, model)
        finally:
            # Do not retain descriptions from different users in an unbounded cache.
            model.cache.clear()


def live_item(item):
    # No private description, original image, contact information or secret code.
    safe = dict(item, description=item.get('public_description') or '')
    view = display_item(safe)
    url = item.get('blurred_image_url')
    view['imageUrl'] = url if isinstance(url, str) and url.startswith(('https://', 'http://')) else None
    return view


def get_live_matches(token, user_id, min_score=70, source='robust', top_k=3):
    if not user_id:
        raise HTTPException(status_code=401, detail='Not authenticated')
    try:
        client = get_user_supabase_client(token)
        lost = fetch_all(client.table('items').select(FIELDS).eq('item_type', 'lost').eq('status', 'open').eq('user_id', user_id))
        # Defence in depth if policies/client behaviour change.
        lost = [r for r in lost if r.get('user_id') == user_id and r.get('item_type') == 'lost']
        if not lost:
            return []
        found = fetch_all(client.table('items').select(FIELDS).eq('item_type', 'found').eq('status', 'open'))
        found = [r for r in found if r.get('item_type') == 'found' and r.get('user_id') != user_id]
        if not found:
            return []
        # Match only public evidence; do not expose or process another user's private description.
        left = [dict(r, description=r.get('public_description') or '') for r in lost]
        right = [dict(r, description=r.get('public_description') or '') for r in found]
        if len(left) * len(right) > 25000:
            raise HTTPException(status_code=503, detail='Too many candidate pairs. Narrow matching retrieval before retrying.')
        rows = score_live(left, right, source)
        claims = fetch_all(client.table('claims').select('item_id,status').eq('claimant_user_id', user_id).in_('status', ['pending', 'approved']))
        claimed = {r['item_id'] for r in claims}
        li, fi = {r['id']: r for r in lost}, {r['id']: r for r in found}
        selected, counts = [], {}
        for row in sorted(rows, key=lambda r: (-r['score'], r['found_item_id'])):
            a, b = row['lost_item_id'], row['found_item_id']
            if row['score'] < min_score or row.get('conflicts') or a not in li or b not in fi or counts.get(a, 0) >= top_k:
                continue
            lost_view, found_view = live_item(li[a]), live_item(fi[b])
            selected.append(dict(id=f'{a}:{b}', score=row['score'], method=source,
                imageSimilarity=None, status='confirmed' if b in claimed else 'pending',
                commonTags=sorted(set(lost_view['tags']) & set(found_view['tags'])),
                createdAt=found_view['date'], lostItem=lost_view, foundItem=found_view))
            counts[a] = counts.get(a, 0) + 1
        return selected
    except HTTPException:
        raise
    except (ImportError, OSError) as exc:
        raise HTTPException(status_code=503, detail='Semantic matching model unavailable. Install requirements-semantic.txt and download the model, or select baseline.') from exc
    except Exception as exc:
        raise HTTPException(status_code=503, detail='Could not load live matches. Check database access and matching configuration.') from exc
