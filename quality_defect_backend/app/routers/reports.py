from __future__ import annotations

from datetime import datetime, timezone
from typing import Dict, List

from fastapi import APIRouter, Depends, HTTPException, Response, status

from app.core.store import STORE
from app.deps.auth import get_current_user
from app.models.schemas import DashboardMetrics, DefectOut, DefectSummaryReport
from app.routers.defects import _defect_to_out  # reuse mapping
from app.services.pdf_export import render_defect_pdf

router = APIRouter(tags=["metrics-reports"])


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


@router.get(
    "/metrics/dashboard",
    response_model=DashboardMetrics,
    summary="Dashboard metrics",
    description="Aggregate counts for dashboard widgets (total/open/in_review/closed, by severity and station).",
    operation_id="metrics_dashboard",
)
def dashboard_metrics(_user=Depends(get_current_user)) -> DashboardMetrics:
    """Return dashboard aggregates."""
    defects = list(STORE.defects.values())
    total = len(defects)
    open_count = sum(1 for d in defects if d.status == "open")
    in_review = sum(1 for d in defects if d.status == "in_review")
    closed = sum(1 for d in defects if d.status == "closed")

    by_severity: Dict[str, int] = {}
    by_station: Dict[str, int] = {}
    for d in defects:
        by_severity[d.severity] = by_severity.get(d.severity, 0) + 1
        by_station[d.station] = by_station.get(d.station, 0) + 1

    return DashboardMetrics(
        total=total,
        open=open_count,
        inReview=in_review,
        closed=closed,
        bySeverity=by_severity,
        byStation=by_station,
    )


@router.get(
    "/reports/defects/summary",
    response_model=DefectSummaryReport,
    summary="Defects summary report",
    description="Returns a structured report payload that can be used for audits and dashboards.",
    operation_id="reports_defects_summary",
)
def defects_summary(_user=Depends(get_current_user)) -> DefectSummaryReport:
    """Return summary report."""
    metrics = dashboard_metrics(_user)
    items: List[DefectOut] = [_defect_to_out(d) for d in sorted(STORE.defects.values(), key=lambda x: x.created_at, reverse=True)]
    return DefectSummaryReport(generatedAt=_utc_now_iso(), totals=metrics, items=items)


@router.get(
    "/reports/defects/{defect_id}.pdf",
    summary="Export defect as PDF",
    description="Generate a PDF report for a single defect.",
    operation_id="reports_defect_pdf",
    responses={
        200: {"content": {"application/pdf": {}}},
        404: {"description": "Defect not found"},
    },
)
def defect_pdf(defect_id: str, _user=Depends(get_current_user)) -> Response:
    """Generate a PDF for a defect."""
    d = STORE.defects.get(defect_id)
    if not d:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Defect not found")

    data = render_defect_pdf(d)
    headers = {"Content-Disposition": f'attachment; filename="{defect_id}.pdf"'}
    return Response(content=data, media_type="application/pdf", headers=headers)
