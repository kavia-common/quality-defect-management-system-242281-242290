import React, { useMemo } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import clsx from "clsx";
import { useAuth } from "../auth/AuthContext";
import { Button } from "../ui/components";

const navItemClass = ({ isActive }) =>
  clsx(
    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition",
    isActive ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"
  );

// PUBLIC_INTERFACE
export function AppShell() {
  /** Main authenticated application chrome (sidebar + topbar + content). */
  const { user, logout } = useAuth();

  const nav = useMemo(() => {
    const common = [
      { to: "/app/dashboard", label: "Dashboard" },
      { to: "/app/defects", label: "Defects" },
      { to: "/app/reports", label: "Reports" }
    ];
    const quality = [
      { to: "/app/rca", label: "RCA Workspace" },
      { to: "/app/corrective-actions", label: "Corrective Actions" }
    ];
    const production = [{ to: "/app/production", label: "Production View" }];

    if (user?.role === "quality") return [...common, ...quality];
    if (user?.role === "production") return [...common, ...production];
    return common;
  }, [user?.role]);

  return (
    <div className="min-h-screen bg-ocean-bg">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        <aside className="hidden w-64 flex-col border-r border-gray-100 bg-white p-4 md:flex">
          <Link to="/app/dashboard" className="mb-6 flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400" />
            <div>
              <div className="text-sm font-semibold text-gray-900">Quality Defect</div>
              <div className="text-xs text-gray-500">Management System</div>
            </div>
          </Link>

          <nav className="flex flex-1 flex-col gap-1">
            {nav.map((item) => (
              <NavLink key={item.to} to={item.to} className={navItemClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-3">
            <div className="text-xs font-semibold text-gray-700">Signed in</div>
            <div className="mt-1 text-sm font-semibold text-gray-900">{user?.name || user?.email}</div>
            <div className="text-xs text-gray-500">Role: {user?.role}</div>
            <Button variant="ghost" className="mt-3 w-full" onClick={logout}>
              Sign out
            </Button>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 border-b border-gray-100 bg-white/90 backdrop-blur">
            <div className="flex items-center justify-between px-4 py-3 md:px-6">
              <div>
                <div className="text-sm font-semibold text-gray-900">Quality Defect Management</div>
                <div className="text-xs text-gray-500">Track, analyze, and resolve defects</div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to="/app/defects/new"
                  className="rounded-lg bg-ocean-primary px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  New Defect
                </Link>
              </div>
            </div>
          </header>

          <div className="flex-1 p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
