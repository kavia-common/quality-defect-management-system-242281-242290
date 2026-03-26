from __future__ import annotations

from io import BytesIO

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas

from app.core.store import Defect


# PUBLIC_INTERFACE
def render_defect_pdf(defect: Defect) -> bytes:
    """Render a simple PDF for a defect suitable for audit/export."""
    buf = BytesIO()
    c = canvas.Canvas(buf, pagesize=letter)
    width, height = letter

    x = 0.75 * inch
    y = height - 0.9 * inch

    c.setFont("Helvetica-Bold", 16)
    c.drawString(x, y, f"Defect Report: {defect.id}")
    y -= 0.35 * inch

    c.setFont("Helvetica", 11)
    lines = [
        f"Title: {defect.title}",
        f"Status: {defect.status}",
        f"Severity: {defect.severity}",
        f"Station: {defect.station}",
        f"Created: {defect.created_at}",
        f"Updated: {defect.updated_at}",
        "",
        "Description:",
        defect.description or "",
        "",
        "RCA Notes:",
        defect.rca.notes or "",
        "",
        "Five Whys:",
    ]
    for why in defect.rca.five_whys:
        lines.append(f" - {why}")

    if defect.images:
        lines += ["", f"Images attached: {len(defect.images)}"]
        for img in defect.images:
            lines.append(f" - {img.name}: {img.url}")

    max_width_chars = 110
    for line in lines:
        # Basic wrapping
        if not line:
            y -= 0.18 * inch
            continue
        remaining = line
        while remaining:
            chunk = remaining[:max_width_chars]
            remaining = remaining[max_width_chars:]
            if y < 0.75 * inch:
                c.showPage()
                c.setFont("Helvetica", 11)
                y = height - 0.9 * inch
            c.drawString(x, y, chunk)
            y -= 0.18 * inch

    c.showPage()
    c.save()
    return buf.getvalue()
