const TOKEN_KEY = "qdm_access_token";
const USER_KEY = "qdm_user";

/**
 * User shape (frontend):
 * { id?: string, email?: string, name?: string, role: 'quality'|'production'|'admin' }
 */

// PUBLIC_INTERFACE
export function getAccessToken() {
  /** Returns the stored access token, if present. */
  return localStorage.getItem(TOKEN_KEY) || "";
}

// PUBLIC_INTERFACE
export function setAccessToken(token) {
  /** Stores an access token (or clears it if falsy). */
  if (!token) localStorage.removeItem(TOKEN_KEY);
  else localStorage.setItem(TOKEN_KEY, token);
}

// PUBLIC_INTERFACE
export function getStoredUser() {
  /** Returns stored user object (or null). */
  const raw = localStorage.getItem(USER_KEY);
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
  if (!user) localStorage.removeItem(USER_KEY);
  else localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// PUBLIC_INTERFACE
export function clearAuth() {
  /** Clears all stored auth items. */
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
