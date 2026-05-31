const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

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

export async function signup(payload) {
  return request("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function login(payload) {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function me() {
  return request("/api/auth/me");
}

export async function logout() {
  return request("/api/auth/logout", { method: "POST" });
}

export async function getWorkspaces() {
  return request("/api/workspaces");
}

export async function createWorkspace(payload) {
  return request("/api/workspaces", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getWorkspace(slug) {
  return request(`/api/workspaces/${slug}`);
}

export async function deleteWorkspace(id) {
  return request(`/api/workspaces/${id}`, {
    method: "DELETE",
  });
}

export { apiBaseUrl };
