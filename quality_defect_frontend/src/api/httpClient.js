import axios from "axios";
import { getRuntimeConfig } from "../config";
import { getAccessToken, clearAuth } from "../auth/tokenStorage";

const { apiBase } = getRuntimeConfig();

export const http = axios.create({
  baseURL: apiBase || "/",
  timeout: 30_000
});

http.interceptors.request.use((config) => {
  const token = getAccessToken();

  // Axios may pass a config with `headers` undefined; assigning into it would throw and
  // crash the app during any request attempt (including Login flow).
  if (!config.headers) config.headers = {};

  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      // Token expired/invalid: clear local auth so UI can react.
      clearAuth();
    }
    return Promise.reject(error);
  }
);

// PUBLIC_INTERFACE
export function toApiError(err) {
  /** Normalizes axios/network errors into a UI-friendly shape. */
  const status = err?.response?.status ?? 0;

  // Axios/network errors can come in many shapes:
  // - Error instances
  // - plain objects with { message, code, response? }
  // - strings or other thrown primitives (rare but possible)
  // This function must never throw because it is used inside UI flows.
  const responseData = err?.response?.data;
  const message =
    responseData?.detail ||
    responseData?.message ||
    (typeof err?.message === "string" ? err.message : "") ||
    (typeof err === "string" ? err : "") ||
    "Unexpected error";

  return { status, message, raw: err };
}
