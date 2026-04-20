/** 仅允许 http(s)，防止 javascript: 等协议在 <a href> 中执行 */
export function isSafeHttpUrl(s: string | null | undefined): boolean {
  if (s == null || s.trim() === "") return false;
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
