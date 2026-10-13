from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from sqlalchemy.orm import sessionmaker

from app.database import Base, make_engine
from app.models import Lead
from app.seed import seed


def test_seed_creates_expected_demo_data():
    engine = make_engine("sqlite://")
    Base.metadata.create_all(engine)
    tz = ZoneInfo("Asia/Kolkata")
    now = datetime(2026, 10, 14, 6, 0, tzinfo=timezone.utc)  # 11:30 IST

    with sessionmaker(bind=engine, expire_on_commit=False)() as db:
        assert seed(db, tz, now=now) >= 5
        leads = {l.name: l for l in db.query(Lead).all()}

    assert all(l.discussions for l in leads.values())
    today = now.astimezone(tz).date()
    due_today = [l for l in leads.values() if l.follow_up_at and l.follow_up_at.astimezone(tz).date() == today]
    overdue = [l for l in leads.values() if l.follow_up_at and l.follow_up_at.astimezone(tz).date() < today]
    assert len(due_today) == 2 and len(overdue) == 1
