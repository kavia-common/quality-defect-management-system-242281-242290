import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

// PUBLIC_INTERFACE
export function RequireAuth() {
  /** Guard that requires an authenticated user. */
  const { isAuthed } = useAuth();
  if (!isAuthed) return <Navigate to="/login" replace />;
  return <Outlet />;
}

// PUBLIC_INTERFACE
export function RequireRole({ allow }) {
  /** Guard that requires user role within allow list. */
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!allow?.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
}
