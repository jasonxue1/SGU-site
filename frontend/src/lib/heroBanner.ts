import { publicImageSrc } from "./mediaUrl";
import type { SiteConfig } from "../types";

/** 后台可能把 heroBannerUrls 存成 JSON 字符串或非数组 */
function coerceUrlList(raw: unknown): string[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return raw.filter((x): x is string => typeof x === "string" && x.trim() !== "");
  }
  if (typeof raw === "string") {
    const t = raw.trim();
    if (!t) return [];
    if (t.startsWith("[")) {
      try {
        const p = JSON.parse(t) as unknown;
        if (Array.isArray(p)) return p.filter((x): x is string => typeof x === "string" && x.trim() !== "");
      } catch {
        /* 按分隔符拆 */
      }
    }
    return t.split(/[,，|]/).map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

/** 首张字段内多图：换行 或 | 分隔（避免用逗号以免与 URL 冲突） */
function splitFirstBannerField(s: string): string[] {
  const t = s.trim();
  if (!t) return [];
  if (/\n/.test(t)) return t.split(/\n+/).map((x) => x.trim()).filter(Boolean);
  if (/\|/.test(t)) return t.split(/\s*\|\s*/).map((x) => x.trim()).filter(Boolean);
  return [t];
}

/** 首张 heroBannerUrl + heroBannerUrls 合并去重；首页仅使用第一张 */
export function collectHeroBannerSlides(config: SiteConfig): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (raw: string) => {
    const s = publicImageSrc(raw);
    if (s && !seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
  };

  if (typeof config.heroBannerUrl === "string") {
    for (const part of splitFirstBannerField(config.heroBannerUrl)) push(part);
  }

  const rawList = (config as Record<string, unknown>)["heroBannerUrls"];
  for (const u of coerceUrlList(rawList)) push(u);

  return out;
}
