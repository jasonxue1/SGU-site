import { Router } from "express";
import { z } from "zod";
import { normalizePublicMediaUrl, normalizedMediaOrOriginal } from "../../lib/mediaUrl.js";
import { prisma } from "../../lib/prisma.js";
import { paramAsString } from "../../lib/params.js";
import { linkUrlForCreate, linkUrlForPatch } from "../../lib/safeUrl.js";
import { zAssetUrlField, zNullishHttpUrl } from "../../lib/zodUrl.js";

const createSchema = z
  .object({
    name: z.string().min(1).max(128),
    role: z.string().max(128).nullable().optional(),
    bio: z.string().min(1).max(20000),
    avatarUrl: zAssetUrlField(),
    linkLabel: z.string().max(128).nullable().optional(),
    linkUrl: zNullishHttpUrl,
    sortOrder: z.number().int().optional(),
    published: z.boolean().optional(),
  })
  .strict();

const updateSchema = createSchema.partial();

export const adminTeamMembersRouter = Router();

adminTeamMembersRouter.get("/", async (_req, res, next) => {
  try {
    const members = await prisma.teamMember.findMany({
      orderBy: { sortOrder: "asc" },
    });
    res.json({
      members: members.map((m) => ({ ...m, avatarUrl: normalizedMediaOrOriginal(m.avatarUrl) })),
    });
  } catch (e) {
    next(e);
  }
});

adminTeamMembersRouter.post("/", async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    const member = await prisma.teamMember.create({
      data: {
        name: data.name,
        role: data.role ?? null,
        bio: data.bio,
        avatarUrl: normalizePublicMediaUrl(data.avatarUrl),
        linkLabel: data.linkLabel ?? null,
        linkUrl: linkUrlForCreate(data.linkUrl),
        sortOrder: data.sortOrder ?? 0,
        published: data.published ?? true,
      },
    });
    res.status(201).json({ member });
  } catch (e) {
    next(e);
  }
});

adminTeamMembersRouter.put("/:id", async (req, res, next) => {
  try {
    const id = paramAsString(req.params.id);
    if (!id) {
      res.status(400).json({ error: "无效 id" });
      return;
    }
    const data = updateSchema.parse(req.body);
    const member = await prisma.teamMember.update({
      where: { id },
      data: {
        name: data.name,
        role: data.role === undefined ? undefined : data.role,
        bio: data.bio,
        avatarUrl: data.avatarUrl === undefined ? undefined : normalizePublicMediaUrl(data.avatarUrl),
        linkLabel: data.linkLabel === undefined ? undefined : data.linkLabel,
        linkUrl: linkUrlForPatch(data.linkUrl),
        sortOrder: data.sortOrder,
        published: data.published,
      },
    });
    res.json({ member });
  } catch (e) {
    next(e);
  }
});

adminTeamMembersRouter.delete("/:id", async (req, res, next) => {
  try {
    const id = paramAsString(req.params.id);
    if (!id) {
      res.status(400).json({ error: "无效 id" });
      return;
    }
    await prisma.teamMember.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});
