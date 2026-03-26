import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Button, Card, Input, Select } from "../ui/components";

// PUBLIC_INTERFACE
export function LoginPage() {
  /** Login screen (supports role hint for mock fallback). */
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("quality@example.com");
  const [password, setPassword] = useState("password");
  const [roleHint, setRoleHint] = useState("quality");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login({ email, password, roleHint });
      navigate("/app/dashboard", { replace: true });
    } catch (err) {
      setError(err?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-500/10 to-gray-50">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4">
        <Card className="w-full max-w-md p-6">
          <div className="mb-6">
            <h1 className="text-lg font-bold text-gray-900">Sign in</h1>
            <div className="text-sm text-gray-600">
              Use your credentials to access the defect management system.
            </div>
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <Select label="Role (for demo/mock)" value={roleHint} onChange={(e) => setRoleHint(e.target.value)}>
              <option value="quality">Quality Engineer</option>
              <option value="production">Production Supervisor</option>
              <option value="admin">Admin</option>
            </Select>

            {error ? (
              <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Signing in..." : "Sign in"}
            </Button>

            <div className="text-xs text-gray-500">
              Note: If backend auth is not implemented yet, the app will fall back to a local mock login.
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
