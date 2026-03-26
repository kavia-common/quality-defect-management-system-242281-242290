from __future__ import annotations

from fastapi.testclient import TestClient


def test_realtime_docs_endpoint(client: TestClient):
    resp = client.get("/docs/realtime")
    assert resp.status_code == 200
    data = resp.json()
    assert data["ws_endpoint"] == "/ws"
    assert "events" in data
    assert "defect.created" in data["events"]


def test_websocket_connect_disconnect_no_auth(client: TestClient):
    # The server expects to receive text frames in a loop; sending one and closing
    # should cleanly disconnect.
    with client.websocket_connect("/ws") as ws:
        ws.send_text("ping")


def test_websocket_connect_with_invalid_token_smoke(client: TestClient):
    # Backend tolerates invalid token by treating as unauthenticated.
    with client.websocket_connect("/ws?token=not-a-real-token") as ws:
        ws.send_text("ping")
