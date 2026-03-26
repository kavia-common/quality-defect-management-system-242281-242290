from __future__ import annotations

import copy
from typing import Any, Dict, Tuple

import pytest
from fastapi.testclient import TestClient

from app.core.store import STORE
from app.main import create_app


@pytest.fixture()
def app():
    """Create a new FastAPI app instance for each test."""
    return create_app()


@pytest.fixture()
def client(app):
    """Provide a FastAPI TestClient bound to the per-test app."""
    return TestClient(app)


@pytest.fixture(autouse=True)
def _isolate_store_state():
    """Ensure STORE (a module-level singleton) is reset for each test.

    The backend uses an in-memory singleton store (STORE). Without isolation,
    tests would affect each other by creating defects, actions, or users.
    """
    before = copy.deepcopy(
        {
            "users": STORE.users,
            "defects": STORE.defects,
            "actions": STORE.actions,
            "_defect_seq": STORE._defect_seq,  # noqa: SLF001 - test-only access
            "_action_seq": STORE._action_seq,  # noqa: SLF001 - test-only access
        }
    )
    try:
        yield
    finally:
        STORE.users = before["users"]
        STORE.defects = before["defects"]
        STORE.actions = before["actions"]
        STORE._defect_seq = before["_defect_seq"]  # noqa: SLF001 - test-only access
        STORE._action_seq = before["_action_seq"]  # noqa: SLF001 - test-only access


def _auth_login(client: TestClient, email: str, password: str = "any") -> Dict[str, Any]:
    """Login helper that returns parsed JSON."""
    resp = client.post("/auth/login", json={"email": email, "password": password})
    assert resp.status_code == 200, resp.text
    payload: Dict[str, Any] = resp.json()
    assert "access_token" in payload
    assert "user" in payload
    return payload


@pytest.fixture()
def quality_token_and_user(client: TestClient) -> Tuple[str, Dict[str, Any]]:
    """Return (token, user) for seeded quality user."""
    payload = _auth_login(client, "quality@example.com")
    return payload["access_token"], payload["user"]


@pytest.fixture()
def admin_token_and_user(client: TestClient) -> Tuple[str, Dict[str, Any]]:
    """Return (token, user) for seeded admin user."""
    payload = _auth_login(client, "admin@example.com")
    return payload["access_token"], payload["user"]


@pytest.fixture()
def production_token_and_user(client: TestClient) -> Tuple[str, Dict[str, Any]]:
    """Return (token, user) for seeded production user."""
    payload = _auth_login(client, "production@example.com")
    return payload["access_token"], payload["user"]


def auth_headers(token: str) -> Dict[str, str]:
    """Generate Authorization header dict."""
    return {"Authorization": f"Bearer {token}"}
