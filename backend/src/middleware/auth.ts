import type { Request, Response, NextFunction } from "express";
import { COOKIE_NAME, verifyToken } from "../lib/auth.js";
import { prisma } from "../lib/prisma.js";

export type AuthedRequest = Request & {
  admin?: { id: string; username: string };
};

export async function requireAdmin(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const raw = req.cookies?.[COOKIE_NAME] as string | undefined;
    if (!raw) {
      res.status(401).json({ error: "未登录" });
      return;
    }
    const payload = verifyToken(raw);
    const user = await prisma.adminUser.findUnique({
      where: { id: payload.sub },
      select: { id: true, username: true, isActive: true },
    });
    if (!user || !user.isActive) {
      res.status(401).json({ error: "账号无效或已停用" });
      return;
    }
    req.admin = { id: user.id, username: user.username };
    next();
  } catch {
    res.status(401).json({ error: "登录已过期，请重新登录" });
  }
}
