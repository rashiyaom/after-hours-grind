import crypto from "crypto";

export const CSRF_COOKIE_NAME = "csrfToken";

export const createCsrfToken = (): string => crypto.randomBytes(24).toString("hex");
