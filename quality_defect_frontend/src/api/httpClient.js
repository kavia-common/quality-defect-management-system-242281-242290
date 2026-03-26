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
  const message =
    err?.response?.data?.detail ||
    err?.response?.data?.message ||
    err?.message ||
    "Unexpected error";
  return { status, message, raw: err };
}
