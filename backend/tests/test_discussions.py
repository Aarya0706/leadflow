def test_history_is_newest_first(client, make_lead):
    lead = make_lead(name="A")
    for note in ("one", "two", "three"):
        client.post(f"/leads/{lead['id']}/discussions", json={"note": note})
    notes = [d["note"] for d in client.get(f"/leads/{lead['id']}/discussions").json()]
    assert notes == ["three", "two", "one", "Lead created"]


def test_add_discussion_with_follow_up_updates_lead(client, make_lead):
    lead = make_lead(name="A")
    res = client.post(
        f"/leads/{lead['id']}/discussions",
        json={"note": "Sent pricing PDF", "follow_up_at": "2026-10-20T08:30:00Z"},
    )
    assert res.status_code == 201
    assert res.json()["follow_up_at"] == "2026-10-20T08:30:00Z"
    assert res.json()["is_system"] is False

    updated = client.get(f"/leads/{lead['id']}").json()
    assert updated["follow_up_at"] == "2026-10-20T08:30:00Z"
    assert updated["last_note"] == "Sent pricing PDF"


def test_follow_up_with_offset_is_normalised_to_utc(client, make_lead):
    lead = make_lead(name="A")
    res = client.post(
        f"/leads/{lead['id']}/discussions",
        json={"note": "x", "follow_up_at": "2026-10-20T14:00:00+05:30"},
    )
    assert res.json()["follow_up_at"] == "2026-10-20T08:30:00Z"


def test_discussion_without_follow_up_clears_existing_one(client, make_lead):
    lead = make_lead(name="A")
    url = f"/leads/{lead['id']}/discussions"
    client.post(url, json={"note": "call", "follow_up_at": "2026-10-20T08:30:00Z"})
    client.post(url, json={"note": "did the follow-up"})
    assert client.get(f"/leads/{lead['id']}").json()["follow_up_at"] is None


def test_rejects_blank_note(client, make_lead):
    lead = make_lead(name="A")
    for note in ("", "   "):
        res = client.post(f"/leads/{lead['id']}/discussions", json={"note": note})
        assert res.status_code == 422
        assert res.json()["errors"][0]["field"] == "note"


def test_rejects_follow_up_without_timezone(client, make_lead):
    lead = make_lead(name="A")
    res = client.post(
        f"/leads/{lead['id']}/discussions",
        json={"note": "x", "follow_up_at": "2026-10-20T14:00:00"},
    )
    assert res.status_code == 422
    assert res.json()["errors"][0]["field"] == "follow_up_at"


def test_unknown_lead_returns_404(client):
    assert client.get("/leads/42/discussions").status_code == 404
    assert client.post("/leads/42/discussions", json={"note": "x"}).status_code == 404


def test_last_note_prefers_rep_notes_over_status_changes(client, make_lead):
    lead = make_lead(name="A")
    client.post(f"/leads/{lead['id']}/discussions", json={"note": "Real conversation"})
    client.patch(f"/leads/{lead['id']}", json={"status": "Contacted"})
    row = client.get(f"/leads/{lead['id']}").json()
    assert row["last_note"] == "Real conversation"
