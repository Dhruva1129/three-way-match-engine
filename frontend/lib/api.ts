const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const TOKEN_KEY = "twm_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/**
 * Central fetch wrapper — attaches the Bearer token to every request and
 * normalises error responses. All frontend data-fetching goes through this.
 */
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.body && !(options.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new ApiError(401, "Session expired — please log in again");
  }

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await res.json().catch(() => ({})) : await res.text();

  if (!res.ok) {
    const message = isJson && (data as { error?: string })?.error ? (data as { error: string }).error : `Request failed (${res.status})`;
    throw new ApiError(res.status, message, isJson ? (data as { details?: unknown }).details : undefined);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body: body instanceof FormData ? body : JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

/**
 * Fetches the original uploaded file as a blob (with the Bearer token
 * attached) and returns an object URL for <iframe>/<img> preview. Plain
 * <iframe src="/documents/:id/file"> can't carry an Authorization header,
 * so previews go through this instead of a direct URL.
 */
export async function fetchFileBlobUrl(id: string): Promise<{ url: string; mimeType: string }> {
  const token = getToken();
  const res = await fetch(`${API_URL}/documents/${id}/file`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new ApiError(res.status, "Could not load file preview");
  const mimeType = res.headers.get("content-type") || "application/octet-stream";
  const blob = await res.blob();
  return { url: URL.createObjectURL(blob), mimeType };
}

export { API_URL };
