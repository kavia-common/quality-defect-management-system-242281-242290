from __future__ import annotations

import os
import secrets
from pathlib import Path
from typing import Tuple

from fastapi import UploadFile

from app.core.settings import get_settings


def _safe_filename(name: str) -> str:
    # Keep only a small safe subset; prevent path traversal.
    base = os.path.basename(name or "file")
    base = base.replace("..", ".").replace("/", "_").replace("\\", "_")
    return base[:128] if base else "file"


# PUBLIC_INTERFACE
async def save_upload(*, file: UploadFile, subdir: str = "") -> Tuple[str, str]:
    """Save an uploaded file to local storage and return (relative_path, stored_filename).

    Args:
        file: FastAPI UploadFile.
        subdir: optional subdirectory under uploads directory (e.g., defect id).

    Returns:
        (rel_path, stored_name) where rel_path is path relative to uploads_dir.
    """
    settings = get_settings()
    uploads_root = Path(settings.uploads_dir)
    target_dir = uploads_root / subdir if subdir else uploads_root
    target_dir.mkdir(parents=True, exist_ok=True)

    original = _safe_filename(file.filename or "upload")
    ext = Path(original).suffix.lower()
    token = secrets.token_hex(8)
    stored_name = f"{token}{ext}" if ext else token
    target_path = target_dir / stored_name

    # Stream to disk
    with target_path.open("wb") as out:
        while True:
            chunk = await file.read(1024 * 1024)
            if not chunk:
                break
            out.write(chunk)

    rel_path = str((Path(subdir) / stored_name) if subdir else Path(stored_name))
    return rel_path.replace("\\", "/"), stored_name
