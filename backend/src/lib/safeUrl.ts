/**
 * 防止外链字段出现 javascript:/data: 等协议，避免访客点击时 XSS。
 */
export function isHttpOrHttpsUrl(s: string): boolean {
  const t = s.trim();
  if (!t) return false;
  let u: URL;
  try {
    u = new URL(t);
  } catch {
    return false;
  }
  return u.protocol === "http:" || u.protocol === "https:";
}

/** 站点资源地址：仅 https? 或站内 /uploads/ 下安全路径（无 ..、无冒号等） */
export function isSafePublicAssetUrl(s: string): boolean {
  const t = s.trim();
  if (!t) return false;
  if (isHttpOrHttpsUrl(t)) return true;
  if (!t.startsWith("/") || t.startsWith("//")) return false;
  if (!t.startsWith("/uploads/")) return false;
  if (t.includes("..") || t.includes("\\")) return false;
  return /^\/uploads\/[a-zA-Z0-9/._-]+$/.test(t);
}

/** 写入数据库的可空外链：空串视为 null */
export function linkUrlForCreate(v: string | null | undefined): string | null {
  if (v == null) return null;
  const t = v.trim();
  return t === "" ? null : t;
}

/** PATCH：undefined 表示不修改；null/空串 表示清空 */
export function linkUrlForPatch(v: string | null | undefined): string | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  const t = v.trim();
  return t === "" ? null : t;
}
