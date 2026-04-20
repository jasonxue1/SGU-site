/**
 * 与后端 `normalizePublicMediaUrl` 保持一致：裸文件名补成 `/uploads/public/...`，
 * 避免浏览器按当前路由解析到错误路径（站点根下的 404）。
 */
export function normalizePublicMediaUrl(input: string | null | undefined): string | null {
  if (input == null) return null;
  const s = input.trim().replace(/^\uFEFF/, "");
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("//")) return s;
  if (s.startsWith("/")) return s;
  if (s.startsWith("uploads/")) return `/${s}`;
  return `/uploads/public/${s}`;
}

/** 用于 <img src={…}>：无有效地址时返回 undefined */
export function publicImageSrc(input: string | null | undefined): string | undefined {
  return normalizePublicMediaUrl(input) ?? undefined;
}
