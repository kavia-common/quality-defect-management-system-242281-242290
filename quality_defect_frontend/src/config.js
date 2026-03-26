/**
 * Centralized runtime configuration.
 * All values are derived from REACT_APP_* environment variables to work in CRA.
 */

const normalizeUrl = (value) => {
  if (!value) return "";
  return String(value).replace(/\/+$/, "");
};

// PUBLIC_INTERFACE
export function getRuntimeConfig() {
  /** Returns runtime config derived from REACT_APP_* env variables. */
  const apiBase =
    normalizeUrl(process.env.REACT_APP_API_BASE) ||
    normalizeUrl(process.env.REACT_APP_BACKEND_URL);

  return {
    nodeEnv: process.env.REACT_APP_NODE_ENV || process.env.NODE_ENV,
    apiBase,
    backendUrl: normalizeUrl(process.env.REACT_APP_BACKEND_URL),
    frontendUrl: normalizeUrl(process.env.REACT_APP_FRONTEND_URL),
    wsUrl: normalizeUrl(process.env.REACT_APP_WS_URL),
    logLevel: process.env.REACT_APP_LOG_LEVEL || "info",
    featureFlagsRaw: process.env.REACT_APP_FEATURE_FLAGS || "",
    experimentsEnabled: process.env.REACT_APP_EXPERIMENTS_ENABLED === "true"
  };
}
