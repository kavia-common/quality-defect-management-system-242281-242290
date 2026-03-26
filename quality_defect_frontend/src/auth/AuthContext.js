import React, { createContext, useContext, useMemo, useState } from "react";
import { login as loginApi } from "../api/authApi";
import { clearAuth, getStoredUser, setAccessToken, setStoredUser } from "./tokenStorage";

const AuthContext = createContext(null);

// PUBLIC_INTERFACE
export function AuthProvider({ children }) {
  /** Provides auth state (user/token) and actions (login/logout) to the app. */
  const [user, setUser] = useState(getStoredUser());

  const login = async ({ email, password, roleHint }) => {
    const data = await loginApi({ email, password, roleHint });
    if (data?.access_token) setAccessToken(data.access_token);
    if (data?.user) {
      setStoredUser(data.user);
      setUser(data.user);
    }
    return data;
  };

  const logout = () => {
    clearAuth();
    setUser(null);
  };

  const value = useMemo(() => ({ user, isAuthed: !!user, login, logout }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// PUBLIC_INTERFACE
export function useAuth() {
  /** Hook to access auth context. */
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
