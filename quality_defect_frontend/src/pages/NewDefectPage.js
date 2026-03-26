import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createDefect } from "../api/defectsApi";
import { Button, Card, Input, Select } from "../ui/components";

// PUBLIC_INTERFACE
export function NewDefectPage() {
  /** Create defect form. */
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [station, setStation] = useState("Assembly Line 1");
  const [severity, setSeverity] = useState("major");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const created = await createDefect({ title, station, severity, description });
      navigate(`/app/defects/${encodeURIComponent(created.id)}`, { replace: true });
    } catch (err) {
      setError(err?.message || "Failed to create defect");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <div className="text-lg font-bold text-gray-900">New defect</div>
        <div className="text-sm text-gray-600">Log a quality defect for triage and root-cause analysis.</div>
      </div>

      <Card className="p-6">
        <form className="space-y-4" onSubmit={onSubmit}>
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <Select label="Station" value={station} onChange={(e) => setStation(e.target.value)}>
            <option>Assembly Line 1</option>
            <option>Assembly Line 2</option>
            <option>Final Test</option>
            <option>Packaging</option>
          </Select>
          <Select label="Severity" value={severity} onChange={(e) => setSeverity(e.target.value)}>
            <option value="critical">Critical</option>
            <option value="major">Major</option>
            <option value="minor">Minor</option>
          </Select>

          <label className="block">
            <div className="mb-1 text-sm font-medium text-gray-700">Description</div>
            <textarea
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Observed defect details, suspected cause, containment actions…"
            />
          </label>

          {error ? (
            <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          ) : null}

          <div className="flex gap-2">
            <Button type="submit" disabled={busy}>
              {busy ? "Creating..." : "Create defect"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => navigate(-1)} disabled={busy}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
