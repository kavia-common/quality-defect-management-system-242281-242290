from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

from app.core.security import decode_access_token
from app.core.ws_manager import WS_MANAGER, WsClient

router = APIRouter(tags=["realtime"])


@router.get(
    "/docs/realtime",
    summary="WebSocket usage help",
    description="Human-readable instructions for connecting to the WebSocket endpoint.",
    operation_id="realtime_docs",
)
def realtime_docs() -> dict:
    """Return WebSocket usage notes."""
    return {
        "ws_endpoint": "/ws",
        "auth": {
            "query_param": "token",
            "note": "Frontend may append ?token=<access_token>. Backend also supports unauthenticated connections in demo mode.",
        },
        "events": [
            "defect.created",
            "defect.updated",
            "defect.image_added",
            "defect.rca_updated",
            "action.created",
            "action.updated",
            "action.deleted",
        ],
        "payload_shape": {"type": "event.name", "defectId": "DF-1001"},
    }


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: Optional[str] = Query(default=None)) -> None:
    """WebSocket endpoint for realtime broadcasts.

    Connect: ws(s)://<host>/ws?token=<access_token>

    The server broadcasts JSON text messages of the form:
    { "type": "defect.updated", "defectId": "DF-1001" }
    """
    user_id = None
    role = None
    if token:
        try:
            payload = decode_access_token(token)
            user_id = payload.get("sub")
            role = payload.get("role")
        except Exception:  # noqa: BLE001 - allow demo unauthenticated sockets
            user_id = None
            role = None

    await websocket.accept()
    client = WsClient(websocket=websocket, user_id=user_id, role=role)
    await WS_MANAGER.connect(client)

    try:
        # Keep-alive loop; we ignore inbound messages for now (broadcast-only).
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        await WS_MANAGER.disconnect(client)
    except Exception:  # noqa: BLE001
        await WS_MANAGER.disconnect(client)
