import { z } from "zod";
import { normalizePublicMediaUrl } from "./mediaUrl.js";
import { isHttpOrHttpsUrl, isSafePublicAssetUrl } from "./safeUrl.js";

function toOptionalTrimmedString(v: unknown): string | undefined {
  if (v === null || v === undefined) return undefined;
  if (typeof v === "string") return v;
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  return undefined;
}

/** 空串 / null / 未填视为无链接；有值则必须为 http(s) */
export const zNullishHttpUrl = z.preprocess(
  toOptionalTrimmedString,
  z
    .string()
    .max(2048)
    .optional()
    .refine((s) => s === undefined || s.trim() === "" || isHttpOrHttpsUrl(s), {
      message: "链接必须以 http:// 或 https:// 开头",
    }),
);

/** 必填 http(s) */
export const zRequiredHttpUrl = z
  .string()
  .min(1)
  .max(2048)
  .refine((s) => isHttpOrHttpsUrl(s), {
    message: "链接必须以 http:// 或 https:// 开头",
  });

/** Logo/卡片图/头像：外链或 /uploads/...；裸文件名会先由业务侧 normalize 再校验 */
export function zAssetUrlField() {
  return z
    .string()
    .max(2048)
    .nullable()
    .optional()
    .refine(
      (s) => {
        if (s == null) return true;
        if (s.trim() === "") return true;
        const normalized = normalizePublicMediaUrl(s) ?? s;
        return isSafePublicAssetUrl(normalized);
      },
      { message: "图片地址无效：请使用 http(s) 外链或 /uploads/ 下的路径" },
    );
}

/** 站点配置里的 logoUrl */
export const zNullishLogoUrl = z.preprocess(
  toOptionalTrimmedString,
  z
    .string()
    .max(2048)
    .optional()
    .refine(
      (s) => {
        if (s === undefined || s.trim() === "") return true;
        const normalized = normalizePublicMediaUrl(s) ?? s;
        return isSafePublicAssetUrl(normalized);
      },
      { message: "Logo 地址无效：请使用 http(s) 外链或 /uploads/ 下的路径" },
    ),
);

/** 首页 Banner 附加图列表（0～12 张；前台仅展示首张，可与 heroBannerUrl 合并入库） */
export const zHeroBannerUrls = z.preprocess((v) => {
  if (v === null || v === undefined) return undefined;
  if (!Array.isArray(v)) return undefined;
  const out: string[] = [];
  for (const item of v) {
    if (typeof item !== "string") continue;
    const t = item.trim();
    if (t) out.push(t);
  }
  return out;
}, z.array(z.string().max(2048)).max(12).optional()).refine(
  (arr) => !arr || arr.every((s) => isSafePublicAssetUrl(normalizePublicMediaUrl(s) ?? s)),
  { message: "Banner 附加图地址须为 http(s) 外链或 /uploads/ 下路径" },
);

const hexColor = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

/** 主题色：空 / null / 未传 视为清除；有值须为合法 #RGB/#RRGGBB/#RRGGBBAA */
export const zOptionalHexColor = z.preprocess((val) => {
  if (val === null || val === undefined) return undefined;
  if (typeof val === "number" && Number.isFinite(val)) return String(Math.trunc(val));
  if (typeof val === "boolean") return undefined;
  if (typeof val !== "string") return undefined;
  const t = val.trim();
  return t === "" ? undefined : t;
}, z.string().max(32).optional().refine((s) => s === undefined || hexColor.test(s), { message: "颜色须为 # 开头的十六进制值（如 #2a8f62）" }));
