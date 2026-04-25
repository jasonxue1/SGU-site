import jwt from "jsonwebtoken";
import type { Response } from "express";

const COOKIE_NAME = "sgu_admin_token";

export type JwtPayload = {
  sub: string;
  username: string;
};

export function getJwtSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 32) {
    throw new Error("JWT_SECRET 未设置或过短（至少 32 字符）");
  }
  return s;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: "8h",
    issuer: "sgu-server-cms",
    audience: "sgu-admin",
  });
}

export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, getJwtSecret(), {
    issuer: "sgu-server-cms",
    audience: "sgu-admin",
  });
  if (typeof decoded === "string" || !decoded || typeof decoded !== "object") {
    throw new Error("无效令牌");
  }
  const sub = (decoded as jwt.JwtPayload).sub;
  const username = (decoded as jwt.JwtPayload & { username?: string }).username;
  if (!sub || !username) throw new Error("无效令牌");
  return { sub, username };
}

export function setAuthCookie(res: Response, token: string): void {
  const secure = process.env.NODE_ENV === "production";
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    maxAge: 8 * 60 * 60 * 1000,
    path: "/",
  });
}

export function clearAuthCookie(res: Response): void {
  const secure = process.env.NODE_ENV === "production";
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
  });
}

export { COOKIE_NAME };
