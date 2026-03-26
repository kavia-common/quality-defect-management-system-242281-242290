import React from "react";
import { Button, Card } from "../ui/components";

// PUBLIC_INTERFACE
export function ReportsPage() {
  /** Reporting area scaffold (PDF export UI). */
  const exportPdf = () => window.print();

  return (
    <div className="space-y-4">
      <div>
        <div className="text-lg font-bold text-gray-900">Reports</div>
        <div className="text-sm text-gray-600">Generate summaries for audits and leadership reviews.</div>
      </div>

      <Card className="p-6">
        <div className="text-sm font-bold text-gray-900">PDF Export</div>
        <div className="mt-2 text-sm text-gray-600">
          This UI is ready. Backend can later provide a server-generated PDF for consistent formatting. For now,
          “Export PDF” uses the browser print-to-PDF workflow.
        </div>
        <div className="mt-4">
          <Button variant="secondary" onClick={exportPdf}>
            Export PDF
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <div className="text-sm font-bold text-gray-900">Dashboards (scaffold)</div>
        <div className="mt-2 text-sm text-gray-600">
          Hook up KPI endpoints to populate defect rates, Pareto charts, and trend lines.
        </div>
      </Card>
    </div>
  );
}
