import { Router } from "express";
import { z } from "zod";
import { normalizePublicMediaUrl, normalizedMediaOrOriginal } from "../../lib/mediaUrl.js";
import { prisma } from "../../lib/prisma.js";
import { paramAsString } from "../../lib/params.js";
import { zAssetUrlField, zRequiredHttpUrl } from "../../lib/zodUrl.js";

const createSchema = z
  .object({
    name: z.string().min(1).max(255),
    description: z.string().min(1).max(20000),
    url: zRequiredHttpUrl,
    logoUrl: zAssetUrlField(),
    sortOrder: z.number().int().optional(),
    published: z.boolean().optional(),
  })
  .strict();

const updateSchema = createSchema.partial();

export const adminOpenSourceProjectsRouter = Router();

adminOpenSourceProjectsRouter.get("/", async (_req, res, next) => {
  try {
    const projects = await prisma.openSourceProject.findMany({
      orderBy: { sortOrder: "asc" },
    });
    res.json({
      projects: projects.map((p) => ({ ...p, logoUrl: normalizedMediaOrOriginal(p.logoUrl) })),
    });
  } catch (e) {
    next(e);
  }
});

adminOpenSourceProjectsRouter.post("/", async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    const project = await prisma.openSourceProject.create({
      data: {
        name: data.name,
        description: data.description,
        url: data.url,
        logoUrl: normalizePublicMediaUrl(data.logoUrl),
        sortOrder: data.sortOrder ?? 0,
        published: data.published ?? true,
      },
    });
    res.status(201).json({ project });
  } catch (e) {
    next(e);
  }
});

adminOpenSourceProjectsRouter.put("/:id", async (req, res, next) => {
  try {
    const id = paramAsString(req.params.id);
    if (!id) {
      res.status(400).json({ error: "无效 id" });
      return;
    }
    const data = updateSchema.parse(req.body);
    const project = await prisma.openSourceProject.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        url: data.url,
        logoUrl: data.logoUrl === undefined ? undefined : normalizePublicMediaUrl(data.logoUrl),
        sortOrder: data.sortOrder,
        published: data.published,
      },
    });
    res.json({ project });
  } catch (e) {
    next(e);
  }
});

adminOpenSourceProjectsRouter.delete("/:id", async (req, res, next) => {
  try {
    const id = paramAsString(req.params.id);
    if (!id) {
      res.status(400).json({ error: "无效 id" });
      return;
    }
    await prisma.openSourceProject.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});
