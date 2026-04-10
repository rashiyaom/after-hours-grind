import { Post, UserRole } from "@/types";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") || "http://localhost:4000/api";
const ACCESS_TOKEN_STORAGE_KEY = "ah_backend_access_token";

type BackendAuthResponse = {
  accessToken: string;
  userId: string;
  role: "STUDENT" | "TRAINER" | "ADMIN";
};

type BackendFeedResponse = {
  data: Array<{
    id: string;
    userId: string;
    type: "image" | "video" | "reel";
    mediaUrl: string;
    caption: string;
    source: "general" | "task-proof";
    location: string;
    status: "visible" | "hidden" | "under-review";
    createdAt: string;
    user: {
      id: string;
      name: string;
      avatar: string;
      role: "STUDENT" | "TRAINER" | "ADMIN";
    };
    _count: {
      comments: number;
      likes: number;
    };
  }>;
  nextCursor: string | null;
};

const mapBackendRoleToFrontend = (role: "STUDENT" | "TRAINER" | "ADMIN"): UserRole => {
  switch (role) {
    case "TRAINER":
      return "trainer";
    case "ADMIN":
      return "admin";
    case "STUDENT":
    default:
      return "student";
  }
};

const toFrontendPost = (item: BackendFeedResponse["data"][number]): Post => ({
  id: item.id,
  userId: item.userId,
  userName: item.user.name,
  userAvatar: item.user.avatar,
  userRole: mapBackendRoleToFrontend(item.user.role),
  source: item.source,
  type: item.type,
  mediaUrl: item.mediaUrl,
  caption: item.caption,
  likes: item._count.likes,
  comments: item._count.comments,
  location: item.location,
  timestamp: item.createdAt,
  liked: false,
  status: item.status,
});

const getAccessToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
};

const setAccessToken = (token: string): void => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
};

const clearAccessToken = (): void => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
};

async function apiRequest<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function loginBackend(email: string, password: string): Promise<BackendAuthResponse> {
  const response = await apiRequest<BackendAuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setAccessToken(response.accessToken);
  return response;
}

export async function refreshBackendAccessToken(): Promise<string> {
  const response = await apiRequest<BackendAuthResponse>("/auth/refresh", {
    method: "POST",
  });
  setAccessToken(response.accessToken);
  return response.accessToken;
}

export async function fetchFeedFromBackend(): Promise<Post[]> {
  let token = getAccessToken();
  if (!token) {
    token = await refreshBackendAccessToken();
  }

  try {
    const response = await apiRequest<BackendFeedResponse>("/feed", { method: "GET" }, token);
    return response.data.map(toFrontendPost);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const isUnauthorized = message.includes("401") || message.toLowerCase().includes("unauthorized");
    if (!isUnauthorized) throw error;

    const refreshedToken = await refreshBackendAccessToken();
    const retryResponse = await apiRequest<BackendFeedResponse>("/feed", { method: "GET" }, refreshedToken);
    return retryResponse.data.map(toFrontendPost);
  }
}

export function clearBackendAccessToken(): void {
  clearAccessToken();
}
