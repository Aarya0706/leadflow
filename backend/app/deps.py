from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Lead


def get_lead_or_404(lead_id: int, db: Session = Depends(get_db)) -> Lead:
    lead = db.get(Lead, lead_id)
    if lead is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=f"Lead {lead_id} not found")
    return lead
