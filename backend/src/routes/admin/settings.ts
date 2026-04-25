import { Router } from "express";
import { z } from "zod";
import { normalizePublicMediaUrl } from "../../lib/mediaUrl.js";
import { prisma } from "../../lib/prisma.js";
import { zHeroBannerUrls, zNullishHttpUrl, zNullishLogoUrl, zOptionalHexColor } from "../../lib/zodUrl.js";

const THEME_PRESET_IDS = ["default", "ocean", "forest", "lavender", "slate", "custom"] as const;

function optThemePreset() {
  return z.preprocess((v) => {
    if (v === null || v === undefined) return undefined;
    if (typeof v !== "string") return undefined;
    const t = v.trim();
    return (THEME_PRESET_IDS as readonly string[]).includes(t) ? t : undefined;
  }, z.enum(THEME_PRESET_IDS).optional());
}

/** null / 非字符串 规整为 undefined，数字等转为字符串，避免 JSON 类型不一致导致校验失败 */
function optStr(max: number) {
  return z.preprocess((v) => {
    if (v === null || v === undefined) return undefined;
    if (typeof v === "string") return v;
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
    if (typeof v === "boolean") return v ? "true" : "false";
    return undefined;
  }, z.string().max(max).optional());
}

/** 站点名称：空串视为不修改该项；有值则至少 1 字符 */
const siteNameSchema = z.preprocess((v) => {
  if (v === null || v === undefined) return undefined;
  if (typeof v === "number" && Number.isFinite(v)) return String(v).trim();
  if (typeof v === "boolean") return undefined;
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t === "" ? undefined : t;
}, z.string().min(1).max(128).optional());

/** 单一来源定义字段，避免前后端新增键后服务端未同步仍报 Unrecognized key */
const siteConfigShape = {
  siteName: siteNameSchema,
  tagline: optStr(256),
  logoUrl: zNullishLogoUrl,
  heroTitle: optStr(512),
  heroSubtitle: optStr(2000),
  heroBannerUrl: zNullishLogoUrl,
  heroBannerUrls: zHeroBannerUrls,
  serverAddress: optStr(256),
  serverVersion: optStr(64),
  discordUrl: zNullishHttpUrl,
  qqGroup: optStr(64),
  bilibiliUrl: zNullishHttpUrl,
  footerNote: optStr(2000),
  seoDescription: optStr(512),
  icpLicense: optStr(128),
  joinPageTitle: optStr(255),
  joinPageBody: optStr(20000),
  groupRulesTitle: optStr(255),
  groupRulesMarkdown: optStr(100000),
  colorPreset: optThemePreset(),
  customPalette: z
    .object({
      p1: zOptionalHexColor,
      p2: zOptionalHexColor,
      p3: zOptionalHexColor,
      p4: zOptionalHexColor,
    })
    .optional(),
} satisfies z.ZodRawShape;

const siteConfigKeys = Object.keys(siteConfigShape) as (keyof typeof siteConfigShape)[];

/** passthrough：请求体里多出的键不触发 Zod 报错；写入前再按白名单收窄 */
const siteConfigSchema = z.object(siteConfigShape).passthrough();

function pickSiteConfigPatch(parsed: z.infer<typeof siteConfigSchema>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const rec = parsed as Record<string, unknown>;
  for (const key of siteConfigKeys) {
    if (!Object.prototype.hasOwnProperty.call(rec, key)) continue;
    const v = rec[key as string];
    if (v === undefined) continue;
    out[key as string] = v;
  }
  return out;
}

export const adminSettingsRouter = Router();

adminSettingsRouter.get("/", async (_req, res, next) => {
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
      if (n) config.logoUrl = n;
      else delete config.logoUrl;
    }
    if (typeof config.heroBannerUrl === "string") {
      const n = normalizePublicMediaUrl(config.heroBannerUrl);
      if (n) config.heroBannerUrl = n;
      else delete config.heroBannerUrl;
    }
    if (Array.isArray(config.heroBannerUrls)) {
      const next: string[] = [];
      for (const u of config.heroBannerUrls) {
        if (typeof u !== "string") continue;
        const n = normalizePublicMediaUrl(u.trim());
        if (n) next.push(n);
      }
      config.heroBannerUrls = next;
    }
    res.json({ config });
  } catch (e) {
    next(e);
  }
});

adminSettingsRouter.put("/", async (req, res, next) => {
  try {
    const raw = req.body;
    const body =
      raw !== null && typeof raw === "object" && !Array.isArray(raw)
        ? (raw as Record<string, unknown>)
        : {};
    const parsed = siteConfigSchema.parse(body);
    let patch = pickSiteConfigPatch(parsed);
    if (patch.logoUrl !== undefined && patch.logoUrl !== null && String(patch.logoUrl).trim() !== "") {
      patch = {
        ...patch,
        logoUrl: normalizePublicMediaUrl(String(patch.logoUrl)) ?? String(patch.logoUrl),
      };
    } else if (patch.logoUrl !== undefined) {
      patch = { ...patch, logoUrl: "" };
    }
    if (patch.heroBannerUrl !== undefined && patch.heroBannerUrl !== null && String(patch.heroBannerUrl).trim() !== "") {
      patch = {
        ...patch,
        heroBannerUrl: normalizePublicMediaUrl(String(patch.heroBannerUrl)) ?? String(patch.heroBannerUrl),
      };
    } else if (patch.heroBannerUrl !== undefined) {
      patch = { ...patch, heroBannerUrl: "" };
    }
    if (patch.heroBannerUrls !== undefined && Array.isArray(patch.heroBannerUrls)) {
      const raw = patch.heroBannerUrls as string[];
      patch = {
        ...patch,
        heroBannerUrls: raw
          .map((s) => (typeof s === "string" ? normalizePublicMediaUrl(s.trim()) ?? s.trim() : ""))
          .filter((s) => s.length > 0),
      };
    }
    const row = await prisma.siteSetting.findUnique({
      where: { key: "site_config" },
    });
    let current: Record<string, unknown> = {};
    if (row?.value) {
      try {
        current = JSON.parse(row.value) as Record<string, unknown>;
      } catch {
        current = {};
      }
    }
    if (patch.customPalette !== undefined && patch.customPalette !== null && typeof patch.customPalette === "object") {
      const curRaw = current.customPalette;
      const cur =
        curRaw && typeof curRaw === "object" && !Array.isArray(curRaw)
          ? (curRaw as Record<string, unknown>)
          : {};
      patch = {
        ...patch,
        customPalette: { ...cur, ...(patch.customPalette as Record<string, unknown>) },
      };
    }
    const nextConfig = { ...current, ...patch };
    await prisma.siteSetting.upsert({
      where: { key: "site_config" },
      create: { key: "site_config", value: JSON.stringify(nextConfig) },
      update: { value: JSON.stringify(nextConfig) },
    });
    res.json({ config: nextConfig });
  } catch (e) {
    next(e);
  }
});
