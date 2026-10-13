"""Database operations. Routers stay thin; the business rules live here."""

from sqlalchemy import func, select
from sqlalchemy.orm import Session, aliased

from app.models import Discussion, Lead, LeadStatus
from app.schemas import DiscussionCreate, LeadCreate, LeadOut, LeadUpdate


def _leads_with_last_note():
    """SELECT leads plus their 'last note', in a single query (no N+1).

    The last note is the most recent note written by the rep. System entries
    only count as a fallback, so a status change never hides the real last
    conversation, while a brand-new lead still shows "Lead created".
    """
    latest = aliased(Discussion)
    latest_id = (
        select(latest.id)
        .where(latest.lead_id == Lead.id)
        .order_by(latest.is_system.asc(), latest.created_at.desc(), latest.id.desc())
        .limit(1)
        .correlate(Lead)
        .scalar_subquery()
    )
    return select(
        Lead,
        Discussion.note.label("last_note"),
        Discussion.created_at.label("last_discussion_at"),
    ).outerjoin(Discussion, Discussion.id == latest_id)


def list_leads(db: Session, status: LeadStatus | None = None, q: str | None = None) -> list[LeadOut]:
    stmt = _leads_with_last_note()
    if status is not None:
        stmt = stmt.where(Lead.status == status)
    if q and q.strip():
        term = q.strip()
        stmt = stmt.where(
            Lead.name.icontains(term, autoescape=True) | Lead.company.icontains(term, autoescape=True)
        )
    # Most recently active first; the client pins today's follow-ups on top.
    stmt = stmt.order_by(
        func.coalesce(Discussion.created_at, Lead.created_at).desc(), Lead.id.desc()
    )
    return [LeadOut.from_row(*row) for row in db.execute(stmt).all()]


def get_lead_out(db: Session, lead_id: int) -> LeadOut | None:
    row = db.execute(_leads_with_last_note().where(Lead.id == lead_id)).first()
    return LeadOut.from_row(*row) if row else None


def create_lead(db: Session, data: LeadCreate) -> Lead:
    lead = Lead(**data.model_dump())
    # Adding the system entry through the relationship inserts both rows in one
    # transaction, so a lead is never created without its first timeline entry.
    lead.discussions.append(Discussion(note="Lead created", is_system=True))
    db.add(lead)
    db.commit()
    return lead


def update_lead(db: Session, lead: Lead, data: LeadUpdate) -> Lead:
    changes = data.model_dump(exclude_unset=True)
    old_status = lead.status
    for field, value in changes.items():
        setattr(lead, field, value)
    if lead.status != old_status:
        lead.discussions.append(
            Discussion(
                note=f"Status changed from {old_status.value} to {lead.status.value}",
                is_system=True,
            )
        )
    db.commit()
    return lead


def list_discussions(db: Session, lead_id: int) -> list[Discussion]:
    stmt = (
        select(Discussion)
        .where(Discussion.lead_id == lead_id)
        .order_by(Discussion.created_at.desc(), Discussion.id.desc())
    )
    return list(db.scalars(stmt))


def add_discussion(db: Session, lead: Lead, data: DiscussionCreate) -> Discussion:
    discussion = Discussion(lead_id=lead.id, note=data.note, follow_up_at=data.follow_up_at)
    # Same transaction: the note and the lead's follow-up always change together.
    lead.follow_up_at = data.follow_up_at
    db.add(discussion)
    db.commit()
    return discussion
