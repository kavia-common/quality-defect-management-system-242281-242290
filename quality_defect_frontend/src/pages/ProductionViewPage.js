import React from "react";
import { Card, Badge } from "../ui/components";

// PUBLIC_INTERFACE
export function ProductionViewPage() {
  /** Production Supervisor view scaffold. */
  return (
    <div className="space-y-4">
      <div>
        <div className="text-lg font-bold text-gray-900">Production View</div>
        <div className="text-sm text-gray-600">Containment actions, line impact, and quick triage.</div>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold text-gray-900">Line status</div>
          <Badge tone="amber">Attention</Badge>
        </div>
        <div className="mt-2 text-sm text-gray-600">
          Future: integrate real-time alerts via WebSocket and show station-level defect hotspots.
        </div>
      </Card>
    </div>
  );
}
