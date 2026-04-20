import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma.js";
import type { AuthedRequest } from "../../middleware/auth.js";
import { paramAsString } from "../../lib/params.js";

const createUserSchema = z
  .object({
    username: z.string().min(3).max(64).regex(/^[a-zA-Z0-9_-]+$/),
    password: z.string().min(6).max(128),
    displayName: z.string().max(128).nullable().optional(),
  })
  .strict();

const updateUserSchema = z
  .object({
    displayName: z.string().max(128).nullable().optional(),
    password: z.string().min(6).max(128).optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

export const adminUsersRouter = Router();

adminUsersRouter.get("/", async (_req, res, next) => {
  try {
    const users = await prisma.adminUser.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        username: true,
        displayName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.json({ users });
  } catch (e) {
    next(e);
  }
});

adminUsersRouter.post("/", async (req, res, next) => {
  try {
    const data = createUserSchema.parse(req.body);
    const exists = await prisma.adminUser.findUnique({
      where: { username: data.username },
    });
    if (exists) {
      res.status(409).json({ error: "用户名已存在" });
      return;
    }
    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.adminUser.create({
      data: {
        username: data.username,
        passwordHash,
        displayName: data.displayName ?? null,
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        isActive: true,
        createdAt: true,
      },
    });
    res.status(201).json({ user });
  } catch (e) {
    next(e);
  }
});

adminUsersRouter.put("/:id", async (req: AuthedRequest, res, next) => {
  try {
    const id = paramAsString(req.params.id);
    if (!id) {
      res.status(400).json({ error: "无效 id" });
      return;
    }
    const data = updateUserSchema.parse(req.body);

    if (id === req.admin?.id && data.isActive === false) {
      res.status(400).json({ error: "不能停用自己" });
      return;
    }

    const passwordHash =
      data.password !== undefined ? await bcrypt.hash(data.password, 12) : undefined;

    const user = await prisma.adminUser.update({
      where: { id },
      data: {
        displayName: data.displayName,
        isActive: data.isActive,
        ...(passwordHash ? { passwordHash } : {}),
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        isActive: true,
        updatedAt: true,
      },
    });
    res.json({ user });
  } catch (e) {
    next(e);
  }
});

adminUsersRouter.delete("/:id", async (req: AuthedRequest, res, next) => {
  try {
    const id = paramAsString(req.params.id);
    if (!id) {
      res.status(400).json({ error: "无效 id" });
      return;
    }
    if (id === req.admin?.id) {
      res.status(400).json({ error: "不能删除当前登录账号" });
      return;
    }
    const total = await prisma.adminUser.count();
    if (total <= 1) {
      res.status(400).json({ error: "至少保留一名管理员" });
      return;
    }
    await prisma.adminUser.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});
