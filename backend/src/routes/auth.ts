import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { clearAuthCookie, setAuthCookie, signToken } from "../lib/auth.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/auth.js";

const loginSchema = z.object({
  username: z.string().min(1).max(64),
  password: z.string().min(6).max(128),
});

export const authRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "登录尝试过于频繁，请稍后再试" },
});

authRouter.post("/login", loginLimiter, async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const user = await prisma.adminUser.findUnique({
      where: { username: body.username },
    });
    if (!user || !user.isActive) {
      res.status(401).json({ error: "用户名或密码错误" });
      return;
    }
    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) {
      res.status(401).json({ error: "用户名或密码错误" });
      return;
    }
    const token = signToken({ sub: user.id, username: user.username });
    setAuthCookie(res, token);
    res.json({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
      },
    });
  } catch (e) {
    next(e);
  }
});

authRouter.post("/logout", (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

authRouter.get("/me", requireAdmin, async (req: AuthedRequest, res, next) => {
  try {
    const user = await prisma.adminUser.findUnique({
      where: { id: req.admin!.id },
      select: {
        id: true,
        username: true,
        displayName: true,
        isActive: true,
        createdAt: true,
      },
    });
    if (!user) {
      res.status(401).json({ error: "用户不存在" });
      return;
    }
    res.json({ user });
  } catch (e) {
    next(e);
  }
});
