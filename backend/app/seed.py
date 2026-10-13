"""Seed the database with realistic demo data.

    python -m app.seed            # add demo data if the database is empty
    python -m app.seed --reset    # wipe all leads and re-seed

Timestamps are relative to "now", so the demo always contains follow-ups that are
due today, overdue, and upcoming, whenever the script is run. "Today" is
evaluated in SEED_TIMEZONE (default Asia/Kolkata).
"""

import argparse
from datetime import datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import Base, SessionLocal, engine
from app.models import Discussion, Lead, LeadStatus


def seed(db: Session, tz: ZoneInfo, now: datetime | None = None) -> int:
    now = now or datetime.now(timezone.utc)

    def ago(days: int = 0, hours: int = 0) -> datetime:
        return now - timedelta(days=days, hours=hours)

    def local(day_offset: int, hour: int, minute: int = 0) -> datetime:
        """A wall-clock time in `tz`, `day_offset` days from today, as UTC."""
        day = (now.astimezone(tz) + timedelta(days=day_offset)).date()
        return datetime.combine(day, time(hour, minute), tzinfo=tz).astimezone(timezone.utc)

    # Each discussion: (created_at, note, follow_up_at or None, is_system)
    leads = [
        dict(
            name="Sarah Connor", company="Acme Corp", phone="555-0199",
            status=LeadStatus.PROPOSAL_SENT,
            discussions=[
                (ago(days=12), "Lead created", None, True),
                (ago(days=5), "Initial discovery call. They need a CRM for 50 reps. "
                              "Pain points include dropping leads and no follow-up tracking.", None, False),
                (ago(days=2), "Sent pricing tier PDF. Said she would review with her boss.",
                 local(0, 14, 0), False),  # due today
            ],
        ),
        dict(
            name="Rohan Mehta", company="Orbit Advisors", phone="555-0142",
            status=LeadStatus.CONTACTED,
            discussions=[
                (ago(days=4), "Lead created", None, True),
                (ago(days=1, hours=3), "Intro call. Runs a 12-advisor wealth firm, keen on "
                                       "automated client reminders.", local(0, 18, 30), False),  # due today
            ],
        ),
        dict(
            name="Bill Lumbergh", company="Initech", phone="555-0173",
            status=LeadStatus.CONTACTED,
            discussions=[
                (ago(days=9), "Lead created", None, True),
                (ago(days=7), "Left a voicemail with his assistant.", local(-1, 11, 0), False),  # overdue
            ],
        ),
        dict(
            name="Priya Nair", company="Zenith Wealth", phone="555-0188",
            status=LeadStatus.QUALIFIED,
            discussions=[
                (ago(days=8), "Lead created", None, True),
                (ago(days=6), "First call: budget approved for Q4, decision maker is the COO.", None, False),
                (ago(days=1), "Demo went well. Wants a security questionnaire before moving ahead.",
                 local(1, 10, 30), False),  # upcoming
            ],
        ),
        dict(
            name="Hank Scorpio", company="Globex", phone=None,
            status=LeadStatus.NEW,
            discussions=[
                (ago(hours=2), "Lead created", None, True),
                (ago(hours=2), "Inbound lead from website contact form.", None, False),
            ],
        ),
        dict(
            name="Bruce Wayne", company="Wayne Enterprises", phone="555-0111",
            status=LeadStatus.WON,
            discussions=[
                (ago(days=40), "Lead created", None, True),
                (ago(days=28), "Pilot with the private banking team kicked off.", None, False),
                (ago(days=21), "Contract signed! Sending welcome package.", None, False),
            ],
        ),
        dict(
            name="Lena Fischer", company="Northwind Capital", phone="555-0166",
            status=LeadStatus.LOST,
            discussions=[
                (ago(days=45), "Lead created", None, True),
                (ago(days=30), "Went with an in-house tool. Revisit in Q1.", None, False),
            ],
        ),
        dict(
            name="Ananya Rao", company=None, phone=None,
            status=LeadStatus.NEW,
            discussions=[(ago(days=1), "Lead created", None, True)],
        ),
    ]

    for spec in leads:
        history = spec.pop("discussions")
        # A lead's follow-up mirrors its latest discussion, as the API does.
        follow_up = max(history, key=lambda d: d[0])[2]
        lead = Lead(**spec, follow_up_at=follow_up, created_at=min(d[0] for d in history))
        lead.discussions = [
            Discussion(created_at=at, note=note, follow_up_at=fu, is_system=system)
            for at, note, fu, system in history
        ]
        db.add(lead)
    db.commit()
    return len(leads)


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed LeadFlow demo data")
    parser.add_argument("--reset", action="store_true", help="delete all existing leads first")
    args = parser.parse_args()

    Base.metadata.create_all(bind=engine)
    tz = ZoneInfo(get_settings().seed_timezone)

    with SessionLocal() as db:
        existing = db.scalar(select(Lead.id).limit(1))
        if existing and not args.reset:
            print("Database already has leads; use --reset to wipe and re-seed.")
            return
        if args.reset:
            for lead in db.scalars(select(Lead)):
                db.delete(lead)
            db.commit()
        print(f"Seeded {seed(db, tz)} leads.")


if __name__ == "__main__":
    main()
