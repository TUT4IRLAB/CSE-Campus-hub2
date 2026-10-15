// Thin fetch wrapper around the Campus Hub backend.
// Set VITE_API_URL in .env (defaults to the local Docker backend).

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

function getToken(): string | null {
  return localStorage.getItem("campushub_token");
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem("campushub_token", token);
  else localStorage.removeItem("campushub_token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ token: string; user: any }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    register: (data: {
      firstName: string;
      lastName: string;
      studentNumber: string;
      phone?: string;
      email: string;
      password: string;
    }) => request("/auth/register", { method: "POST", body: JSON.stringify(data) }),
    forgotPassword: (email: string) =>
      request("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),
    me: () => request("/auth/me"),
  },
  studyGroups: {
    list: () => request("/study-groups"),
    mine: () => request("/study-groups/mine"),
    create: (data: unknown) => request("/study-groups", { method: "POST", body: JSON.stringify(data) }),
    join: (id: string) => request(`/study-groups/${id}/join`, { method: "POST" }),
    leave: (id: string) => request(`/study-groups/${id}/leave`, { method: "POST" }),
    remove: (id: string) => request(`/study-groups/${id}`, { method: "DELETE" }),
  },
  lostItems: {
    list: (status?: string) => request(`/lost-items${status ? `?status=${status}` : ""}`),
    mine: () => request("/lost-items/mine"),
    report: (data: unknown) => request("/lost-items", { method: "POST", body: JSON.stringify(data) }),
    updateStatus: (id: string, status: "LOST" | "FOUND" | "RETURNED") =>
      request(`/lost-items/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
    remove: (id: string) => request(`/lost-items/${id}`, { method: "DELETE" }),
  },
  textbooks: {
    list: () => request("/textbooks"),
    mine: () => request("/textbooks/mine"),
    get: (id: string) => request(`/textbooks/${id}`),
    create: (data: unknown) => request("/textbooks", { method: "POST", body: JSON.stringify(data) }),
    remove: (id: string) => request(`/textbooks/${id}`, { method: "DELETE" }),
  },
  admin: {
    overview: () => request("/admin/overview"),
    remove: (type: "study-groups" | "lost-items" | "textbooks" | "events", id: string) =>
      request(`/admin/${type}/${id}`, { method: "DELETE" }),
  },
  events: {
    list: () => request("/events"),
    mine: () => request("/events/mine"),
    register: (id: string) => request(`/events/${id}/register`, { method: "POST" }),
    unregister: (id: string) => request(`/events/${id}/register`, { method: "DELETE" }),
    create: (data: unknown) => request("/events", { method: "POST", body: JSON.stringify(data) }),
    remove: (id: string) => request(`/events/${id}`, { method: "DELETE" }),
  },
};
