import { AHGEvent, Post, User, UserRole } from "@/types";

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

type FeedPageResponse = {
  data: Post[];
  nextCursor: string | null;
};

type BackendNotificationsResponse = {
  data: Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
  }>;
  nextCursor: string | null;
};

type ApiRecord = Record<string, unknown>;

type ApiComment = {
  id: string;
  text: string;
  createdAt: string;
  userId: string;
  postId: string;
};

type ApiSubmission = {
  id: string;
  studentId: string;
  mediaUrl: string;
  status: string;
  createdAt: string;
  trainerNote?: string | null;
  student?: { name?: string };
  planTask?: { name?: string; type?: string; points?: number };
};

type ApiChatMessagePayload = {
  text?: string;
  type?: "text" | "reel-share" | "voice-note";
  voiceSeconds?: number;
  voiceAudioUrl?: string;
  reelPostId?: string;
  reelPreviewUrl?: string;
  reelCaption?: string;
};

type ApiEventPayload = Omit<AHGEvent, "id" | "createdAt" | "entries" | "status">;
type ApiEventEntryPayload = Record<string, string | string[]>;
type ApiCurrentUser = User;
type BackendFeedItemWithLiked = BackendFeedResponse["data"][number] & { isLiked?: boolean };

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
  liked: Boolean((item as BackendFeedItemWithLiked).isLiked),
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

export async function logoutBackend(): Promise<void> {
  try {
    await authedRequest<ApiRecord>("/auth/logout", { method: "POST" });
  } finally {
    clearAccessToken();
  }
}

export async function fetchFeedFromBackend(): Promise<Post[]> {
  const response = await fetchFeedPageFromBackend();
  return response.data;
}

export async function fetchFeedPageFromBackend(cursor?: string, limit = 20): Promise<FeedPageResponse> {
  const params = new URLSearchParams();
  if (cursor) {
    params.set("cursor", cursor);
  }
  params.set("limit", String(limit));

  const query = params.toString();
  const path = query ? `/feed?${query}` : "/feed";
  const response = await authedRequest<BackendFeedResponse>(path, { method: "GET" });
  return {
    data: response.data.map(toFrontendPost),
    nextCursor: response.nextCursor,
  };
}

export function clearBackendAccessToken(): void {
  clearAccessToken();
}

// === AUTH ENTITIES ===

export async function signupBackend(data: { name: string; email: string; password: string; role: string }): Promise<BackendAuthResponse> {
  const response = await apiRequest<BackendAuthResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(data),
  });
  setAccessToken(response.accessToken);
  return response;
}

// === USER ENTITIES ===

export async function fetchCurrentUser(): Promise<ApiCurrentUser> {
  return authedRequest<ApiCurrentUser>("/me", { method: "GET" });
}

export async function fetchUserById(userId: string): Promise<ApiRecord> {
  return authedRequest<ApiRecord>(`/users/${userId}`, { method: "GET" });
}

// === CHAT ENTITIES ===

export async function fetchChatThreads(): Promise<ApiRecord[]> {
  return authedRequest<ApiRecord[]>("/threads", { method: "GET" });
}

export async function fetchChatMessages(threadId: string): Promise<ApiRecord[]> {
  return authedRequest<ApiRecord[]>(`/threads/${threadId}/messages`, { method: "GET" });
}

export async function createChatThreadAPI(participantId: string): Promise<ApiRecord> {
  return authedRequest<ApiRecord>("/threads", {
    method: "POST",
    body: JSON.stringify({ participantId }),
  });
}

export async function sendChatMessageAPI(threadId: string, payload: ApiChatMessagePayload): Promise<ApiRecord> {
  return authedRequest<ApiRecord>(`/threads/${threadId}/messages`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

// === PLAN ENTITIES ===

export async function fetchTodayPlanAPI(): Promise<ApiRecord> {
  return authedRequest<ApiRecord>("/student/plan/today", { method: "GET" });
}

export async function submitTaskAPI(planTaskId: string, mediaUrl: string): Promise<ApiRecord> {
  return authedRequest<ApiRecord>("/submissions", {
    method: "POST",
    body: JSON.stringify({ planTaskId, mediaUrl })
  });
}

export async function fetchSubmissionsAPI(): Promise<ApiSubmission[]> {
  return authedRequest<ApiSubmission[]>("/submissions", { method: "GET" });
}

export async function approveSubmissionAPI(submissionId: string, trainerNote: string): Promise<ApiRecord> {
  return authedRequest<ApiRecord>(`/submissions/${submissionId}/approve`, {
    method: "POST",
    body: JSON.stringify({ note: trainerNote })
  });
}

export async function rejectSubmissionAPI(submissionId: string, trainerNote: string): Promise<ApiRecord> {
  return authedRequest<ApiRecord>(`/submissions/${submissionId}/reject`, {
    method: "POST",
    body: JSON.stringify({ note: trainerNote })
  });
}
export async function fetchEventsAPI(): Promise<AHGEvent[]> {
  return apiRequest<AHGEvent[]>("/events", { method: "GET" });
}

export async function registerForEventAPI(eventId: string, entries: ApiEventEntryPayload = {}): Promise<ApiRecord> {
  return authedRequest<ApiRecord>(`/events/${eventId}/register`, {
    method: "POST",
    body: JSON.stringify({ entries })
  });
}

export async function createEventAPI(data: ApiEventPayload): Promise<AHGEvent> {
  return authedRequest<AHGEvent>("/events", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function updateEventAPI(eventId: string, data: Partial<ApiEventPayload>): Promise<AHGEvent> {
  return authedRequest<AHGEvent>(`/events/${eventId}`, {
    method: "PATCH",
    body: JSON.stringify(data)
  });
}

export async function deleteEventAPI(eventId: string): Promise<ApiRecord> {
  return authedRequest<ApiRecord>(`/events/${eventId}`, {
    method: "DELETE"
  });
}

export async function fetchTrainerStudentsAPI(): Promise<ApiRecord[]> {
  return authedRequest<ApiRecord[]>("/trainer/students", { method: "GET" });
}

export async function createPlanAPI(data: ApiRecord): Promise<ApiRecord> {
  return authedRequest<ApiRecord>("/plans", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function fetchAdminUsersAPI(): Promise<ApiCurrentUser[]> {
  return authedRequest<ApiCurrentUser[]>("/admin/users", { method: "GET" });
}

export async function toggleUserBanAPI(userId: string): Promise<ApiRecord> {
  return authedRequest<ApiRecord>(`/admin/users/${userId}/ban`, { method: "PATCH" });
}

export async function updatePostModerationAPI(postId: string, status: string): Promise<ApiRecord> {
  return authedRequest<ApiRecord>(`/admin/posts/${postId}/moderation`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
}

export async function fetchFeaturedAthletesAPI(): Promise<ApiRecord[]> {
    return apiRequest<ApiRecord[]>("/athletes", { method: "GET" });
}

export async function fetchCommentsAPI(postId: string): Promise<ApiComment[]> {
  return authedRequest<ApiComment[]>(`/posts/${postId}/comments`, { method: "GET" });
}

export async function likePostAPI(postId: string): Promise<ApiRecord> {
  return authedRequest<ApiRecord>(`/posts/${postId}/likes`, { method: "POST" });
}

export async function unlikePostAPI(postId: string): Promise<ApiRecord> {
  return authedRequest<ApiRecord>(`/posts/${postId}/likes`, { method: "DELETE" });
}

export async function fetchNotificationsAPI(cursor?: string, limit = 30): Promise<BackendNotificationsResponse> {
  const params = new URLSearchParams();
  if (cursor) {
    params.set("cursor", cursor);
  }
  params.set("limit", String(limit));

  const query = params.toString();
  const path = query ? `/notifications?${query}` : "/notifications";
  return authedRequest<BackendNotificationsResponse>(path, { method: "GET" });
}

export async function markNotificationReadAPI(notificationId: string): Promise<ApiRecord> {
  return authedRequest<ApiRecord>(`/notifications/${notificationId}/read`, { method: "POST" });
}

export async function updateProfileAPI(payload: ApiRecord): Promise<ApiCurrentUser> {
  return authedRequest<ApiCurrentUser>("/me", {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}
