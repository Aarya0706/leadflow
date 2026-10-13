from datetime import datetime, timezone
from typing import Annotated

from pydantic import (
    AfterValidator,
    AwareDatetime,
    BaseModel,
    BeforeValidator,
    ConfigDict,
    StringConstraints,
    field_validator,
)

from app.models import Lead, LeadStatus


def _blank_to_none(value):
    """Treat empty or whitespace-only strings as 'not provided'."""
    if isinstance(value, str):
        value = value.strip()
        return value or None
    return value


# Timestamps must carry a timezone (the frontend sends ISO strings with an offset
# or "Z"); they are normalised to UTC. Naive values are rejected as ambiguous.
UTCDatetime = Annotated[AwareDatetime, AfterValidator(lambda v: v.astimezone(timezone.utc))]
RequiredName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=120)]
OptionalCompany = Annotated[
    Annotated[str, StringConstraints(max_length=120)] | None, BeforeValidator(_blank_to_none)
]
OptionalPhone = Annotated[
    Annotated[str, StringConstraints(max_length=30)] | None, BeforeValidator(_blank_to_none)
]


class LeadCreate(BaseModel):
    name: RequiredName
    company: OptionalCompany = None
    phone: OptionalPhone = None
    status: LeadStatus = LeadStatus.NEW


class LeadUpdate(BaseModel):
    """Partial update: only fields present in the request body are changed."""

    name: RequiredName | None = None
    company: OptionalCompany = None
    phone: OptionalPhone = None
    status: LeadStatus | None = None

    @field_validator("name", "status")
    @classmethod
    def _not_null(cls, value):
        # These fields may be omitted, but cannot be explicitly set to null.
        if value is None:
            raise ValueError("This field cannot be null")
        return value


class LeadOut(BaseModel):
    id: int
    name: str
    company: str | None
    phone: str | None
    status: LeadStatus
    follow_up_at: datetime | None
    created_at: datetime
    last_note: str | None
    last_discussion_at: datetime | None

    @classmethod
    def from_row(cls, lead: Lead, last_note: str | None, last_discussion_at: datetime | None):
        return cls(
            id=lead.id,
            name=lead.name,
            company=lead.company,
            phone=lead.phone,
            status=lead.status,
            follow_up_at=lead.follow_up_at,
            created_at=lead.created_at,
            last_note=last_note,
            last_discussion_at=last_discussion_at,
        )


class DiscussionCreate(BaseModel):
    note: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=5000)]
    # Omitting this (or sending null) clears the lead's follow-up: logging a
    # discussion means the previous follow-up has been acted on.
    follow_up_at: UTCDatetime | None = None


class DiscussionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    lead_id: int
    note: str
    follow_up_at: datetime | None
    is_system: bool
    created_at: datetime
