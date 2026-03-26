from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse

from app.core.security import issue_access_token
from app.core.store import STORE
from app.deps.auth import get_current_user, require_roles
from app.models.schemas import ApiMessage, LoginRequest, LoginResponse, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/login",
    response_model=LoginResponse,
    summary="Login",
    description="Authenticate a user and return an access token. Demo mode: accepts any password for known seeded users.",
    operation_id="auth_login",
)
def login(payload: LoginRequest) -> LoginResponse:
    """Login endpoint.

    Args:
        payload: LoginRequest with email/password.

    Returns:
        LoginResponse containing access_token and user info.
    """
    email_lower = payload.email.strip().lower()
    user = next((u for u in STORE.users.values() if u.email.lower() == email_lower), None)
    if not user:
        # For minimal usability, auto-provision user based on email prefix.
        role = "quality"
        if "prod" in email_lower:
            role = "production"
        if "admin" in email_lower:
            role = "admin"
        new_id = f"u-{email_lower.split('@')[0][:24]}"
        user = STORE.users.setdefault(new_id, type(STORE.users["u-quality"])(new_id, payload.email, payload.email.split("@")[0], role))  # type: ignore[arg-type]

    token = issue_access_token(user_id=user.id, role=user.role, email=user.email)
    return LoginResponse(access_token=token, user=UserOut(id=user.id, email=user.email, name=user.name, role=user.role))


@router.get(
    "/me",
    response_model=UserOut,
    summary="Get current user",
    description="Return the user associated with the provided Bearer token.",
    operation_id="auth_me",
)
def me(user=Depends(get_current_user)) -> UserOut:
    """Return current user."""
    return UserOut(id=user.id, email=user.email, name=user.name, role=user.role)


@router.get(
    "/roles",
    response_model=list[str],
    summary="List available roles",
    description="Return supported roles for the application.",
    operation_id="auth_roles",
)
def roles() -> list[str]:
    """List roles."""
    return ["quality", "production", "admin"]


@router.get(
    "/users",
    response_model=list[UserOut],
    summary="List users",
    description="Admin-only endpoint listing known users (demo store).",
    operation_id="auth_list_users",
)
def list_users(_admin=Depends(require_roles("admin"))) -> list[UserOut]:
    """List users (admin)."""
    return [UserOut(id=u.id, email=u.email, name=u.name, role=u.role) for u in STORE.users.values()]


@router.post(
    "/logout",
    response_model=ApiMessage,
    summary="Logout",
    description="No-op logout endpoint for API compatibility (token is stateless in demo).",
    operation_id="auth_logout",
)
def logout() -> JSONResponse:
    """Logout (no-op)."""
    return JSONResponse(content=ApiMessage(message="Logged out").model_dump())
