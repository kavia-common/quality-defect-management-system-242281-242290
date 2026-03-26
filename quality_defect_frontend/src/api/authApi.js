import { http, toApiError } from "./httpClient";

/**
 * Expected backend endpoints (when available):
 * - POST /auth/login { email, password } -> { access_token, user }
 */

// PUBLIC_INTERFACE
export async function login({ email, password, roleHint }) {
  /** Attempts backend login; falls back to local mock if endpoint not found or backend is unreachable. */
  try {
    const res = await http.post("/auth/login", { email, password });
    return res.data;
  } catch (err) {
    const apiErr = toApiError(err);

    // Determine "backend not available / preview not running" as broadly as possible.
    // Axios/network errors can present as:
    // - status 0 (our normalization for no HTTP response)
    // - code: 'ERR_NETWORK'
    // - message includes 'Network Error'
    // - no response object at all
    const isBackendUnavailable =
      apiErr.status === 0 ||
      err?.code === "ERR_NETWORK" ||
      !err?.response ||
      String(err?.message || "").toLowerCase().includes("network error");

    // If backend isn't implemented or reachable yet, allow a local fallback to keep UI usable.
    if (apiErr.status === 404 || isBackendUnavailable) {
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
