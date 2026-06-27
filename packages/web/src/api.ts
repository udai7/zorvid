import type { AuthResponse, StreamInfo, Video } from "./types";

const BASE = import.meta.env.VITE_API_BASE ?? "/api";

let token: string | null = localStorage.getItem("vp_token");

export function getToken(): string | null {
  return token;
}

export function setToken(t: string | null): void {
  token = t;
  if (t) localStorage.setItem("vp_token", t);
  else localStorage.removeItem("vp_token");
}

/** Thrown for non-2xx responses; carries the HTTP status and server message. */
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (token) headers.set("authorization", `Bearer ${token}`);
  const res = await fetch(`${BASE}${path}`, { ...init, headers });

  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) {
      setToken(null); // expired/invalid — force re-login
      // Notify the auth context so route guards re-evaluate immediately.
      window.dispatchEvent(new Event("vp:auth-expired"));
    }
    throw new ApiError(res.status, (body as { error?: string }).error ?? res.statusText);
  }
  return body as T;
}

export const api = {
  register: (email: string, password: string) =>
    request<AuthResponse>("/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    }),

  login: (email: string, password: string) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    }),

  listVideos: () => request<{ videos: Video[] }>("/videos").then((r) => r.videos),

  getVideo: (id: string) => request<Video>(`/videos/${id}`),

  uploadVideo: (file: File, onProgress?: (pct: number) => void) =>
    // Use XHR so we can report upload progress (fetch can't, pre-streams).
    new Promise<{ id: string }>((resolve, reject) => {
      const form = new FormData();
      form.append("title", file.name);
      form.append("file", file);
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${BASE}/videos`);
      if (token) xhr.setRequestHeader("authorization", `Bearer ${token}`);
      xhr.upload.onprogress = (e) =>
        e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText));
        else reject(new ApiError(xhr.status, safeError(xhr.responseText)));
      };
      xhr.onerror = () => reject(new ApiError(0, "network error"));
      xhr.send(form);
    }),

  setVisibility: (id: string, visibility: "public" | "private") =>
    request<{ id: string; visibility: string }>(`/videos/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ visibility }),
    }),

  deleteVideo: (id: string) => request<void>(`/videos/${id}`, { method: "DELETE" }),

  getStream: (id: string) => request<StreamInfo>(`/videos/${id}/stream`),
};

function safeError(text: string): string {
  try {
    return JSON.parse(text).error ?? "upload failed";
  } catch {
    return "upload failed";
  }
}
