import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getDefect, uploadDefectImage } from "../api/defectsApi";
import { Badge, Button, Card } from "../ui/components";

const toneForSeverity = (sev) => {
  if (sev === "critical") return "red";
  if (sev === "major") return "amber";
  if (sev === "minor") return "blue";
  return "gray";
};

const toneForStatus = (status) => {
  if (status === "open") return "red";
  if (status === "in_review") return "amber";
  if (status === "closed") return "green";
  return "gray";
};

// PUBLIC_INTERFACE
export function DefectDetailPage() {
  /** Defect details, image uploads, and PDF export scaffolding. */
  const { defectId } = useParams();
  const [defect, setDefect] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const title = useMemo(() => defect?.title || defectId, [defect?.title, defectId]);

  useEffect(() => {
    let mounted = true;
    setError("");
    getDefect(defectId)
      .then((d) => mounted && setDefect(d))
      .catch((e) => mounted && setError(e?.message || "Failed to load defect"));
    return () => {
      mounted = false;
    };
  }, [defectId]);

  const onUpload = async (file) => {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      await uploadDefectImage(defectId, file);
      const refreshed = await getDefect(defectId);
      setDefect(refreshed);
    } catch (e) {
      setError(e?.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const exportPdf = () => {
    // UI scaffolding: the backend can provide PDF generation endpoint later.
    // For now, we print the page, which is a viable minimal PDF export workflow.
    window.print();
  };

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-sm font-semibold text-red-700">{error}</div>
      </Card>
    );
  }

  if (!defect) {
    return (
      <Card className="p-6">
        <div className="text-sm text-gray-600">Loading defect…</div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="text-lg font-bold text-gray-900">{title}</div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge tone="gray">{defect.id}</Badge>
            <Badge tone={toneForSeverity(defect.severity)}>{defect.severity}</Badge>
            <Badge tone={toneForStatus(defect.status)}>{defect.status}</Badge>
            <span className="text-xs text-gray-500">• {defect.station}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={exportPdf}>
            Export PDF
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="text-sm font-bold text-gray-900">Description</div>
        <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{defect.description}</div>
      </Card>

      <Card className="p-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-bold text-gray-900">Images</div>
            <div className="text-xs text-gray-500">Upload evidence photos for review and RCA.</div>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onUpload(e.target.files?.[0] || null)}
              disabled={busy}
            />
            {busy ? "Uploading..." : "Upload image"}
          </label>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {(defect.images || []).map((img, idx) => (
            <div key={`${img.url}-${idx}`} className="overflow-hidden rounded-xl border border-gray-100">
              {/* eslint-disable-next-line jsx-a11y/img-redundant-alt */}
              <img src={img.url} alt={img.name || `Defect image ${idx + 1}`} className="h-40 w-full object-cover" />
              <div className="px-3 py-2 text-xs text-gray-600">{img.name || "image"}</div>
            </div>
          ))}
          {(defect.images || []).length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-600 sm:col-span-2 md:col-span-3">
              No images yet.
            </div>
          ) : null}
        </div>
      </Card>

      <Card className="p-4">
        <div className="text-sm font-bold text-gray-900">RCA & Corrective Actions</div>
        <div className="mt-2 text-sm text-gray-600">
          Workspace UI is scaffolded in the RCA and Corrective Actions pages (quality role). Backend integration will
          connect these to saved workflows.
        </div>
      </Card>
    </div>
  );
}
