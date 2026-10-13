def test_create_lead_defaults(client):
    res = client.post("/leads", json={"name": "  Sarah Connor  "})
    assert res.status_code == 201
    body = res.json()
    assert body["name"] == "Sarah Connor"  # trimmed
    assert body["status"] == "New"
    assert body["company"] is None and body["phone"] is None
    assert body["follow_up_at"] is None
    # A new lead already has its system timeline entry, so list rows have a note.
    assert body["last_note"] == "Lead created"
    assert body["last_discussion_at"] is not None


def test_create_lead_blank_optional_fields_become_null(client):
    res = client.post("/leads", json={"name": "A", "company": "   ", "phone": ""})
    assert res.status_code == 201
    assert res.json()["company"] is None
    assert res.json()["phone"] is None


def test_create_lead_requires_name(client):
    for payload in ({}, {"name": ""}, {"name": "   "}):
        res = client.post("/leads", json=payload)
        assert res.status_code == 422
        assert "name" in res.json()["detail"]
        assert res.json()["errors"][0]["field"] == "name"


def test_create_lead_rejects_invalid_status(client):
    res = client.post("/leads", json={"name": "A", "status": "Maybe"})
    assert res.status_code == 422


def test_get_lead_and_404(client, make_lead):
    lead = make_lead(name="Hank")
    assert client.get(f"/leads/{lead['id']}").json()["name"] == "Hank"
    res = client.get("/leads/9999")
    assert res.status_code == 404
    assert res.json() == {"detail": "Lead 9999 not found"}


def test_list_filter_by_status(client, make_lead):
    make_lead(name="A", status="New")
    make_lead(name="B", status="Won")
    names = [lead["name"] for lead in client.get("/leads", params={"status": "Won"}).json()]
    assert names == ["B"]
    assert client.get("/leads", params={"status": "Nope"}).status_code == 422


def test_list_search_by_name_and_company_case_insensitive(client, make_lead):
    make_lead(name="Sarah Connor", company="Acme")
    make_lead(name="Bill Lumbergh", company="Initech")
    assert [l["name"] for l in client.get("/leads", params={"q": "sARAh"}).json()] == ["Sarah Connor"]
    assert [l["name"] for l in client.get("/leads", params={"q": "initech"}).json()] == ["Bill Lumbergh"]
    assert client.get("/leads", params={"q": "zzz"}).json() == []


def test_search_treats_wildcards_literally(client, make_lead):
    make_lead(name="Plain Name")
    assert client.get("/leads", params={"q": "%"}).json() == []


def test_list_orders_by_recent_activity(client, make_lead):
    first = make_lead(name="First")
    make_lead(name="Second")
    client.post(f"/leads/{first['id']}/discussions", json={"note": "Ping"})
    assert [l["name"] for l in client.get("/leads").json()] == ["First", "Second"]


def test_patch_status_persists_and_logs_system_entry(client, make_lead):
    lead = make_lead(name="A")
    res = client.patch(f"/leads/{lead['id']}", json={"status": "Qualified"})
    assert res.status_code == 200
    assert res.json()["status"] == "Qualified"
    assert client.get(f"/leads/{lead['id']}").json()["status"] == "Qualified"

    history = client.get(f"/leads/{lead['id']}/discussions").json()
    assert history[0]["is_system"] is True
    assert history[0]["note"] == "Status changed from New to Qualified"


def test_patch_same_status_is_a_noop_for_history(client, make_lead):
    lead = make_lead(name="A")
    client.patch(f"/leads/{lead['id']}", json={"status": "New"})
    assert len(client.get(f"/leads/{lead['id']}/discussions").json()) == 1


def test_patch_validation_and_404(client, make_lead):
    lead = make_lead(name="A")
    assert client.patch(f"/leads/{lead['id']}", json={"status": "Bogus"}).status_code == 422
    assert client.patch(f"/leads/{lead['id']}", json={"status": None}).status_code == 422
    assert client.patch(f"/leads/{lead['id']}", json={"name": "  "}).status_code == 422
    assert client.patch("/leads/9999", json={"status": "Won"}).status_code == 404


def test_patch_updates_only_sent_fields(client, make_lead):
    lead = make_lead(name="A", company="Acme", phone="123")
    res = client.patch(f"/leads/{lead['id']}", json={"company": None})
    body = res.json()
    assert body["company"] is None
    assert body["phone"] == "123" and body["name"] == "A"


def test_health(client):
    assert client.get("/health").json() == {"status": "ok"}
