from fastapi import APIRouter, Response, Request, HTTPException
from app.schemas.items_schema import FoundItemRequestSchema
from app.service.sensitive_data_service import is_sensitive_text

router = APIRouter()

@router.post("/found-items")
async def create_found_item(payload: FoundItemRequestSchema, request: Request):
    """Recieve a found item and check if it contains sensitive data."""
    # Get the prsidio analyzer that was loaded at startup
    analyzer = request.app.state.pii_analyzer

    description = payload.description.strip()

    if not description:
        raise HTTPException(status_code=400, detail="Description cannot be empty.")

    if is_sensitive_text(description, analyzer):
        return {
            "status": "rejected",
            "message": "The description contains sensitive data.Please remove names, codes, serial numbers, ids, HETU before submitting."
        }
    return {
        "status": "accepted",
        "message": "The description is clean. Your found item has been successfully submitted."
    }
