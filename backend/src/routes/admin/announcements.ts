import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { paramAsString } from "../../lib/params.js";
import { linkUrlForCreate, linkUrlForPatch } from "../../lib/safeUrl.js";
import { zNullishHttpUrl } from "../../lib/zodUrl.js";

function parseAnnouncedAt(raw: string | null | undefined): Date | null {
  if (raw === undefined || raw === null || raw === "") return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

const createSchema = z
  .object({
    title: z.string().min(1).max(255),
    body: z.string().min(1).max(100_000),
    linkLabel: z.string().max(128).nullable().optional(),
    linkUrl: zNullishHttpUrl,
    announcedAt: z.string().max(32).nullable().optional(),
    sortOrder: z.number().int().optional(),
    published: z.boolean().optional(),
  })
  .strict();

const updateSchema = createSchema.partial();

export const adminAnnouncementsRouter = Router();

adminAnnouncementsRouter.get("/", async (_req, res, next) => {
  try {
    const items = await prisma.siteAnnouncement.findMany({
      orderBy: { sortOrder: "asc" },
    });
    res.json({ announcements: items });
  } catch (e) {
    next(e);
  }
});

adminAnnouncementsRouter.post("/", async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    const item = await prisma.siteAnnouncement.create({
      data: {
        title: data.title,
        body: data.body,
        linkLabel: data.linkLabel?.trim() ? data.linkLabel.trim() : null,
        linkUrl: linkUrlForCreate(data.linkUrl),
        announcedAt: parseAnnouncedAt(data.announcedAt ?? null),
        sortOrder: data.sortOrder ?? 0,
        published: data.published ?? true,
      },
    });
    res.status(201).json({ announcement: item });
  } catch (e) {
    next(e);
  }
});

adminAnnouncementsRouter.put("/:id", async (req, res, next) => {
  try {
    const id = paramAsString(req.params.id);
    if (!id) {
      res.status(400).json({ error: "无效 id" });
      return;
    }
    const data = updateSchema.parse(req.body);
    const item = await prisma.siteAnnouncement.update({
      where: { id },
      data: {
        title: data.title,
        body: data.body,
        linkLabel:
          data.linkLabel === undefined
            ? undefined
            : data.linkLabel != null && data.linkLabel.trim() !== ""
              ? data.linkLabel.trim()
              : null,
        linkUrl: linkUrlForPatch(data.linkUrl),
        announcedAt:
          data.announcedAt === undefined ? undefined : parseAnnouncedAt(data.announcedAt ?? null),
        sortOrder: data.sortOrder,
        published: data.published,
      },
    });
    res.json({ announcement: item });
  } catch (e) {
    next(e);
  }
});

adminAnnouncementsRouter.delete("/:id", async (req, res, next) => {
  try {
    const id = paramAsString(req.params.id);
    if (!id) {
      res.status(400).json({ error: "无效 id" });
      return;
    }
    await prisma.siteAnnouncement.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});
