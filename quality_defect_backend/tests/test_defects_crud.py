from __future__ import annotations

from fastapi.testclient import TestClient

from tests.conftest import auth_headers


def test_list_defects_requires_auth(client: TestClient):
    resp = client.get("/defects")
    assert resp.status_code == 401
    assert resp.json()["detail"] == "Missing Bearer token"


def test_list_defects_returns_seeded_items(client: TestClient, quality_token_and_user):
    token, _ = quality_token_and_user
    resp = client.get("/defects", headers=auth_headers(token))
    assert resp.status_code == 200
    items = resp.json()
    assert isinstance(items, list)
    # Seed data includes DF-1001 and DF-1002
    ids = {d["id"] for d in items}
    assert "DF-1001" in ids
    assert "DF-1002" in ids


def test_create_get_patch_defect_flow(client: TestClient, quality_token_and_user):
    token, _ = quality_token_and_user

    create = client.post(
        "/defects",
        headers=auth_headers(token),
        json={
            "title": "Paint blemish",
            "station": "Paint Booth",
            "severity": "minor",
            "description": "Small blemish on top coat.",
        },
    )
    assert create.status_code == 200, create.text
    created = create.json()
    assert created["id"].startswith("DF-")
    assert created["status"] == "open"
    assert created["title"] == "Paint blemish"

    defect_id = created["id"]

    get1 = client.get(f"/defects/{defect_id}", headers=auth_headers(token))
    assert get1.status_code == 200
    fetched = get1.json()
    assert fetched["id"] == defect_id
    assert fetched["station"] == "Paint Booth"

    bad_status = client.patch(
        f"/defects/{defect_id}",
        headers=auth_headers(token),
        json={"status": "not-a-real-status"},
    )
    assert bad_status.status_code == 400
    assert bad_status.json()["detail"] == "Invalid status"

    patch = client.patch(
        f"/defects/{defect_id}",
        headers=auth_headers(token),
        json={"status": "in_review", "severity": "major"},
    )
    assert patch.status_code == 200
    updated = patch.json()
    assert updated["id"] == defect_id
    assert updated["status"] == "in_review"
    assert updated["severity"] == "major"
    assert updated["updatedAt"]  # should be set


def test_get_unknown_defect_404(client: TestClient, quality_token_and_user):
    token, _ = quality_token_and_user
    resp = client.get("/defects/DF-DOES-NOT-EXIST", headers=auth_headers(token))
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Defect not found"


def test_upload_image_attaches_to_defect(client: TestClient, quality_token_and_user):
    token, _ = quality_token_and_user

    created = client.post(
        "/defects",
        headers=auth_headers(token),
        json={"title": "Missing label", "station": "Packaging", "severity": "major", "description": ""},
    )
    assert created.status_code == 200
    defect_id = created.json()["id"]

    # Upload a small "image" payload; backend does not validate actual image format.
    files = {"file": ("evidence.png", b"fake-png-bytes", "image/png")}
    up = client.post(f"/defects/{defect_id}/images", headers=auth_headers(token), files=files)
    assert up.status_code == 200, up.text
    img = up.json()
    assert img["name"] == "evidence.png"
    assert img["url"].startswith("/uploads/")

    # Ensure defect now has the image in its output
    fetched = client.get(f"/defects/{defect_id}", headers=auth_headers(token))
    assert fetched.status_code == 200
    defect = fetched.json()
    assert len(defect["images"]) == 1
    assert defect["images"][0]["url"].startswith("/uploads/")
