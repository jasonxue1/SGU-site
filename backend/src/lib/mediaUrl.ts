/**
 * 将站内相对图片路径规范为以 `/` 开头的绝对路径，避免浏览器按当前页面路径解析
 *（例如仅保存文件名时会请求到站点根路径而 404）。
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

/** 用于列表/详情输出：在库内为裸文件名时补全为可请求的绝对路径 */
export function normalizedMediaOrOriginal(value: string | null): string | null {
  return normalizePublicMediaUrl(value) ?? value;
}
