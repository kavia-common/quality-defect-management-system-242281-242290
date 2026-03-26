from __future__ import annotations

import asyncio
import json
from dataclasses import dataclass
from typing import Any, Dict, Optional, Set

from fastapi import WebSocket


@dataclass(frozen=True)
class WsClient:
    websocket: WebSocket
    user_id: Optional[str]
    role: Optional[str]


class WsManager:
    """Tracks websocket clients and broadcasts events."""

    def __init__(self) -> None:
        self._clients: Set[WsClient] = set()
        self._lock = asyncio.Lock()

    async def connect(self, client: WsClient) -> None:
        async with self._lock:
            self._clients.add(client)

    async def disconnect(self, client: WsClient) -> None:
        async with self._lock:
            self._clients.discard(client)

    async def broadcast(self, event: Dict[str, Any]) -> None:
        message = json.dumps(event, separators=(",", ":"))
        async with self._lock:
            clients = list(self._clients)

        # Send outside lock; drop broken sockets.
        to_drop: list[WsClient] = []
        for c in clients:
            try:
                await c.websocket.send_text(message)
            except Exception:  # noqa: BLE001
                to_drop.append(c)
        if to_drop:
            async with self._lock:
                for c in to_drop:
                    self._clients.discard(c)


WS_MANAGER = WsManager()
