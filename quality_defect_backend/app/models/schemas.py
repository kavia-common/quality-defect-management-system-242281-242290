from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class UserOut(BaseModel):
    id: str = Field(..., description="User id.")
    email: str = Field(..., description="User email.")
    name: str = Field(..., description="User display name.")
    role: str = Field(..., description="User role: quality|production|admin.")


class LoginRequest(BaseModel):
    email: str = Field(..., description="User email.")
    password: str = Field(..., description="User password (demo accepts any password).")


class LoginResponse(BaseModel):
    access_token: str = Field(..., description="Bearer token to include in Authorization header.")
    user: UserOut = Field(..., description="Logged-in user info.")


class ImageOut(BaseModel):
    url: str = Field(..., description="Public URL to the uploaded image.")
    name: str = Field(..., description="Original filename.")
    uploadedAt: str = Field(..., description="Upload timestamp (ISO).")


class DefectBase(BaseModel):
    title: str = Field(..., description="Defect title/short description.")
    station: str = Field(..., description="Production station where defect was observed.")
    severity: str = Field(..., description="Severity: critical|major|minor.")
    description: str = Field(default="", description="Detailed defect description.")


class DefectCreate(DefectBase):
    pass


class DefectUpdate(BaseModel):
    title: Optional[str] = Field(default=None, description="Defect title.")
    station: Optional[str] = Field(default=None, description="Station.")
    severity: Optional[str] = Field(default=None, description="Severity.")
    description: Optional[str] = Field(default=None, description="Description.")
    status: Optional[str] = Field(default=None, description="Status: open|in_review|closed.")


class RcaData(BaseModel):
    fiveWhys: List[str] = Field(default_factory=list, description="List of 'why' statements in order.")
    fishbone: Dict[str, List[str]] = Field(
        default_factory=dict,
        description="Fishbone causes categorized by key (e.g. Man/Machine/Method/Material/Measurement/Environment).",
    )
    notes: str = Field(default="", description="Additional RCA notes.")


class DefectOut(BaseModel):
    id: str = Field(..., description="Defect id (e.g., DF-1001).")
    title: str = Field(..., description="Title.")
    severity: str = Field(..., description="Severity.")
    status: str = Field(..., description="Status.")
    station: str = Field(..., description="Station.")
    description: str = Field(..., description="Description.")
    createdAt: str = Field(..., description="Created timestamp (ISO).")
    updatedAt: str = Field(..., description="Updated timestamp (ISO).")
    images: List[ImageOut] = Field(default_factory=list, description="Attached evidence images.")
    rca: RcaData = Field(default_factory=RcaData, description="Root cause analysis payload.")


class CorrectiveActionCreate(BaseModel):
    title: str = Field(..., description="Action title.")
    owner: str = Field(default="", description="Owner name/email.")
    dueDate: Optional[str] = Field(default=None, description="Due date (ISO date).")


class CorrectiveActionUpdate(BaseModel):
    title: Optional[str] = Field(default=None, description="Title.")
    owner: Optional[str] = Field(default=None, description="Owner.")
    dueDate: Optional[str] = Field(default=None, description="Due date.")
    status: Optional[str] = Field(default=None, description="Status open|in_progress|done|verified|cancelled.")
    verificationNotes: Optional[str] = Field(default=None, description="Verification notes/evidence summary.")


class CorrectiveActionOut(BaseModel):
    id: str = Field(..., description="Corrective action id (e.g., CA-00001).")
    defectId: str = Field(..., description="Parent defect id.")
    title: str = Field(..., description="Title.")
    owner: str = Field(..., description="Owner.")
    dueDate: Optional[str] = Field(default=None, description="Due date (ISO date).")
    status: str = Field(..., description="Status.")
    verificationNotes: str = Field(..., description="Verification notes.")
    createdAt: str = Field(..., description="Created timestamp (ISO).")
    updatedAt: str = Field(..., description="Updated timestamp (ISO).")


class DashboardMetrics(BaseModel):
    total: int = Field(..., description="Total defects.")
    open: int = Field(..., description="Open defects.")
    inReview: int = Field(..., description="In review defects.")
    closed: int = Field(..., description="Closed defects.")
    bySeverity: Dict[str, int] = Field(..., description="Counts by severity.")
    byStation: Dict[str, int] = Field(..., description="Counts by station.")


class DefectSummaryReport(BaseModel):
    generatedAt: str = Field(..., description="Report generation time (ISO).")
    totals: DashboardMetrics = Field(..., description="Aggregated totals.")
    items: List[DefectOut] = Field(..., description="Defect items included in report (current filter).")


class ApiMessage(BaseModel):
    message: str = Field(..., description="Status message.")
    details: Optional[Dict[str, Any]] = Field(default=None, description="Optional detail payload.")
