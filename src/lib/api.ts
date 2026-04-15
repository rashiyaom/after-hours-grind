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
  user?: { id: string; name: string; avatar: string };
};

type ApiFollowerEdge = {
  id: string;
  createdAt: string;
  follower?: {
    id: string;
    name: string;
    avatar: string;
    role: "STUDENT" | "TRAINER" | "ADMIN";
  };
  following?: {
    id: string;
    name: string;
    avatar: string;
    role: "STUDENT" | "TRAINER" | "ADMIN";
  };
};

type ApiSubmission = {
  id: string;
  studentId: string;
  mediaUrl: string;
  status: string;
  createdAt: string;
  trainerNote?: string | null;
  student?: { name?: string };
  planTask?: { title?: string; name?: string; type?: string; points?: number };
};

type ApiSubmitTaskResponse = ApiRecord & {
  whatsappUrl?: string;
  proofRefId?: string;
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

const getAccessToken = (): string | null => inMemoryAccessToken;

const getCsrfToken = (): string | null => {
  if (typeof document === "undefined") return null;
  const tokenEntry = document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith("csrfToken="));
  if (!tokenEntry) return null;
  return decodeURIComponent(tokenEntry.slice("csrfToken=".length));
};

const isSafeHttpMethod = (method: string | undefined): boolean => {
  const normalized = (method ?? "GET").toUpperCase();
  return normalized === "GET" || normalized === "HEAD" || normalized === "OPTIONS";
};

const setAccessToken = (token: string): void => {
  inMemoryAccessToken = token;
};

const clearAccessToken = (): void => {
  inMemoryAccessToken = null;
};

async function apiRequest<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(init.headers);
  const isFormDataBody = typeof FormData !== "undefined" && init.body instanceof FormData;
  if (!isFormDataBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!isSafeHttpMethod(init.method)) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers.set("x-csrf-token", csrfToken);
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    try {
      const raw = await response.text();
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as { error?: string; message?: string };
          message = parsed.error || parsed.message || raw;
        } catch {
          message = raw;
        }
      }
    } catch {
      // Keep default message when response body cannot be read.
    }
    throw new ApiError(message, response.status);
  }

  return (await response.json()) as T;
}

const isUnauthorizedError = (error: unknown): boolean =>
  error instanceof ApiError && error.status === 401;

const isCsrfError = (error: unknown): boolean =>
  error instanceof ApiError && error.status === 403 && error.message.includes("CSRF token invalid or missing");

async function refreshBackendAccessToken(): Promise<string> {
  const response = await apiRequest<BackendAuthResponse>("/auth/refresh", {
    method: "POST",
  });
  setAccessToken(response.accessToken);
  return response.accessToken;
}

async function authedRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  try {
    return await apiRequest<T>(path, init, getAccessToken() ?? undefined);
  } catch (error) {
    if (!isUnauthorizedError(error) && !isCsrfError(error)) {
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
  if (cursor) params.set("cursor", cursor);
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

type RealtimeEventPayload = {
  type:
    | "chat.message"
    | "notification.created"
    | "notification.updated"
    | "submission.created"
    | "submission.updated"
    | "post.created"
    | "post.updated"
    | "ready";
  payload: Record<string, unknown>;
};

export function subscribeRealtimeEvents(
  onEvent: (event: RealtimeEventPayload) => void,
  onError?: (error: Event) => void
): () => void {
  const stream = new EventSource(`${API_BASE_URL}/stream/events`, { withCredentials: true });

  const forward = (type: RealtimeEventPayload["type"]) => (event: MessageEvent<string>) => {
    try {
      const payload = JSON.parse(event.data) as Record<string, unknown>;
      onEvent({ type, payload });
    } catch {
      onEvent({ type, payload: {} });
    }
  };

  stream.addEventListener("ready", forward("ready"));
  stream.addEventListener("chat.message", forward("chat.message"));
  stream.addEventListener("notification.created", forward("notification.created"));
  stream.addEventListener("notification.updated", forward("notification.updated"));
  stream.addEventListener("submission.created", forward("submission.created"));
  stream.addEventListener("submission.updated", forward("submission.updated"));
  stream.addEventListener("post.created", forward("post.created"));
  stream.addEventListener("post.updated", forward("post.updated"));
  stream.onerror = (error) => onError?.(error);

  return () => {
    stream.close();
  };
}

export async function signupBackend(data: {
  name: string;
  email: string;
  password: string;
  role: string;
  collegeId?: string;
  height?: number;
  weight?: number;
  fitnessGoal?: string;
  specialization?: string;
  whatsappNumber?: string;
  experience?: number;
  certifications?: string | string[];
}): Promise<BackendAuthResponse> {
  const response = await apiRequest<BackendAuthResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(data),
  });
  setAccessToken(response.accessToken);
  return response;
}

export async function fetchCurrentUser(): Promise<ApiCurrentUser> {
  return authedRequest<ApiCurrentUser>("/me", { method: "GET" });
}

export async function fetchChatThreads(): Promise<ApiRecord[]> {
  return authedRequest<ApiRecord[]>("/threads", { method: "GET" });
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

export async function fetchTodayPlanAPI(): Promise<ApiRecord> {
  return authedRequest<ApiRecord>("/student/plan/today", { method: "GET" });
}

export async function generatePersonalizedPlanAPI(): Promise<ApiRecord> {
  return authedRequest<ApiRecord>("/student/plan/generate", { method: "POST" });
}

export async function submitTaskAPI(payload: { planTaskId: string; studentNote?: string }): Promise<ApiSubmitTaskResponse> {
  return authedRequest<ApiSubmitTaskResponse>("/submissions", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function uploadMediaFile(file: File): Promise<{ url: string; provider: string; bytes: number; contentType: string }> {
  const formData = new FormData();
  formData.append("file", file);

  return authedRequest<{ url: string; provider: string; bytes: number; contentType: string }>("/uploads/media", {
    method: "POST",
    body: formData,
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

export async function verifyTrainerAPI(userId: string): Promise<ApiRecord> {
  return authedRequest<ApiRecord>(`/admin/users/${userId}/verify-trainer`, { method: "PATCH" });
}

export async function assignStudentTrainerAdminAPI(studentId: string, trainerId: string | null): Promise<ApiRecord> {
  return authedRequest<ApiRecord>(`/admin/users/${studentId}/trainer`, {
    method: "PATCH",
    body: JSON.stringify({ trainerId }),
  });
}

export async function fetchFeaturedAthletesAPI(): Promise<ApiRecord[]> {
  return apiRequest<ApiRecord[]>("/athletes", { method: "GET" });
}

export async function fetchCommentsAPI(postId: string): Promise<ApiComment[]> {
  return authedRequest<ApiComment[]>(`/posts/${postId}/comments`, { method: "GET" });
}

export async function createPostAPI(payload: {
  type: "image" | "video" | "reel";
  mediaUrl: string;
  caption: string;
  source?: "general" | "task-proof";
  location?: string;
}): Promise<ApiRecord> {
  return authedRequest<ApiRecord>("/posts", {
    method: "POST",
    body: JSON.stringify({
      source: "general",
      location: "Campus",
      ...payload,
    }),
  });
}

export async function addCommentAPI(postId: string, text: string): Promise<ApiComment> {
  return authedRequest<ApiComment>(`/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export async function likePostAPI(postId: string): Promise<ApiRecord> {
  return authedRequest<ApiRecord>(`/posts/${postId}/likes`, { method: "POST" });
}

export async function unlikePostAPI(postId: string): Promise<ApiRecord> {
  return authedRequest<ApiRecord>(`/posts/${postId}/likes`, { method: "DELETE" });
}

export async function fetchUserProfileAPI(userId: string): Promise<ApiRecord> {
  return authedRequest<ApiRecord>(`/users/${userId}`, { method: "GET" });
}

export async function followUserAPI(userId: string): Promise<ApiRecord> {
  return authedRequest<ApiRecord>(`/users/${userId}/follow`, { method: "POST" });
}

export async function unfollowUserAPI(userId: string): Promise<ApiRecord> {
  return authedRequest<ApiRecord>(`/users/${userId}/follow`, { method: "DELETE" });
}

export async function fetchFollowersAPI(userId: string): Promise<ApiFollowerEdge[]> {
  return authedRequest<ApiFollowerEdge[]>(`/users/${userId}/followers`, { method: "GET" });
}

export async function fetchFollowingAPI(userId: string): Promise<ApiFollowerEdge[]> {
  return authedRequest<ApiFollowerEdge[]>(`/users/${userId}/following`, { method: "GET" });
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

export async function fetchLeaderboardAPI(limit = 50): Promise<ApiRecord[]> {
  return authedRequest<ApiRecord[]>(`/leaderboard?limit=${limit}`, { method: "GET" });
}

export async function fetchProgressOverviewAPI(): Promise<ApiRecord> {
  return authedRequest<ApiRecord>("/progress", { method: "GET" });
}

export async function fetchProgressWeeklyAPI(): Promise<ApiRecord> {
  return authedRequest<ApiRecord>("/progress/weekly", { method: "GET" });
}

export async function fetchProgressMonthlyAPI(planId: string): Promise<ApiRecord> {
  return authedRequest<ApiRecord>(`/progress/monthly/${planId}`, { method: "GET" });
}

export async function fetchProgressHeatmapAPI(): Promise<ApiRecord> {
  return authedRequest<ApiRecord>("/progress/heatmap", { method: "GET" });
}

export async function fetchSettingsAPI(): Promise<ApiRecord> {
  return authedRequest<ApiRecord>("/settings", { method: "GET" });
}

export async function updateSettingsAPI(data: ApiRecord): Promise<ApiRecord> {
  return authedRequest<ApiRecord>("/settings", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function fetchAdminStatsAPI(): Promise<ApiRecord> {
  return authedRequest<ApiRecord>("/admin/stats", { method: "GET" });
}

export async function fetchFlaggedContentAPI(): Promise<ApiRecord> {
  return authedRequest<ApiRecord>("/admin/moderation", { method: "GET" });
}

export async function fetchAdminActivityLogsAPI(): Promise<ApiRecord> {
  return authedRequest<ApiRecord>("/admin/activity-logs", { method: "GET" });
}

export async function fetchAdminPermissionsAPI(): Promise<ApiRecord> {
  return authedRequest<ApiRecord>("/admin/permissions", { method: "GET" });
}

export async function setAdminPermissionAPI(role: "STUDENT" | "TRAINER" | "ADMIN", permission: string, allowed: boolean): Promise<ApiRecord> {
  return authedRequest<ApiRecord>("/admin/permissions", {
    method: "PATCH",
    body: JSON.stringify({ role, permission, allowed }),
  });
}

export async function resetAdminPermissionsAPI(): Promise<ApiRecord> {
  return authedRequest<ApiRecord>("/admin/permissions/reset", { method: "POST" });
}

export async function fetchExerciseTemplatesAPI(options?: {
  q?: string;
  category?: string;
  activeOnly?: boolean;
}): Promise<ApiRecord[]> {
  const params = new URLSearchParams();
  if (options?.q) params.set("q", options.q);
  if (options?.category) params.set("category", options.category);
  if (typeof options?.activeOnly === "boolean") params.set("activeOnly", String(options.activeOnly));
  const query = params.toString();
  return authedRequest<ApiRecord[]>(`/admin/exercise-templates${query ? `?${query}` : ""}`, { method: "GET" });
}

export async function createExerciseTemplateAPI(payload: ApiRecord): Promise<ApiRecord> {
  return authedRequest<ApiRecord>("/admin/exercise-templates", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateExerciseTemplateAPI(templateId: string, payload: ApiRecord): Promise<ApiRecord> {
  return authedRequest<ApiRecord>(`/admin/exercise-templates/${templateId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteExerciseTemplateAPI(templateId: string): Promise<ApiRecord> {
  return authedRequest<ApiRecord>(`/admin/exercise-templates/${templateId}`, {
    method: "DELETE",
  });
}

export async function fetchExerciseTemplateAssignmentsAPI(): Promise<ApiRecord[]> {
  return authedRequest<ApiRecord[]>("/admin/exercise-templates/assignments", { method: "GET" });
}

export async function assignExerciseTemplateAPI(payload: {
  templateId: string;
  studentIds: string[];
  dayNumber: number;
  sortOrder?: number;
}): Promise<ApiRecord> {
  return authedRequest<ApiRecord>("/admin/exercise-templates/assign", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function assignExerciseTemplateBulkAPI(payload: {
  studentIds: string[];
  dayPlans: Array<{
    dayNumber: number;
    templateIds: string[];
  }>;
}): Promise<ApiRecord> {
  return authedRequest<ApiRecord>("/admin/exercise-templates/assign-bulk", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
