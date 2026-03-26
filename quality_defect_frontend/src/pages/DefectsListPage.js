import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listDefects } from "../api/defectsApi";
import { Badge, Button, Card, Input, Select } from "../ui/components";

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
export function DefectsListPage() {
  /** Defects table/list with basic client-side filtering. */
  const [defects, setDefects] = useState([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [severity, setSeverity] = useState("all");

  useEffect(() => {
    let mounted = true;
    listDefects().then((d) => mounted && setDefects(Array.isArray(d) ? d : d.items || []));
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    return defects.filter((d) => {
      const q = query.trim().toLowerCase();
      const matchesQ =
        !q ||
        String(d.id).toLowerCase().includes(q) ||
        String(d.title).toLowerCase().includes(q) ||
        String(d.station || "").toLowerCase().includes(q);

      const matchesStatus = status === "all" || d.status === status;
      const matchesSeverity = severity === "all" || d.severity === severity;
      return matchesQ && matchesStatus && matchesSeverity;
    });
  }, [defects, query, status, severity]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-lg font-bold text-gray-900">Defects</div>
          <div className="text-sm text-gray-600">Log and track defects across production stations.</div>
        </div>
        <Link to="/app/defects/new">
          <Button>New defect</Button>
        </Link>
      </div>

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <Input label="Search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="DF-1001, Scratch..." />
          <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="in_review">In review</option>
            <option value="closed">Closed</option>
          </Select>
          <Select label="Severity" value={severity} onChange={(e) => setSeverity(e.target.value)}>
            <option value="all">All</option>
            <option value="critical">Critical</option>
            <option value="major">Major</option>
            <option value="minor">Minor</option>
          </Select>
          <div className="flex items-end">
            <div className="text-xs text-gray-500">{filtered.length} results</div>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="divide-y divide-gray-100">
          {filtered.map((d) => (
            <Link
              key={d.id}
              to={`/app/defects/${encodeURIComponent(d.id)}`}
              className="block px-4 py-4 hover:bg-gray-50 transition"
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold text-gray-900">{d.title}</div>
                    <Badge tone={toneForSeverity(d.severity)}>{d.severity}</Badge>
                    <Badge tone={toneForStatus(d.status)}>{d.status}</Badge>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {d.id} • {d.station} • {new Date(d.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="text-sm font-semibold text-blue-700">View →</div>
              </div>
            </Link>
          ))}
          {filtered.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-gray-600">No defects match your filters.</div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
