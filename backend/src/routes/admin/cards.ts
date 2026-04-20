import { Router } from "express";
import { z } from "zod";
import { normalizePublicMediaUrl, normalizedMediaOrOriginal } from "../../lib/mediaUrl.js";
import { prisma } from "../../lib/prisma.js";
import { paramAsString } from "../../lib/params.js";
import { linkUrlForCreate, linkUrlForPatch } from "../../lib/safeUrl.js";
import { zAssetUrlField, zNullishHttpUrl } from "../../lib/zodUrl.js";

const cardCreateSchema = z
  .object({
    title: z.string().min(1).max(255),
    subtitle: z.string().max(512).nullable().optional(),
    body: z.string().min(1).max(20000),
    imageUrl: zAssetUrlField(),
    linkLabel: z.string().max(128).nullable().optional(),
    linkUrl: zNullishHttpUrl,
    badge: z.string().max(64).nullable().optional(),
    sortOrder: z.number().int().optional(),
    published: z.boolean().optional(),
  })
  .strict();

const cardUpdateSchema = cardCreateSchema.partial();

export const adminCardsRouter = Router();

adminCardsRouter.get("/", async (_req, res, next) => {
  try {
    const cards = await prisma.contentCard.findMany({
      orderBy: { sortOrder: "asc" },
    });
    res.json({
      cards: cards.map((c) => ({ ...c, imageUrl: normalizedMediaOrOriginal(c.imageUrl) })),
    });
  } catch (e) {
    next(e);
  }
});

adminCardsRouter.post("/", async (req, res, next) => {
  try {
    const data = cardCreateSchema.parse(req.body);
    const card = await prisma.contentCard.create({
      data: {
        title: data.title,
        subtitle: data.subtitle ?? null,
        body: data.body,
        imageUrl: normalizePublicMediaUrl(data.imageUrl),
        linkLabel: data.linkLabel ?? null,
        linkUrl: linkUrlForCreate(data.linkUrl),
        badge: data.badge ?? null,
        sortOrder: data.sortOrder ?? 0,
        published: data.published ?? true,
      },
    });
    res.status(201).json({ card });
  } catch (e) {
    next(e);
  }
});

adminCardsRouter.put("/:id", async (req, res, next) => {
  try {
    const id = paramAsString(req.params.id);
    if (!id) {
      res.status(400).json({ error: "无效 id" });
      return;
    }
    const data = cardUpdateSchema.parse(req.body);
    const card = await prisma.contentCard.update({
      where: { id },
      data: {
        ...data,
        subtitle: data.subtitle === undefined ? undefined : data.subtitle,
        imageUrl: data.imageUrl === undefined ? undefined : normalizePublicMediaUrl(data.imageUrl),
        linkLabel: data.linkLabel === undefined ? undefined : data.linkLabel,
        linkUrl: linkUrlForPatch(data.linkUrl),
        badge: data.badge === undefined ? undefined : data.badge,
      },
    });
    res.json({ card });
  } catch (e) {
    next(e);
  }
});

adminCardsRouter.delete("/:id", async (req, res, next) => {
  try {
    const id = paramAsString(req.params.id);
    if (!id) {
      res.status(400).json({ error: "无效 id" });
      return;
    }
    await prisma.contentCard.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});
