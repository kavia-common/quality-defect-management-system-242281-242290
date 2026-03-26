from __future__ import annotations

from typing import Optional

from fastapi import Depends, Header, HTTPException, status

from app.core.security import decode_access_token, get_token_from_authorization_header
from app.core.store import STORE, User


# PUBLIC_INTERFACE
def get_current_user(authorization: Optional[str] = Header(default=None)) -> User:
    """Resolve the current user from the Bearer token in Authorization header."""
    token = get_token_from_authorization_header(authorization)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Bearer token")
    payload = decode_access_token(token)
    user_id = payload.get("sub")
    user = STORE.users.get(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unknown user")
    return user


# PUBLIC_INTERFACE
def require_roles(*allowed: str):
    """FastAPI dependency factory to require one of the specified roles."""

    def _dep(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role")
        return user

    return _dep
