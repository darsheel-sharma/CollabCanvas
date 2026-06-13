// Base URL for backend API requests
const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

/**
 * Core fetch wrapper that automatically handles JWT authorization headers
 * and parses JSON responses. Throws formatted errors on failure.
 *
 * @param {string} path - The API endpoint path
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<any>} The parsed JSON payload
 */
async function request(path, options = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers ?? {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    credentials: "include",
    ...options,
    headers,
  });

  if (response.status === 204) {
    return null;
  }

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error ?? "Request failed.");
  }

  return payload;
}

/**
 * Registers a new user.
 */
export async function signup(payload) {
  return request("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Authenticates a user and returns a token.
 */
export async function login(payload) {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Fetches the currently authenticated user's profile.
 */
export async function me() {
  return request("/api/auth/me");
}

/**
 * Logs out the current user by clearing server-side cookies.
 */
export async function logout() {
  return request("/api/auth/logout", { method: "POST" });
}

/**
 * Fetches all workspaces associated with the current user.
 */
export async function getWorkspaces() {
  return request("/api/workspaces");
}

/**
 * Creates a new collaborative workspace.
 */
export async function createWorkspace(payload) {
  return request("/api/workspaces", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Retrieves a specific workspace by its slug/ID.
 */
export async function getWorkspace(slug) {
  return request(`/api/workspaces/${slug}`);
}

/**
 * Deletes a workspace and purges associated data.
 */
export async function deleteWorkspace(id) {
  return request(`/api/workspaces/${id}`, {
    method: "DELETE",
  });
}

export { apiBaseUrl };
