from __future__ import annotations

import base64
import json
from typing import Any, Dict, Optional

from fastapi import HTTPException, status


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _b64url_decode(data: str) -> bytes:
    pad = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode((data + pad).encode("utf-8"))


# PUBLIC_INTERFACE
def issue_access_token(*, user_id: str, role: str, email: str) -> str:
    """Issue a simple unsigned access token for demo purposes.

    This is NOT a JWT and is not secure; it is sufficient for local dev/demo and frontend integration.
    """
    payload = {"sub": user_id, "role": role, "email": email}
    blob = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    return f"demo.{_b64url_encode(blob)}"


# PUBLIC_INTERFACE
def decode_access_token(token: str) -> Dict[str, Any]:
    """Decode an access token issued by `issue_access_token`.

    Raises:
        HTTPException: if token is invalid.
    """
    try:
        parts = token.split(".", 1)
        if len(parts) != 2 or parts[0] != "demo":
            raise ValueError("invalid token prefix")
        data = json.loads(_b64url_decode(parts[1]).decode("utf-8"))
        if "sub" not in data or "role" not in data:
            raise ValueError("invalid payload")
        return data
    except Exception as exc:  # noqa: BLE001 - we want a single auth error surface
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc


# PUBLIC_INTERFACE
def get_token_from_authorization_header(auth_header: Optional[str]) -> Optional[str]:
    """Extract Bearer token from Authorization header."""
    if not auth_header:
        return None
    parts = auth_header.strip().split(" ", 1)
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1].strip()
    return None
