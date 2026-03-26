from __future__ import annotations

import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.settings import get_settings
from app.models.schemas import ApiMessage
from app.routers import auth as auth_router
from app.routers import defects as defects_router
from app.routers import reports as reports_router
from app.routers import ws as ws_router

openapi_tags = [
    {"name": "auth", "description": "Authentication, roles, and user directory."},
    {"name": "defects", "description": "Defect lifecycle, images, and RCA/corrective actions (via defects)."},
    {"name": "corrective-actions", "description": "Direct corrective action operations."},
    {"name": "metrics-reports", "description": "Dashboard metrics, report payloads, PDF export."},
    {"name": "realtime", "description": "WebSocket realtime broadcasting."},
]


def create_app() -> FastAPI:
    """Create the FastAPI application with routes and middleware."""
    settings = get_settings()

    app = FastAPI(
        title="Quality Defect Management Backend",
        description=(
            "REST + WebSocket backend for logging, analyzing, and managing quality defects.\n\n"
            "WebSocket usage: connect to `/ws` optionally with `?token=<access_token>`.\n"
            "See `/docs/realtime` for details."
        ),
        version="0.1.0",
        openapi_tags=openapi_tags,
    )

    # CORS to allow React frontend to call API directly.
    allow_origins = settings.cors_allow_origins or ["*"]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allow_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Serve uploaded images
    uploads_dir = Path(settings.uploads_dir)
    uploads_dir.mkdir(parents=True, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

    # Routers
    app.include_router(auth_router.router)
    app.include_router(defects_router.router)
    app.include_router(defects_router.actions_router)
    app.include_router(reports_router.router)
    app.include_router(ws_router.router)

    @app.get(
        settings.healthcheck_path,
        response_model=ApiMessage,
        summary="Healthcheck",
        description="Simple health endpoint for load balancers.",
        tags=["metrics-reports"],
        operation_id="healthcheck",
    )
    def healthcheck() -> ApiMessage:
        """Healthcheck endpoint."""
        return ApiMessage(message="ok", details={"env": settings.node_env, "pid": os.getpid()})

    return app


app = create_app()
