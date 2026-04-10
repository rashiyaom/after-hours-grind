import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";

export interface TokenPayload {
  userId: string;
  role: string;
}

const accessSignOptions: SignOptions = { expiresIn: env.ACCESS_TOKEN_TTL as SignOptions["expiresIn"] };
const refreshSignOptions: SignOptions = { expiresIn: env.REFRESH_TOKEN_TTL as SignOptions["expiresIn"] };

export const signAccessToken = (payload: TokenPayload): string =>
  jwt.sign(payload, env.JWT_ACCESS_SECRET, accessSignOptions);

export const signRefreshToken = (payload: TokenPayload): string =>
  jwt.sign(payload, env.JWT_REFRESH_SECRET, refreshSignOptions);

export const verifyAccessToken = (token: string): TokenPayload =>
  jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;

export const verifyRefreshToken = (token: string): TokenPayload =>
  jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
