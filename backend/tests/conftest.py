import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db, make_engine
from app.main import create_app


@pytest.fixture
def client():
    """A client backed by a fresh in-memory database for every test."""
    engine = make_engine("sqlite://")
    Base.metadata.create_all(engine)
    TestingSession = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)

    def override_get_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    app = create_app()
    app.dependency_overrides[get_db] = override_get_db
    # Not used as a context manager, so the production lifespan (and its DB file) never runs.
    yield TestClient(app)
    engine.dispose()


@pytest.fixture
def make_lead(client):
    def _make(**overrides):
        payload = {"name": "Test Lead", **overrides}
        res = client.post("/leads", json=payload)
        assert res.status_code == 201, res.text
        return res.json()

    return _make
