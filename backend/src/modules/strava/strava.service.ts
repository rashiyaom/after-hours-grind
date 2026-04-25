import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/prisma.js";
import { env } from "../../config/env.js";
import { HttpError } from "../../lib/httpError.js";
import { invalidateFeedCache } from "../feed/feed.service.js";

const STRAVA_AUTHORIZE_URL = "https://www.strava.com/oauth/authorize";
const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";
const STRAVA_ACTIVITIES_URL = "https://www.strava.com/api/v3/athlete/activities";

type StravaTokenResponse = {
  token_type: string;
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
  athlete: {
    id: number;
    username?: string | null;
    firstname?: string | null;
    lastname?: string | null;
  };
};

type StravaActivity = {
  id: number;
  name: string;
  type: string;
  sport_type?: string;
  distance?: number;
  moving_time?: number;
  total_elevation_gain?: number;
  start_date?: string;
  location_city?: string | null;
  location_country?: string | null;
};

const ensureStravaConfig = (requiredKeys: Array<"STRAVA_CLIENT_ID" | "STRAVA_CLIENT_SECRET" | "STRAVA_REDIRECT_URI">): void => {
  const missing = requiredKeys.filter((key) => !env[key]);
  if (missing.length > 0) {
    throw HttpError.badRequest(`Strava integration is not configured. Missing env vars: ${missing.join(", ")}`);
  }
};

const safeJson = async <T>(response: Response): Promise<T | null> => {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
};

const formatDistanceKm = (meters?: number): string => {
  if (!meters || Number.isNaN(meters)) return "0.0";
  return (meters / 1000).toFixed(1);
};

const formatMovingTime = (seconds?: number): string => {
  if (!seconds || Number.isNaN(seconds)) return "0";
  return String(Math.max(1, Math.round(seconds / 60)));
};

const buildCaption = (activity: StravaActivity): string => {
  const sport = activity.sport_type || activity.type || "Activity";
  const name = activity.name?.trim() || sport;
  const distanceKm = formatDistanceKm(activity.distance);
  const movingMin = formatMovingTime(activity.moving_time);
  const elevation = Math.max(0, Math.round(activity.total_elevation_gain ?? 0));
  return `${name} · ${sport} · ${distanceKm} km · ${movingMin} min · ${elevation} m elev`;
};

const buildLocation = (activity: StravaActivity): string => {
  const city = activity.location_city?.trim();
  const country = activity.location_country?.trim();
  if (city && country) return `${city}, ${country}`;
  if (city) return city;
  if (country) return country;
  return "Strava";
};

const buildMediaUrl = (activityId: number): string => `https://www.strava.com/activities/${activityId}`;

const signOauthState = (userId: string): string => {
  const nonce = crypto.randomBytes(10).toString("hex");
  return jwt.sign({ sub: userId, nonce, provider: "strava" }, env.JWT_ACCESS_SECRET, {
    expiresIn: "10m",
  });
};

const verifyOauthState = (state: string, userId: string): void => {
  let decoded: jwt.JwtPayload;
  try {
    decoded = jwt.verify(state, env.JWT_ACCESS_SECRET) as jwt.JwtPayload;
  } catch {
    throw HttpError.badRequest("Invalid or expired Strava OAuth state");
  }

  if (decoded.provider !== "strava" || decoded.sub !== userId) {
    throw HttpError.badRequest("Invalid Strava OAuth state");
  }
};

const requestTokens = async (params: URLSearchParams): Promise<StravaTokenResponse> => {
  const tokenRes = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  const tokenPayload = await safeJson<StravaTokenResponse & { message?: string; errors?: unknown }>(tokenRes);
  if (!tokenRes.ok || !tokenPayload) {
    throw new HttpError(502, "Unable to authenticate with Strava");
  }

  if (!tokenPayload.access_token || !tokenPayload.refresh_token || !tokenPayload.athlete?.id) {
    throw new HttpError(502, "Invalid token response from Strava");
  }

  return tokenPayload;
};

const getActiveConnection = async (userId: string) => {
  const connection = await prisma.stravaConnection.findUnique({ where: { userId } });
  if (!connection) {
    throw HttpError.notFound("Strava account is not connected");
  }
  return connection;
};

const refreshTokenIfNeeded = async (userId: string) => {
  const connection = await getActiveConnection(userId);
  const shouldRefresh = connection.tokenExpiresAt.getTime() <= Date.now() + 60_000;
  if (!shouldRefresh) return connection;

  ensureStravaConfig(["STRAVA_CLIENT_ID", "STRAVA_CLIENT_SECRET"]);
  const params = new URLSearchParams({
    client_id: env.STRAVA_CLIENT_ID!,
    client_secret: env.STRAVA_CLIENT_SECRET!,
    grant_type: "refresh_token",
    refresh_token: connection.refreshToken,
  });

  const refreshed = await requestTokens(params);

  return prisma.stravaConnection.update({
    where: { id: connection.id },
    data: {
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token,
      tokenExpiresAt: new Date(refreshed.expires_at * 1000),
      athleteUsername: refreshed.athlete.username ?? null,
      athleteFirstName: refreshed.athlete.firstname ?? null,
      athleteLastName: refreshed.athlete.lastname ?? null,
    },
  });
};

const fetchActivities = async (accessToken: string, perPage: number): Promise<StravaActivity[]> => {
  const response = await fetch(`${STRAVA_ACTIVITIES_URL}?per_page=${perPage}&page=1`, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const activities = await safeJson<StravaActivity[]>(response);
  if (!response.ok || !activities) {
    throw new HttpError(502, "Unable to fetch Strava activities");
  }

  return activities;
};

export async function getStravaStatus(userId: string) {
  const connection = await prisma.stravaConnection.findUnique({ where: { userId } });
  if (!connection) {
    return {
      connected: false,
      athleteDisplayName: null,
      athleteUsername: null,
      lastSyncAt: null,
    };
  }

  return {
    connected: true,
    athleteDisplayName: [connection.athleteFirstName, connection.athleteLastName].filter(Boolean).join(" ") || null,
    athleteUsername: connection.athleteUsername ?? null,
    lastSyncAt: connection.lastSyncAt?.toISOString() ?? null,
  };
}

export async function getStravaConnectUrl(userId: string) {
  ensureStravaConfig(["STRAVA_CLIENT_ID", "STRAVA_REDIRECT_URI"]);

  const state = signOauthState(userId);
  const params = new URLSearchParams({
    client_id: env.STRAVA_CLIENT_ID!,
    redirect_uri: env.STRAVA_REDIRECT_URI!,
    response_type: "code",
    approval_prompt: "auto",
    scope: "read,activity:read_all",
    state,
  });

  return {
    connectUrl: `${STRAVA_AUTHORIZE_URL}?${params.toString()}`,
  };
}

export async function exchangeStravaCode(userId: string, input: { code: string; state: string }) {
  ensureStravaConfig(["STRAVA_CLIENT_ID", "STRAVA_CLIENT_SECRET"]);
  verifyOauthState(input.state, userId);

  const params = new URLSearchParams({
    client_id: env.STRAVA_CLIENT_ID!,
    client_secret: env.STRAVA_CLIENT_SECRET!,
    code: input.code,
    grant_type: "authorization_code",
  });

  const tokenPayload = await requestTokens(params);

  await prisma.stravaConnection.upsert({
    where: { userId },
    create: {
      userId,
      athleteId: BigInt(tokenPayload.athlete.id),
      athleteUsername: tokenPayload.athlete.username ?? null,
      athleteFirstName: tokenPayload.athlete.firstname ?? null,
      athleteLastName: tokenPayload.athlete.lastname ?? null,
      accessToken: tokenPayload.access_token,
      refreshToken: tokenPayload.refresh_token,
      tokenExpiresAt: new Date(tokenPayload.expires_at * 1000),
      scope: "read,activity:read_all",
    },
    update: {
      athleteId: BigInt(tokenPayload.athlete.id),
      athleteUsername: tokenPayload.athlete.username ?? null,
      athleteFirstName: tokenPayload.athlete.firstname ?? null,
      athleteLastName: tokenPayload.athlete.lastname ?? null,
      accessToken: tokenPayload.access_token,
      refreshToken: tokenPayload.refresh_token,
      tokenExpiresAt: new Date(tokenPayload.expires_at * 1000),
      scope: "read,activity:read_all",
    },
  });

  return syncStravaActivities(userId);
}

export async function syncStravaActivities(userId: string) {
  const connection = await refreshTokenIfNeeded(userId);
  const perPage = env.STRAVA_SYNC_PER_PAGE;
  const activities = await fetchActivities(connection.accessToken, perPage);

  let importedCount = 0;

  for (const activity of activities) {
    const externalId = String(activity.id);
    const existing = await prisma.post.findUnique({
      where: {
        source_externalId: {
          source: "strava",
          externalId,
        },
      },
      select: { id: true },
    });

    const createdAt = activity.start_date ? new Date(activity.start_date) : new Date();

    if (existing) {
      await prisma.post.update({
        where: { id: existing.id },
        data: {
          caption: buildCaption(activity),
          location: buildLocation(activity),
          mediaUrl: buildMediaUrl(activity.id),
          type: "image",
          status: "visible",
        },
      });
      continue;
    }

    await prisma.post.create({
      data: {
        userId,
        source: "strava",
        externalId,
        caption: buildCaption(activity),
        location: buildLocation(activity),
        mediaUrl: buildMediaUrl(activity.id),
        type: "image",
        status: "visible",
        createdAt,
      },
    });

    importedCount += 1;
  }

  const updatedConnection = await prisma.stravaConnection.update({
    where: { userId },
    data: { lastSyncAt: new Date() },
  });

  if (importedCount > 0) {
    await invalidateFeedCache();
  }

  return {
    connected: true,
    importedCount,
    fetchedCount: activities.length,
    lastSyncAt: updatedConnection.lastSyncAt?.toISOString() ?? new Date().toISOString(),
  };
}

export async function disconnectStrava(userId: string) {
  await prisma.stravaConnection.deleteMany({ where: { userId } });
  return { connected: false };
}
