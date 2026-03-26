from __future__ import annotations

import threading
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Dict, List, Optional


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


@dataclass
class User:
    id: str
    email: str
    name: str
    role: str  # 'quality'|'production'|'admin'


@dataclass
class ImageRef:
    url: str
    name: str
    uploaded_at: str = field(default_factory=_utc_now_iso)


@dataclass
class RcaData:
    # Minimal RCA model; can be expanded (5-why, fishbone categories, evidence refs)
    five_whys: List[str] = field(default_factory=list)
    fishbone: Dict[str, List[str]] = field(default_factory=dict)
    notes: str = ""


@dataclass
class CorrectiveAction:
    id: str
    defect_id: str
    title: str
    owner: str = ""
    due_date: Optional[str] = None  # ISO date
    status: str = "open"  # open|in_progress|done|verified|cancelled
    verification_notes: str = ""
    created_at: str = field(default_factory=_utc_now_iso)
    updated_at: str = field(default_factory=_utc_now_iso)


@dataclass
class Defect:
    id: str
    title: str
    severity: str  # critical|major|minor
    status: str  # open|in_review|closed
    station: str
    description: str
    created_at: str = field(default_factory=_utc_now_iso)
    updated_at: str = field(default_factory=_utc_now_iso)
    images: List[ImageRef] = field(default_factory=list)
    rca: RcaData = field(default_factory=RcaData)
    corrective_actions: List[str] = field(default_factory=list)  # action IDs


class InMemoryStore:
    """Thread-safe in-memory store for demo/initial integration."""

    def __init__(self) -> None:
        self._lock = threading.RLock()
        self.users: Dict[str, User] = {}
        self.defects: Dict[str, Defect] = {}
        self.actions: Dict[str, CorrectiveAction] = {}
        self._defect_seq = 1002
        self._action_seq = 0
        self._seed()

    def _seed(self) -> None:
        with self._lock:
            self.users["u-quality"] = User(
                id="u-quality", email="quality@example.com", name="quality", role="quality"
            )
            self.users["u-production"] = User(
                id="u-production", email="production@example.com", name="production", role="production"
            )
            self.users["u-admin"] = User(id="u-admin", email="admin@example.com", name="admin", role="admin")

            d1 = Defect(
                id="DF-1001",
                title="Scratch on housing",
                severity="major",
                status="open",
                station="Assembly Line 2",
                description="Visible scratch on left side of housing after assembly.",
            )
            d2 = Defect(
                id="DF-1002",
                title="Loose connector",
                severity="critical",
                status="in_review",
                station="Final Test",
                description="Connector intermittently disconnects during vibration test.",
            )
            self.defects[d1.id] = d1
            self.defects[d2.id] = d2

    def next_defect_id(self) -> str:
        with self._lock:
            self._defect_seq += 1
            return f"DF-{self._defect_seq}"

    def next_action_id(self) -> str:
        with self._lock:
            self._action_seq += 1
            return f"CA-{self._action_seq:05d}"


STORE = InMemoryStore()
