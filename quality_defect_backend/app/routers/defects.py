from __future__ import annotations

from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import JSONResponse

from app.core.settings import get_settings
from app.core.store import CorrectiveAction, Defect, ImageRef, STORE
from app.core.ws_manager import WS_MANAGER
from app.deps.auth import get_current_user, require_roles
from app.models.schemas import (
    ApiMessage,
    CorrectiveActionCreate,
    CorrectiveActionOut,
    CorrectiveActionUpdate,
    DefectCreate,
    DefectOut,
    DefectUpdate,
    ImageOut,
    RcaData,
)
from app.services.uploads import save_upload

router = APIRouter(prefix="/defects", tags=["defects"])


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def _uploads_public_base() -> str:
    settings = get_settings()
    # Prefer api_base if set, otherwise backend_url; both are expected to be public-facing.
    base = (settings.api_base or settings.backend_url or "").rstrip("/")
    return base


def _as_public_upload_url(path: str) -> str:
    """Convert '/uploads/...' (or 'uploads/...') paths into an absolute URL when configured."""
    if not path:
        return path
    if path.startswith("http://") or path.startswith("https://"):
        return path
    normalized = path if path.startswith("/") else f"/{path}"
    base = _uploads_public_base()
    return f"{base}{normalized}" if base else normalized


def _defect_to_out(d: Defect) -> DefectOut:
    return DefectOut(
        id=d.id,
        title=d.title,
        severity=d.severity,
        status=d.status,
        station=d.station,
        description=d.description,
        createdAt=d.created_at,
        updatedAt=d.updated_at,
        images=[
            ImageOut(url=_as_public_upload_url(i.url), name=i.name, uploadedAt=i.uploaded_at) for i in d.images
        ],
        rca=RcaData(fiveWhys=d.rca.five_whys, fishbone=d.rca.fishbone, notes=d.rca.notes),
    )


def _action_to_out(a: CorrectiveAction) -> CorrectiveActionOut:
    return CorrectiveActionOut(
        id=a.id,
        defectId=a.defect_id,
        title=a.title,
        owner=a.owner,
        dueDate=a.due_date,
        status=a.status,
        verificationNotes=a.verification_notes,
        createdAt=a.created_at,
        updatedAt=a.updated_at,
    )


@router.get(
    "",
    response_model=List[DefectOut],
    summary="List defects",
    description="List defects (most recent first).",
    operation_id="defects_list",
)
def list_defects(_user=Depends(get_current_user)) -> List[DefectOut]:
    """List defects."""
    items = sorted(STORE.defects.values(), key=lambda d: d.created_at, reverse=True)
    return [_defect_to_out(d) for d in items]


@router.post(
    "",
    response_model=DefectOut,
    summary="Create defect",
    description="Create a new defect entry.",
    operation_id="defects_create",
)
async def create_defect(payload: DefectCreate, _user=Depends(get_current_user)) -> DefectOut:
    """Create defect."""
    defect_id = STORE.next_defect_id()
    d = Defect(
        id=defect_id,
        title=payload.title,
        station=payload.station,
        severity=payload.severity,
        description=payload.description or "",
        status="open",
    )
    STORE.defects[d.id] = d

    await WS_MANAGER.broadcast({"type": "defect.created", "defectId": d.id})
    return _defect_to_out(d)


@router.get(
    "/{defect_id}",
    response_model=DefectOut,
    summary="Get defect",
    description="Get a defect by id.",
    operation_id="defects_get",
)
def get_defect(defect_id: str, _user=Depends(get_current_user)) -> DefectOut:
    """Get defect by id."""
    d = STORE.defects.get(defect_id)
    if not d:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Defect not found")
    return _defect_to_out(d)


@router.patch(
    "/{defect_id}",
    response_model=DefectOut,
    summary="Update defect",
    description="Update defect fields including status transitions.",
    operation_id="defects_update",
)
async def update_defect(defect_id: str, payload: DefectUpdate, _user=Depends(get_current_user)) -> DefectOut:
    """Update defect."""
    d = STORE.defects.get(defect_id)
    if not d:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Defect not found")

    if payload.title is not None:
        d.title = payload.title
    if payload.station is not None:
        d.station = payload.station
    if payload.severity is not None:
        d.severity = payload.severity
    if payload.description is not None:
        d.description = payload.description
    if payload.status is not None:
        if payload.status not in {"open", "in_review", "closed"}:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status")
        d.status = payload.status

    d.updated_at = _utc_now_iso()

    await WS_MANAGER.broadcast({"type": "defect.updated", "defectId": d.id})
    return _defect_to_out(d)


@router.post(
    "/{defect_id}/images",
    response_model=ImageOut,
    summary="Upload defect image",
    description="Upload an evidence image and attach it to a defect.",
    operation_id="defects_upload_image",
)
async def upload_image(
    defect_id: str,
    file: UploadFile = File(..., description="Image file"),
    _user=Depends(get_current_user),
) -> ImageOut:
    """Upload an image and attach to defect."""
    d = STORE.defects.get(defect_id)
    if not d:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Defect not found")

    rel_path, _stored = await save_upload(file=file, subdir=defect_id)
    url = f"/uploads/{rel_path}"
    img = ImageRef(url=url, name=file.filename or "image")
    d.images.append(img)
    d.updated_at = _utc_now_iso()

    await WS_MANAGER.broadcast({"type": "defect.image_added", "defectId": d.id})
    return ImageOut(url=img.url, name=img.name, uploadedAt=img.uploaded_at)


@router.get(
    "/{defect_id}/rca",
    response_model=RcaData,
    summary="Get RCA",
    description="Get root-cause analysis payload for a defect.",
    operation_id="defects_get_rca",
)
def get_rca(defect_id: str, _qe=Depends(require_roles("quality", "admin"))) -> RcaData:
    """Get RCA."""
    d = STORE.defects.get(defect_id)
    if not d:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Defect not found")
    return RcaData(fiveWhys=d.rca.five_whys, fishbone=d.rca.fishbone, notes=d.rca.notes)


@router.put(
    "/{defect_id}/rca",
    response_model=RcaData,
    summary="Upsert RCA",
    description="Create or replace the RCA payload for a defect.",
    operation_id="defects_put_rca",
)
async def put_rca(defect_id: str, payload: RcaData, _qe=Depends(require_roles("quality", "admin"))) -> RcaData:
    """Upsert RCA."""
    d = STORE.defects.get(defect_id)
    if not d:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Defect not found")

    d.rca.five_whys = list(payload.fiveWhys or [])
    d.rca.fishbone = dict(payload.fishbone or {})
    d.rca.notes = payload.notes or ""
    d.updated_at = _utc_now_iso()

    await WS_MANAGER.broadcast({"type": "defect.rca_updated", "defectId": d.id})
    return payload


@router.get(
    "/{defect_id}/corrective-actions",
    response_model=list[CorrectiveActionOut],
    summary="List corrective actions for defect",
    description="List corrective actions associated with a defect.",
    operation_id="defects_list_actions",
)
def list_actions(defect_id: str, _qe=Depends(require_roles("quality", "admin"))) -> list[CorrectiveActionOut]:
    """List corrective actions for a defect."""
    d = STORE.defects.get(defect_id)
    if not d:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Defect not found")

    actions = [STORE.actions[a_id] for a_id in d.corrective_actions if a_id in STORE.actions]
    actions = sorted(actions, key=lambda a: a.created_at, reverse=True)
    return [_action_to_out(a) for a in actions]


@router.post(
    "/{defect_id}/corrective-actions",
    response_model=CorrectiveActionOut,
    summary="Create corrective action for defect",
    description="Create a corrective action and link it to a defect.",
    operation_id="defects_create_action",
)
async def create_action(
    defect_id: str, payload: CorrectiveActionCreate, _qe=Depends(require_roles("quality", "admin"))
) -> CorrectiveActionOut:
    """Create corrective action."""
    d = STORE.defects.get(defect_id)
    if not d:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Defect not found")

    action_id = STORE.next_action_id()
    a = CorrectiveAction(
        id=action_id,
        defect_id=defect_id,
        title=payload.title,
        owner=payload.owner or "",
        due_date=payload.dueDate,
    )
    STORE.actions[a.id] = a
    d.corrective_actions.append(a.id)
    d.updated_at = _utc_now_iso()

    await WS_MANAGER.broadcast({"type": "action.created", "defectId": d.id, "actionId": a.id})
    return _action_to_out(a)


actions_router = APIRouter(prefix="", tags=["corrective-actions"])


@actions_router.patch(
    "/corrective-actions/{action_id}",
    response_model=CorrectiveActionOut,
    summary="Update corrective action",
    description="Update corrective action status/owner/due date and verification notes.",
    operation_id="actions_update",
)
async def update_action(
    action_id: str, payload: CorrectiveActionUpdate, _qe=Depends(require_roles("quality", "admin"))
) -> CorrectiveActionOut:
    """Update corrective action."""
    a = STORE.actions.get(action_id)
    if not a:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Corrective action not found")

    if payload.title is not None:
        a.title = payload.title
    if payload.owner is not None:
        a.owner = payload.owner
    if payload.dueDate is not None:
        a.due_date = payload.dueDate
    if payload.status is not None:
        a.status = payload.status
    if payload.verificationNotes is not None:
        a.verification_notes = payload.verificationNotes

    a.updated_at = _utc_now_iso()

    defect = STORE.defects.get(a.defect_id)
    if defect:
        defect.updated_at = _utc_now_iso()

    await WS_MANAGER.broadcast({"type": "action.updated", "defectId": a.defect_id, "actionId": a.id})
    return _action_to_out(a)


@actions_router.delete(
    "/corrective-actions/{action_id}",
    response_model=ApiMessage,
    summary="Delete corrective action",
    description="Delete a corrective action (admin-only).",
    operation_id="actions_delete",
)
async def delete_action(action_id: str, _admin=Depends(require_roles("admin"))) -> JSONResponse:
    """Delete corrective action."""
    a = STORE.actions.get(action_id)
    if not a:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Corrective action not found")

    defect = STORE.defects.get(a.defect_id)
    if defect and action_id in defect.corrective_actions:
        defect.corrective_actions = [x for x in defect.corrective_actions if x != action_id]
        defect.updated_at = _utc_now_iso()

    del STORE.actions[action_id]
    await WS_MANAGER.broadcast({"type": "action.deleted", "defectId": a.defect_id, "actionId": action_id})
    return JSONResponse(content=ApiMessage(message="Deleted").model_dump())
