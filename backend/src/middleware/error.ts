import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

function multerCode(err: unknown): string | undefined {
  if (err && typeof err === "object" && "code" in err) {
    const c = (err as { code: unknown }).code;
    return typeof c === "string" ? c : undefined;
  }
  return undefined;
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    const prod = process.env.NODE_ENV === "production";
    const first = err.issues[0];
    const at = first?.path?.length ? String(first.path.join(".")) : "";
    const hint = first?.message ? (at ? `${at}: ${first.message}` : first.message) : "";
    res.status(400).json({
      error: hint ? `参数校验失败：${hint}` : "参数校验失败",
      ...(prod ? {} : { details: err.flatten() }),
    });
    return;
  }

  const code = multerCode(err);
  if (code === "LIMIT_FILE_SIZE") {
    res.status(400).json({ error: "文件过大，超过当前上传接口允许的大小，请换一张更小的图片。" });
    return;
  }
  if (code === "LIMIT_UNEXPECTED_FILE") {
    res.status(400).json({ error: "上传字段名错误，请使用 file。" });
    return;
  }

  if (err instanceof Error) {
    const msg = err.message;
    if (
      msg.includes("不支持的文件类型") ||
      msg.includes("仅支持") ||
      msg.includes("Unexpected field") ||
      msg.includes("Multer")
    ) {
      res.status(400).json({ error: msg });
      return;
    }
  }

  console.error(err);
  res.status(500).json({ error: "服务器内部错误" });
}
