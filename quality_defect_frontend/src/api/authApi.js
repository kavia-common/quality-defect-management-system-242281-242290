import { http, toApiError } from "./httpClient";

/**
 * Expected backend endpoints (when available):
 * - POST /auth/login { email, password } -> { access_token, user }
 */

// Helper: base64 encode without throwing (handles unicode + environments missing btoa).
function safeBase64Encode(value) {
  try {
    const str = String(value ?? "");
    if (typeof window !== "undefined" && typeof window.btoa === "function") {
      // btoa only supports latin1; encode unicode safely.
      return window.btoa(unescape(encodeURIComponent(str)));
    }
  } catch {
    // ignore and fall through
  }

  // Non-browser or locked-down environment fallback.
  try {
    // eslint-disable-next-line no-undef
    if (typeof Buffer !== "undefined") return Buffer.from(String(value ?? ""), "utf8").toString("base64");
  } catch {
    // ignore and fall through
  }

  return "dXNlcg=="; // "user" base64; stable last-resort
}

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
    // - code: 'ERR_NETWORK' / 'ECONNABORTED'
    // - message includes 'Network Error' / 'Failed to fetch'
    // - no response object at all
    const msg = String(err?.message || apiErr?.message || "").toLowerCase();
    const isBackendUnavailable =
      apiErr.status === 0 ||
      err?.code === "ERR_NETWORK" ||
      err?.code === "ECONNABORTED" ||
      !err?.response ||
      msg.includes("network error") ||
      msg.includes("failed to fetch");

    // If backend isn't implemented or reachable yet, allow a local fallback to keep UI usable.
    if (apiErr.status === 404 || isBackendUnavailable) {
      const role =
        roleHint ||
        (String(email || "").toLowerCase().includes("prod") ? "production" : "quality");
      return {
        access_token: `mock.${safeBase64Encode(email || "user")}.${Date.now()}`,
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
