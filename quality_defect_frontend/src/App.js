import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth, RequireRole } from "./auth/RouteGuards";
import { AppShell } from "./layout/AppShell";
import { LoginPage } from "./pages/LoginPage";
import { UnauthorizedPage } from "./pages/UnauthorizedPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DefectsListPage } from "./pages/DefectsListPage";
import { DefectDetailPage } from "./pages/DefectDetailPage";
import { NewDefectPage } from "./pages/NewDefectPage";
import { ReportsPage } from "./pages/ReportsPage";
import { RcaWorkspacePage } from "./pages/RcaWorkspacePage";
import { CorrectiveActionsPage } from "./pages/CorrectiveActionsPage";
import { ProductionViewPage } from "./pages/ProductionViewPage";

// PUBLIC_INTERFACE
function App() {
  /** Application routes and high-level page composition. */
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      <Route element={<RequireAuth />}>
        <Route path="/app" element={<AppShell />}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="defects" element={<DefectsListPage />} />
          <Route path="defects/new" element={<NewDefectPage />} />
          <Route path="defects/:defectId" element={<DefectDetailPage />} />
          <Route path="reports" element={<ReportsPage />} />

          <Route element={<RequireRole allow={["quality", "admin"]} />}>
            <Route path="rca" element={<RcaWorkspacePage />} />
            <Route path="corrective-actions" element={<CorrectiveActionsPage />} />
          </Route>

          <Route element={<RequireRole allow={["production", "admin"]} />}>
            <Route path="production" element={<ProductionViewPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
    </Routes>
  );
}

export default App;
