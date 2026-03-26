from __future__ import annotations

import os
from functools import lru_cache
from typing import List

from pydantic import BaseModel, Field


class Settings(BaseModel):
    """Runtime configuration for the backend."""

    node_env: str = Field(default="development", description="Environment name.")
    backend_url: str = Field(default="", description="Public backend base URL (used for docs/links).")
    frontend_url: str = Field(default="", description="Frontend base URL (used for CORS).")
    api_base: str = Field(default="", description="API base URL (typically same as backend_url).")
    ws_url: str = Field(default="", description="Public WS URL (used in docs/help text).")
    log_level: str = Field(default="info", description="Logging verbosity.")
    trust_proxy: bool = Field(default=False, description="Whether to trust proxy headers.")
    healthcheck_path: str = Field(default="/health", description="Healthcheck path.")
    uploads_dir: str = Field(default="data/uploads", description="Local uploads directory.")
    cors_allow_origins: List[str] = Field(
        default_factory=list, description="CORS allowed origins. Derived from frontend_url if set."
    )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Load settings from environment variables."""
    node_env = os.getenv("REACT_APP_NODE_ENV") or os.getenv("NODE_ENV") or "development"

    backend_url = (os.getenv("REACT_APP_BACKEND_URL") or "").rstrip("/")
    frontend_url = (os.getenv("REACT_APP_FRONTEND_URL") or "").rstrip("/")
    api_base = (os.getenv("REACT_APP_API_BASE") or "").rstrip("/")
    ws_url = (os.getenv("REACT_APP_WS_URL") or "").rstrip("/")
    log_level = os.getenv("REACT_APP_LOG_LEVEL") or "info"
    trust_proxy = str(os.getenv("REACT_APP_TRUST_PROXY") or "false").lower() == "true"
    healthcheck_path = os.getenv("REACT_APP_HEALTHCHECK_PATH") or "/health"

    uploads_dir = os.getenv("UPLOADS_DIR") or "data/uploads"

    cors_allow_origins: List[str] = []
    if frontend_url:
        cors_allow_origins.append(frontend_url)

    return Settings(
        node_env=node_env,
        backend_url=backend_url,
        frontend_url=frontend_url,
        api_base=api_base,
        ws_url=ws_url,
        log_level=log_level,
        trust_proxy=trust_proxy,
        healthcheck_path=healthcheck_path,
        uploads_dir=uploads_dir,
        cors_allow_origins=cors_allow_origins,
    )
