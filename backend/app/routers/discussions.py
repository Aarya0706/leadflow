from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app import crud
from app.database import get_db
from app.deps import get_lead_or_404
from app.models import Lead
from app.schemas import DiscussionCreate, DiscussionOut

router = APIRouter(prefix="/leads/{lead_id}/discussions", tags=["discussions"])


@router.get("", response_model=list[DiscussionOut])
def list_discussions(lead: Lead = Depends(get_lead_or_404), db: Session = Depends(get_db)):
    """Full history, newest first."""
    return crud.list_discussions(db, lead.id)


@router.post("", response_model=DiscussionOut, status_code=status.HTTP_201_CREATED)
def create_discussion(
    payload: DiscussionCreate,
    lead: Lead = Depends(get_lead_or_404),
    db: Session = Depends(get_db),
):
    """Log a discussion. Also sets (or clears) the lead's follow-up."""
    return crud.add_discussion(db, lead, payload)
