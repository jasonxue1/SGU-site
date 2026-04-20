import { Router } from "express";
import { normalizePublicMediaUrl, normalizedMediaOrOriginal } from "../lib/mediaUrl.js";
import { isHttpOrHttpsUrl, isSafePublicAssetUrl } from "../lib/safeUrl.js";
import { prisma } from "../lib/prisma.js";

export const publicRouter = Router();

publicRouter.get("/site", async (_req, res, next) => {
  try {
    const row = await prisma.siteSetting.findUnique({
      where: { key: "site_config" },
    });
    let config: Record<string, unknown> = {};
    if (row?.value) {
      try {
        config = JSON.parse(row.value) as Record<string, unknown>;
      } catch {
        config = {};
      }
    }
    if (typeof config.logoUrl === "string") {
      const n = normalizePublicMediaUrl(config.logoUrl);
      if (n && isSafePublicAssetUrl(n)) config.logoUrl = n;
      else delete config.logoUrl;
    }
    if (typeof config.discordUrl === "string" && !isHttpOrHttpsUrl(config.discordUrl)) {
      delete config.discordUrl;
    }
    if (typeof config.bilibiliUrl === "string" && !isHttpOrHttpsUrl(config.bilibiliUrl)) {
      delete config.bilibiliUrl;
    }
    /** 解析轮播图列表：支持数组、JSON 字符串、逗号分隔；逐项 normalize + 安全校验 */
    function collectSafeBannerUrls(raw: unknown): string[] {
      if (raw == null) return [];
      if (Array.isArray(raw)) {
        const next: string[] = [];
        for (const u of raw) {
          if (typeof u !== "string") continue;
          const n = normalizePublicMediaUrl(u.trim());
          if (n && isSafePublicAssetUrl(n)) next.push(n);
        }
        return next;
      }
      if (typeof raw === "string") {
        const t = raw.trim();
        if (!t) return [];
        if (t.startsWith("[")) {
          try {
            const p = JSON.parse(t) as unknown;
            return collectSafeBannerUrls(p);
          } catch {
            /* 按分隔符拆 */
          }
        }
        const next: string[] = [];
        for (const part of t.split(/[,，|]/).map((s) => s.trim()).filter(Boolean)) {
          const n = normalizePublicMediaUrl(part);
          if (n && isSafePublicAssetUrl(n)) next.push(n);
        }
        return next;
      }
      return [];
    }

    function safeBannerPartsFromFirstField(t: string): string[] {
      const parts: string[] = [];
      const pushPart = (p: string) => {
        const n = normalizePublicMediaUrl(p.trim());
        if (n && isSafePublicAssetUrl(n)) parts.push(n);
      };
      if (/\n/.test(t)) {
        for (const part of t.split(/\n+/).map((s) => s.trim()).filter(Boolean)) pushPart(part);
      } else if (/\|/.test(t)) {
        for (const part of t.split(/\s*\|\s*/).map((s) => s.trim()).filter(Boolean)) pushPart(part);
      } else {
        pushPart(t);
      }
      return parts;
    }

    const fromExtras = collectSafeBannerUrls(config.heroBannerUrls);
    let fromFirst: string[] = [];
    if (typeof config.heroBannerUrl === "string") {
      fromFirst = safeBannerPartsFromFirstField(config.heroBannerUrl.trim());
    }
    const merged: string[] = [];
    const seen = new Set<string>();
    for (const u of [...fromFirst, ...fromExtras]) {
      if (!seen.has(u)) {
        seen.add(u);
        merged.push(u);
      }
    }
    if (merged.length === 0) {
      delete config.heroBannerUrl;
      delete config.heroBannerUrls;
    } else {
      config.heroBannerUrl = merged[0];
      if (merged.length > 1) config.heroBannerUrls = merged.slice(1);
      else delete config.heroBannerUrls;
    }
    const [cards, serverHistory, members, openSourceProjects] = await Promise.all([
      prisma.contentCard.findMany({
        where: { published: true },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          title: true,
          subtitle: true,
          body: true,
          imageUrl: true,
          linkLabel: true,
          linkUrl: true,
          badge: true,
          sortOrder: true,
        },
      }),
      prisma.serverHistoryEvent.findMany({
        where: { published: true },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          title: true,
          body: true,
          eventDate: true,
          sortOrder: true,
        },
      }),
      prisma.teamMember.findMany({
        where: { published: true },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          name: true,
          role: true,
          bio: true,
          avatarUrl: true,
          linkLabel: true,
          linkUrl: true,
          sortOrder: true,
        },
      }),
      prisma.openSourceProject.findMany({
        where: { published: true },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          name: true,
          description: true,
          url: true,
          logoUrl: true,
          sortOrder: true,
        },
      }),
    ]);
    const cardsOut = cards.map((c) => ({
      ...c,
      imageUrl: normalizedMediaOrOriginal(c.imageUrl),
      linkUrl: c.linkUrl != null && isHttpOrHttpsUrl(c.linkUrl) ? c.linkUrl : null,
    }));
    const membersOut = members.map((m) => ({
      ...m,
      avatarUrl: normalizedMediaOrOriginal(m.avatarUrl),
      linkUrl: m.linkUrl != null && isHttpOrHttpsUrl(m.linkUrl) ? m.linkUrl : null,
    }));
    const openSourceOut = openSourceProjects.map((p) => ({
      ...p,
      logoUrl: normalizedMediaOrOriginal(p.logoUrl),
      url: isHttpOrHttpsUrl(p.url) ? p.url : "",
    }));
    res.json({ config, cards: cardsOut, serverHistory, members: membersOut, openSourceProjects: openSourceOut });
  } catch (e) {
    next(e);
  }
});
