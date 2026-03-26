import React, { useEffect, useMemo, useState } from "react";
import { listDefects } from "../api/defectsApi";
import { useAuth } from "../auth/AuthContext";
import { Card, Badge } from "../ui/components";
import { createWsClient } from "../ws/wsClient";

const toneForStatus = (status) => {
  if (status === "open") return "red";
  if (status === "in_review") return "amber";
  if (status === "closed") return "green";
  return "gray";
};

// PUBLIC_INTERFACE
export function DashboardPage() {
  /** Main dashboard with quick stats and recent defects. */
  const { user } = useAuth();
  const [defects, setDefects] = useState([]);
  const [wsStatus, setWsStatus] = useState({ state: "idle" });

  useEffect(() => {
    let mounted = true;
    listDefects().then((d) => mounted && setDefects(Array.isArray(d) ? d : d.items || []));
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const client = createWsClient({
      onStatus: setWsStatus,
      onMessage: () => {
        // Future: refresh dashboards on real-time updates.
      }
    });
    client.connect();
    return () => client.disconnect();
  }, []);

  const stats = useMemo(() => {
    const open = defects.filter((d) => d.status === "open").length;
    const inReview = defects.filter((d) => d.status === "in_review").length;
    const closed = defects.filter((d) => d.status === "closed").length;
    return { open, inReview, closed, total: defects.length };
  }, [defects]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white p-6 shadow-card border border-gray-100">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-lg font-bold text-gray-900">Welcome, {user?.name || user?.email}</div>
            <div className="text-sm text-gray-600">
              Role-based workspace for <span className="font-semibold">{user?.role}</span>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            WebSocket: <span className="font-semibold">{wsStatus?.state}</span>
            {wsStatus?.reason ? ` (${wsStatus.reason})` : ""}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="text-xs font-semibold text-gray-500">Total defects</div>
          <div className="mt-2 text-2xl font-bold text-gray-900">{stats.total}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-semibold text-gray-500">Open</div>
          <div className="mt-2 text-2xl font-bold text-red-600">{stats.open}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-semibold text-gray-500">In review</div>
          <div className="mt-2 text-2xl font-bold text-amber-600">{stats.inReview}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-semibold text-gray-500">Closed</div>
          <div className="mt-2 text-2xl font-bold text-emerald-600">{stats.closed}</div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold text-gray-900">Recent defects</div>
          <div className="text-xs text-gray-500">Showing up to 6</div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {defects.slice(0, 6).map((d) => (
            <div key={d.id} className="rounded-xl border border-gray-100 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-gray-900">{d.title}</div>
                  <div className="text-xs text-gray-500">{d.id} • {d.station}</div>
                </div>
                <Badge tone={toneForStatus(d.status)}>{d.status}</Badge>
              </div>
              <div className="mt-2 text-sm text-gray-600 line-clamp-2">{d.description}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
