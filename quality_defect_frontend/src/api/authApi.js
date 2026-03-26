import { http, toApiError } from "./httpClient";

/**
 * Expected backend endpoints (when available):
 * - POST /auth/login { email, password } -> { access_token, user }
 */

// PUBLIC_INTERFACE
export async function login({ email, password, roleHint }) {
  /** Attempts backend login; falls back to local mock if endpoint not found. */
  try {
    const res = await http.post("/auth/login", { email, password });
    return res.data;
  } catch (err) {
    const apiErr = toApiError(err);
    // If backend isn't implemented yet, allow a local fallback to keep UI usable.
    if (apiErr.status === 404 || apiErr.status === 0) {
      const role =
        roleHint ||
        (String(email || "").toLowerCase().includes("prod") ? "production" : "quality");
      return {
        access_token: `mock.${btoa(email || "user")}.${Date.now()}`,
        user: { id: "mock-user", email, name: email?.split("@")?.[0] || "User", role }
      };
    }
    throw apiErr;
  }
}

// PUBLIC_INTERFACE
export async function me() {
  /** Fetches the current user from backend if available. */
  try {
    const res = await http.get("/auth/me");
    return res.data;
  } catch (err) {
    throw toApiError(err);
  }
}
