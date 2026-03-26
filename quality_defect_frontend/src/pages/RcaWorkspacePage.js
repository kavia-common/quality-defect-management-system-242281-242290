import React from "react";
import { Card } from "../ui/components";

// PUBLIC_INTERFACE
export function RcaWorkspacePage() {
  /** RCA workspace scaffold for Quality Engineers. */
  return (
    <div className="space-y-4">
      <div>
        <div className="text-lg font-bold text-gray-900">RCA Workspace</div>
        <div className="text-sm text-gray-600">Root Cause Analysis tools and workflows (5-Why, Fishbone, evidence).</div>
      </div>

      <Card className="p-6">
        <div className="text-sm font-bold text-gray-900">5-Why (scaffold)</div>
        <div className="mt-2 text-sm text-gray-600">
          Provide an interface to capture why-chains per defect and store them via backend endpoints.
        </div>
      </Card>

      <Card className="p-6">
        <div className="text-sm font-bold text-gray-900">Fishbone (scaffold)</div>
        <div className="mt-2 text-sm text-gray-600">
          Future UI: categorize causes by Man, Machine, Method, Material, Measurement, Environment.
        </div>
      </Card>
    </div>
  );
}
