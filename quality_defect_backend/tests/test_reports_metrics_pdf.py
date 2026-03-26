from __future__ import annotations

from fastapi.testclient import TestClient

from tests.conftest import auth_headers


def test_dashboard_metrics_requires_auth(client: TestClient):
    resp = client.get("/metrics/dashboard")
    assert resp.status_code == 401


def test_dashboard_metrics_counts_seed_data(client: TestClient, quality_token_and_user):
    token, _ = quality_token_and_user
    resp = client.get("/metrics/dashboard", headers=auth_headers(token))
    assert resp.status_code == 200
    metrics = resp.json()

    assert metrics["total"] >= 2
    assert metrics["open"] >= 1
    assert metrics["inReview"] >= 1
    assert "bySeverity" in metrics
    assert "byStation" in metrics


def test_defects_summary_report_shape(client: TestClient, quality_token_and_user):
    token, _ = quality_token_and_user
    resp = client.get("/reports/defects/summary", headers=auth_headers(token))
    assert resp.status_code == 200
    report = resp.json()

    assert "generatedAt" in report
    assert "totals" in report
    assert "items" in report
    assert isinstance(report["items"], list)
    assert report["items"], "Expected at least seeded defects in report items"


def test_defect_pdf_export(client: TestClient, quality_token_and_user):
    token, _ = quality_token_and_user

    resp = client.get("/reports/defects/DF-1001.pdf", headers=auth_headers(token))
    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("application/pdf")
    assert "Content-Disposition" in resp.headers
    assert resp.content, "Expected non-empty PDF bytes"

    # Smoke check PDF signature
    assert resp.content[:4] == b"%PDF"
