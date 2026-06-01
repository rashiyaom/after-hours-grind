import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { HttpError } from "./httpError.js";

const SALT_ROUNDS = 10;
const PWNED_PASSWORDS_API_BASE = "https://api.pwnedpasswords.com/range/";
const PWNED_PASSWORD_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type PasswordBreachCacheEntry = {
  breached: boolean;
  count: number;
  expiresAt: number;
};

const passwordBreachCache = new Map<string, PasswordBreachCacheEntry>();

function sha1Hex(value: string): string {
  return crypto.createHash("sha1").update(value, "utf8").digest("hex").toUpperCase();
}

async function lookupPasswordBreachCount(plain: string): Promise<number> {
  const hash = sha1Hex(plain);
  const cached = passwordBreachCache.get(hash);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.count;
  }

  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);
  const response = await fetch(`${PWNED_PASSWORDS_API_BASE}${prefix}`, {
    headers: {
      "Add-Padding": "true",
      "User-Agent": "after-hours-grind/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Password breach check failed with status ${response.status}`);
  }

  const body = await response.text();
  let count = 0;
  for (const line of body.split("\n")) {
    const [lineSuffix, lineCount] = line.trim().split(":");
    if (lineSuffix === suffix) {
      count = Number(lineCount ?? 0);
      break;
    }
  }

  passwordBreachCache.set(hash, {
    breached: count > 0,
    count,
    expiresAt: Date.now() + PWNED_PASSWORD_CACHE_TTL_MS,
  });

  return count;
}

export async function assertPasswordNotBreached(plain: string): Promise<void> {
  const count = await lookupPasswordBreachCount(plain);
  if (count > 0) {
    throw HttpError.badRequest(
      "Password has appeared in a known data breach. Choose a new, unique password."
    );
  }
}

export const hashPassword = async (plain: string): Promise<string> => {
  await assertPasswordNotBreached(plain);
  return bcrypt.hash(plain, SALT_ROUNDS);
};

export const verifyPassword = (plain: string, hash: string): Promise<boolean> =>
  bcrypt.compare(plain, hash);
