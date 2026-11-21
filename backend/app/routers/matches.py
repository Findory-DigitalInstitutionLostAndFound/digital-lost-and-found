from typing import Literal
from fastapi import APIRouter, HTTPException, Query
from app.service.matching_service import get_dataset_matches

router = APIRouter(prefix="/matches", tags=["matching"])


@router.get("/dataset")
def dataset_matches(
    min_score: int = Query(default=70, ge=0, le=100),
    source: Literal["combined", "robust", "baseline"] = "combined",
    top_k: int = Query(default=3, ge=1, le=20),
):
    try:
        return get_dataset_matches(min_score, source, top_k)
    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Matching files are missing. Generate {source} results with the corresponding matcher first.",
        ) from exc


# Imported here to keep the dataset scorer independent of auth/model setup.
from fastapi import Depends, Request
from app.api.deps import get_current_user
from app.service.live_matching_service import get_live_matches


@router.get('/live')
def live_matches(
    request: Request,
    current_user: dict = Depends(get_current_user),
    min_score: int = Query(default=70, ge=0, le=100),
    source: Literal['combined', 'robust', 'baseline'] = 'combined',
    top_k: int = Query(default=3, ge=1, le=20),
):
    token = request.cookies.get('access_token')
    if not token:
        raise HTTPException(status_code=401, detail='Not authenticated')
    return get_live_matches(token, current_user.get('sub'), min_score, source, top_k)


@router.get('/dataset/images/{item_id}')
def dataset_image(item_id: str):
    from fastapi.responses import FileResponse
    from app.service.matching_service import get_dataset_image
    path = get_dataset_image(item_id)
    if path is None:
        raise HTTPException(status_code=404, detail='Dataset image not available')
    return FileResponse(path)


from uuid import UUID
from pydantic import BaseModel
from app.service.match_dismissal_service import save_dismissal, restore_dismissal


class DismissalRequest(BaseModel):
    lost_item_id: UUID
    found_item_id: UUID


@router.put('/dismissals')
def dismiss_match(payload: DismissalRequest, request: Request, current_user: dict = Depends(get_current_user)):
    token = request.cookies.get('access_token')
    if not token:
        raise HTTPException(status_code=401, detail='Not authenticated')
    return save_dismissal(token,current_user.get('sub'),str(payload.lost_item_id),str(payload.found_item_id))


@router.delete('/dismissals')
def restore_match(payload: DismissalRequest, request: Request, current_user: dict = Depends(get_current_user)):
    token = request.cookies.get('access_token')
    if not token:
        raise HTTPException(status_code=401, detail='Not authenticated')
    return restore_dismissal(token,current_user.get('sub'),str(payload.lost_item_id),str(payload.found_item_id))
