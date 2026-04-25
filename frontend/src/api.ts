type ApiErrorBody = {
  error?: string;
  details?: {
    formErrors?: string[];
    fieldErrors?: Record<string, string[]>;
  };
};

/** 把接口返回的 error + Zod details 拼成可读多行文案 */
export function formatApiErrorMessage(data: unknown, fallbackStatus: number): string {
  const d = data as ApiErrorBody | null;
  const base = (d && typeof d.error === "string" && d.error.trim() !== "" ? d.error : null) ?? `请求失败 (HTTP ${fallbackStatus})`;
  const det = d?.details;
  if (!det || typeof det !== "object") return base;

  const parts: string[] = [base];
  const fe = det.formErrors;
  if (Array.isArray(fe)) {
    for (const m of fe) {
      if (typeof m === "string" && m.trim()) parts.push(m.trim());
    }
  }
  const fieldErrors = det.fieldErrors;
  if (fieldErrors && typeof fieldErrors === "object") {
    for (const [key, msgs] of Object.entries(fieldErrors)) {
      if (!Array.isArray(msgs) || msgs.length === 0) continue;
      const line = msgs.filter((x): x is string => typeof x === "string" && x.trim() !== "").join("；");
      if (line) parts.push(`${key}: ${line}`);
    }
  }
  return parts.join("\n");
}

export async function apiJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      if (!res.ok) {
        throw new Error(text.length > 200 ? `${text.slice(0, 200)}…` : text);
      }
      throw new Error("服务器返回了非 JSON 数据，请确认 API 地址与代理配置是否正确。");
    }
  }
  if (!res.ok) {
    throw new Error(formatApiErrorMessage(data, res.status));
  }
  return data as T;
}

export async function apiUpload(path: string, file: File): Promise<{ url: string }> {
  const body = new FormData();
  body.append("file", file);
  const res = await fetch(path, {
    method: "POST",
    credentials: "include",
    body,
  });
  const text = await res.text();
  let data: { error?: string; url?: string } = {};
  if (text) {
    try {
      data = JSON.parse(text) as { error?: string; url?: string };
    } catch {
      data = { error: text.length > 240 ? `${text.slice(0, 240)}…` : text };
    }
  }
  if (!res.ok) {
    throw new Error(formatApiErrorMessage(data, res.status));
  }
  if (!data.url) throw new Error(data.error ?? "上传响应无效");
  return { url: data.url };
}
