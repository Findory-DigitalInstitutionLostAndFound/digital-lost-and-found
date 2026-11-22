from fastapi import HTTPException
from app.core.supabase_user import get_user_supabase_client

def missing_table(error):
    return getattr(error, 'code', None) in {'PGRST205', '42P01'}


def load_dismissals(client, user_id):
    pairs = set()
    try:
        for offset in range(0,10000,500):
            rows = client.table('match_dismissals').select('lost_item_id,found_item_id').eq('user_id',user_id).range(offset,offset+499).execute().data or []
            pairs.update((r['lost_item_id'],r['found_item_id']) for r in rows)
            if len(rows)<500:
                return pairs, True
        raise HTTPException(status_code=503,detail='Too many saved dismissals to load safely.')
    except Exception as exc:
        if missing_table(exc):
            return set(), False
        if isinstance(exc,HTTPException): raise
        raise HTTPException(status_code=503,detail='Could not load your saved dismissals.') from exc


def save_dismissal(token,user_id,lost_id,found_id):
    if not user_id:
        raise HTTPException(status_code=401,detail='Not authenticated')
    if lost_id==found_id:
        raise HTTPException(status_code=422,detail='Lost and found reports must be different.')
    try:
        client=get_user_supabase_client(token)
        lost=client.table('items').select('id,user_id,item_type,status').eq('id',lost_id).eq('user_id',user_id).eq('item_type','lost').eq('status','open').execute().data or []
        found=client.table('items').select('id,user_id,item_type,status').eq('id',found_id).eq('item_type','found').eq('status','open').execute().data or []
        if not lost or not found or lost[0].get('user_id')!=user_id or found[0].get('user_id')==user_id:
            raise HTTPException(status_code=404,detail='Eligible reports not found.')
        claims=client.table('claims').select('id').eq('claimant_user_id',user_id).eq('item_id',found_id).in_('status',['pending','approved']).execute().data or []
        if claims:
            raise HTTPException(status_code=409,detail='You already have an active claim for this found item.')
        client.table('match_dismissals').upsert(dict(user_id=user_id,lost_item_id=lost_id,found_item_id=found_id),on_conflict='user_id,lost_item_id,found_item_id',ignore_duplicates=True).execute()
        return {'status':'dismissed'}
    except HTTPException: raise
    except Exception as exc:
        raise HTTPException(status_code=503,detail='Could not save dismissal. Please retry.') from exc


def restore_dismissal(token,user_id,lost_id,found_id):
    if not user_id:
        raise HTTPException(status_code=401,detail='Not authenticated')
    try:
        client=get_user_supabase_client(token)
        client.table('match_dismissals').delete().eq('user_id',user_id).eq('lost_item_id',lost_id).eq('found_item_id',found_id).execute()
        return {'status':'restored'}
    except Exception as exc:
        raise HTTPException(status_code=503, detail='Could not restore dismissal. Please retry.') from exc
