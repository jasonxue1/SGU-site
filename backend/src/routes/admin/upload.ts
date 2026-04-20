import { Router, type NextFunction, type Request, type Response } from "express";
import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import crypto from "node:crypto";

const uploadDir = path.join(process.cwd(), "uploads", "public");
fs.mkdirSync(uploadDir, { recursive: true });

const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/heic",
  "image/heif",
]);

/** 不包含 svg：上传 SVG 在同源下直接打开可能执行脚本 */
const ALLOWED_EXT = new Set(["png", "jpg", "jpeg", "webp", "gif", "avif", "heic", "heif"]);

const MAX_BYTES = 5 * 1024 * 1024;

function acceptImage(_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const mime = (file.mimetype || "").toLowerCase().trim();
  const ext = path.extname(file.originalname || "").toLowerCase().replace(/^\./, "");

  const mimeOk = mime && ALLOWED_MIME.has(mime);
  const extOk = ALLOWED_EXT.has(ext);
  const octet = mime === "application/octet-stream" || mime === "";

  if (mimeOk || (extOk && octet)) {
    cb(null, true);
    return;
  }

  cb(
    new Error(
      `不支持的文件类型（${mime || "无 MIME"}）。请使用 png、jpeg、webp、gif 等常见图片格式。`,
    ),
  );
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").slice(0, 16) || "";
    const safeExt = /^\.[a-zA-Z0-9]+$/.test(ext) ? ext : "";
    const name = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${safeExt}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_BYTES },
  fileFilter: acceptImage,
});

export const adminUploadRouter = Router();

function postPublicImage(req: Request, res: Response, next: NextFunction) {
  upload.single("file")(req, res, (err: unknown) => {
    if (err) {
      next(err);
      return;
    }
    if (!req.file) {
      res.status(400).json({
        error: "未收到文件。请选择图片文件；若仍失败，请换用 Chrome/Edge 或检查是否已登录后台。",
      });
      return;
    }
    const publicPath = `/uploads/public/${req.file.filename}`;
    res.json({ url: publicPath });
  });
}

adminUploadRouter.post("/logo", postPublicImage);
adminUploadRouter.post("/banner", postPublicImage);
