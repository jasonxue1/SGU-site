import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { paramAsString } from "../../lib/params.js";

function parseEventDate(raw: string | null | undefined): Date | null {
  if (raw === undefined || raw === null || raw === "") return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

const createSchema = z
  .object({
    title: z.string().min(1).max(255),
    body: z.string().min(1).max(20000),
    eventDate: z.string().max(32).nullable().optional(),
    sortOrder: z.number().int().optional(),
    published: z.boolean().optional(),
  })
  .strict();

const updateSchema = createSchema.partial();

export const adminServerHistoryRouter = Router();

adminServerHistoryRouter.get("/", async (_req, res, next) => {
  try {
    const events = await prisma.serverHistoryEvent.findMany({
      orderBy: { sortOrder: "asc" },
    });
    res.json({ events });
  } catch (e) {
    next(e);
  }
});

adminServerHistoryRouter.post("/", async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    const event = await prisma.serverHistoryEvent.create({
      data: {
        title: data.title,
        body: data.body,
        eventDate: parseEventDate(data.eventDate ?? null),
        sortOrder: data.sortOrder ?? 0,
        published: data.published ?? true,
      },
    });
    res.status(201).json({ event });
  } catch (e) {
    next(e);
  }
});

adminServerHistoryRouter.put("/:id", async (req, res, next) => {
  try {
    const id = paramAsString(req.params.id);
    if (!id) {
      res.status(400).json({ error: "无效 id" });
      return;
    }
    const data = updateSchema.parse(req.body);
    const event = await prisma.serverHistoryEvent.update({
      where: { id },
      data: {
        title: data.title,
        body: data.body,
        eventDate:
          data.eventDate === undefined ? undefined : parseEventDate(data.eventDate ?? null),
        sortOrder: data.sortOrder,
        published: data.published,
      },
    });
    res.json({ event });
  } catch (e) {
    next(e);
  }
});

adminServerHistoryRouter.delete("/:id", async (req, res, next) => {
  try {
    const id = paramAsString(req.params.id);
    if (!id) {
      res.status(400).json({ error: "无效 id" });
      return;
    }
    await prisma.serverHistoryEvent.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});
