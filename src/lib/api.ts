import { Post, UserRole } from "@/types";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") || "http://localhost:4000/api";
let inMemoryAccessToken: string | null = null;

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
  liked: (item as any).isLiked || false,
  status: item.status,
});

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const getAccessToken = (): string | null => {
  return inMemoryAccessToken;
};

const setAccessToken = (token: string): void => {
  inMemoryAccessToken = token;
};

const clearAccessToken = (): void => {
  inMemoryAccessToken = null;
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
    throw new ApiError(body || `Request failed: ${response.status}`, response.status);
  }

  return (await response.json()) as T;
}

const isUnauthorizedError = (error: unknown): boolean =>
  error instanceof ApiError && error.status === 401;

async function authedRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  try {
    return await apiRequest<T>(path, init, getAccessToken() ?? undefined);
  } catch (error) {
    if (!isUnauthorizedError(error)) {
      throw error;
    }
  }

  const refreshedToken = await refreshBackendAccessToken();
  return apiRequest<T>(path, init, refreshedToken);
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
  const response = await authedRequest<BackendFeedResponse>("/feed", { method: "GET" });
  return response.data.map(toFrontendPost);
}

export function clearBackendAccessToken(): void {
  clearAccessToken();
}

// === AUTH ENTITIES ===

export async function signupBackend(data: any): Promise<BackendAuthResponse> {
  const response = await apiRequest<BackendAuthResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(data),
  });
  setAccessToken(response.accessToken);
  return response;
}

// === USER ENTITIES ===

export async function fetchCurrentUser(): Promise<any> {
  return authedRequest<any>("/me", { method: "GET" });
}

export async function fetchUserById(userId: string): Promise<any> {
  return authedRequest<any>(`/users/${userId}`, { method: "GET" });
}

// === CHAT ENTITIES ===

export async function fetchChatThreads(): Promise<any> {
  return authedRequest<any>("/threads", { method: "GET" });
}

export async function fetchChatMessages(threadId: string): Promise<any> {
  return authedRequest<any>(`/threads/${threadId}/messages`, { method: "GET" });
}

export async function sendChatMessageAPI(threadId: string, text: string, type: string = "text"): Promise<any> {
  return authedRequest<any>(`/threads/${threadId}/messages`, {
    method: "POST",
    body: JSON.stringify({ text, type })
  });
}

// === PLAN ENTITIES ===

export async function fetchTodayPlanAPI(): Promise<any> {
  return authedRequest<any>("/student/plan/today", { method: "GET" });
}

export async function submitTaskAPI(planTaskId: string, mediaUrl: string): Promise<any> {
  return authedRequest<any>("/submissions", {
    method: "POST",
    body: JSON.stringify({ planTaskId, mediaUrl })
  });
}

export async function fetchSubmissionsAPI(): Promise<any> {
  return authedRequest<any>("/submissions", { method: "GET" });
}

export async function approveSubmissionAPI(submissionId: string, trainerNote: string): Promise<any> {
  return authedRequest<any>(`/submissions/${submissionId}/approve`, {
    method: "POST",
    body: JSON.stringify({ note: trainerNote })
  });
}

export async function rejectSubmissionAPI(submissionId: string, trainerNote: string): Promise<any> {
  return authedRequest<any>(`/submissions/${submissionId}/reject`, {
    method: "POST",
    body: JSON.stringify({ note: trainerNote })
  });
}
export async function fetchEventsAPI(): Promise<any> {
  return apiRequest<any>("/events", { method: "GET" });
}

export async function registerForEventAPI(eventId: string, entries: any = {}): Promise<any> {
  return authedRequest<any>(`/events/${eventId}/register`, {
    method: "POST",
    body: JSON.stringify({ entries })
  });
}

export async function createEventAPI(data: any): Promise<any> {
  return authedRequest<any>("/events", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function updateEventAPI(eventId: string, data: any): Promise<any> {
  return authedRequest<any>(`/events/${eventId}`, {
    method: "PATCH",
    body: JSON.stringify(data)
  });
}

export async function deleteEventAPI(eventId: string): Promise<any> {
  return authedRequest<any>(`/events/${eventId}`, {
    method: "DELETE"
  });
}

export async function fetchTrainerStudentsAPI(): Promise<any> {
  return authedRequest<any>("/trainer/students", { method: "GET" });
}

export async function createPlanAPI(data: any): Promise<any> {
  return authedRequest<any>("/plans", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function fetchAdminUsersAPI(): Promise<any> {
  return authedRequest<any>("/admin/users", { method: "GET" });
}

export async function toggleUserBanAPI(userId: string): Promise<any> {
  return authedRequest<any>(`/admin/users/${userId}/ban`, { method: "PATCH" });
}

export async function updatePostModerationAPI(postId: string, status: string): Promise<any> {
  return authedRequest<any>(`/admin/posts/${postId}/moderation`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
}

export async function fetchFeaturedAthletesAPI(): Promise<any> {
    return apiRequest<any>("/athletes", { method: "GET" });
}

export async function fetchCommentsAPI(postId: string): Promise<any> {
  return authedRequest<any>(`/posts/${postId}/comments`, { method: "GET" });
}

export async function likePostAPI(postId: string): Promise<any> {
  return authedRequest<any>(`/posts/${postId}/likes`, { method: "POST" });
}

export async function unlikePostAPI(postId: string): Promise<any> {
  return authedRequest<any>(`/posts/${postId}/likes`, { method: "DELETE" });
}

export async function updateProfileAPI(payload: any): Promise<any> {
  return authedRequest<any>("/me", {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}
