from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app import crud
from app.database import get_db
from app.deps import get_lead_or_404
from app.models import Lead, LeadStatus
from app.schemas import LeadCreate, LeadOut, LeadUpdate

router = APIRouter(prefix="/leads", tags=["leads"])


def _out(db: Session, lead_id: int) -> LeadOut:
    lead = crud.get_lead_out(db, lead_id)
    if lead is None:  # only possible if the row vanished mid-request
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=f"Lead {lead_id} not found")
    return lead


@router.get("", response_model=list[LeadOut])
def list_leads(
    status_filter: LeadStatus | None = Query(None, alias="status", description="Filter by status"),
    q: str | None = Query(None, max_length=120, description="Search name or company"),
    db: Session = Depends(get_db),
):
    return crud.list_leads(db, status=status_filter, q=q)


@router.post("", response_model=LeadOut, status_code=status.HTTP_201_CREATED)
def create_lead(payload: LeadCreate, db: Session = Depends(get_db)):
    lead = crud.create_lead(db, payload)
    return _out(db, lead.id)


@router.get("/{lead_id}", response_model=LeadOut)
def get_lead(lead: Lead = Depends(get_lead_or_404), db: Session = Depends(get_db)):
    return _out(db, lead.id)


@router.patch("/{lead_id}", response_model=LeadOut)
def update_lead(
    payload: LeadUpdate,
    lead: Lead = Depends(get_lead_or_404),
    db: Session = Depends(get_db),
):
    crud.update_lead(db, lead, payload)
    return _out(db, lead.id)
