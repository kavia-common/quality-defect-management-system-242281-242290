const TOKEN_KEY = "qdm_access_token";
const USER_KEY = "qdm_user";

/**
 * User shape (frontend):
 * { id?: string, email?: string, name?: string, role: 'quality'|'production'|'admin' }
 *
 * NOTE:
 * Some environments (embedded previews, strict privacy modes, blocked third-party storage)
 * can throw on any `localStorage` access. Since auth state is initialized on app load,
 * such errors can crash the Login page before any user interaction.
 *
 * We therefore treat storage as "best effort" and fall back to in-memory values.
 */

const memoryFallback = {
  token: "",
  userJson: ""
};

function storageAvailable() {
  try {
    // Accessing localStorage itself can throw in some environments.
    const s = window?.localStorage;
    if (!s) return false;
    // Some browsers throw only when calling getItem/setItem; do a tiny probe.
    const k = "__qdm_probe__";
    s.setItem(k, "1");
    s.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

function safeGetItem(key) {
  try {
    if (!storageAvailable()) return null;
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key, value) {
  try {
    if (!storageAvailable()) return false;
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function safeRemoveItem(key) {
  try {
    if (!storageAvailable()) return false;
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

// PUBLIC_INTERFACE
export function getAccessToken() {
  /** Returns the stored access token, if present. */
  const token = safeGetItem(TOKEN_KEY);
  return token ?? memoryFallback.token ?? "";
}

// PUBLIC_INTERFACE
export function setAccessToken(token) {
  /** Stores an access token (or clears it if falsy). */
  if (!token) {
    memoryFallback.token = "";
    safeRemoveItem(TOKEN_KEY);
    return;
  }

  memoryFallback.token = String(token);
  safeSetItem(TOKEN_KEY, String(token));
}

// PUBLIC_INTERFACE
export function getStoredUser() {
  /** Returns stored user object (or null). */
  const raw = safeGetItem(USER_KEY) ?? memoryFallback.userJson ?? "";
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// PUBLIC_INTERFACE
export function setStoredUser(user) {
  /** Stores user object (or clears it if falsy). */
  if (!user) {
    memoryFallback.userJson = "";
    safeRemoveItem(USER_KEY);
    return;
  }

  const json = JSON.stringify(user);
  memoryFallback.userJson = json;
  safeSetItem(USER_KEY, json);
}

// PUBLIC_INTERFACE
export function clearAuth() {
  /** Clears all stored auth items. */
  memoryFallback.token = "";
  memoryFallback.userJson = "";
  safeRemoveItem(TOKEN_KEY);
  safeRemoveItem(USER_KEY);
}
