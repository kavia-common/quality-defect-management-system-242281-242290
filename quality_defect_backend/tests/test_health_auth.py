from __future__ import annotations

from fastapi.testclient import TestClient

from tests.conftest import auth_headers


def test_healthcheck_ok(client: TestClient):
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["message"] == "ok"
    assert "details" in data
    assert "pid" in data["details"]


def test_login_returns_token_and_user(client: TestClient):
    resp = client.post("/auth/login", json={"email": "quality@example.com", "password": "does-not-matter"})
    assert resp.status_code == 200
    data = resp.json()

    assert isinstance(data["access_token"], str)
    assert data["access_token"]
    assert data["user"]["email"] == "quality@example.com"
    assert data["user"]["role"] == "quality"


def test_me_requires_bearer_token(client: TestClient):
    resp = client.get("/auth/me")
    assert resp.status_code == 401
    assert resp.json()["detail"] == "Missing Bearer token"


def test_me_returns_current_user(client: TestClient, quality_token_and_user):
    token, user = quality_token_and_user
    resp = client.get("/auth/me", headers=auth_headers(token))
    assert resp.status_code == 200
    me = resp.json()
    assert me["id"] == user["id"]
    assert me["email"] == user["email"]
    assert me["role"] == user["role"]


def test_roles_lists_supported_roles(client: TestClient):
    resp = client.get("/auth/roles")
    assert resp.status_code == 200
    assert resp.json() == ["quality", "production", "admin"]


def test_list_users_admin_only(client: TestClient, admin_token_and_user, quality_token_and_user):
    admin_token, _admin_user = admin_token_and_user
    quality_token, _quality_user = quality_token_and_user

    forbidden = client.get("/auth/users", headers=auth_headers(quality_token))
    assert forbidden.status_code == 403
    assert forbidden.json()["detail"] == "Insufficient role"

    allowed = client.get("/auth/users", headers=auth_headers(admin_token))
    assert allowed.status_code == 200
    users = allowed.json()
    assert isinstance(users, list)
    assert any(u["email"] == "admin@example.com" for u in users)


def test_logout_noop(client: TestClient):
    resp = client.post("/auth/logout")
    assert resp.status_code == 200
    assert resp.json()["message"] == "Logged out"
