import { Router, type NextFunction, type Request, type Response } from "express";
import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import crypto from "node:crypto";
import sharp from "sharp";

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
/** 服务器历史配图：允许更大原图，与 logo/banner 等 5MB 区分 */
const MAX_BYTES_SERVER_HISTORY = 10 * 1024 * 1024;

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

const uploadServerHistory = multer({
  storage,
  limits: { fileSize: MAX_BYTES_SERVER_HISTORY },
  fileFilter: acceptImage,
});

const memoryStorage = multer.memoryStorage();
const uploadMemory = multer({
  storage: memoryStorage,
  limits: { fileSize: MAX_BYTES },
  fileFilter: acceptImage,
});

/**
 * 公告正文配图：非动图一律等比压到长边 ≤ 此值，并转 WebP；多帧 GIF 不处理以保留动画。
 */
const ANNOUNCEMENT_MAX_EDGE = 900;
const ANNOUNCEMENT_WEBP_QUALITY = 78;

function extFromOriginalOrFormat(original: string, format: string | undefined): string {
  const fromN = path.extname(original || "").toLowerCase();
  if (fromN.length >= 2 && fromN.length <= 8 && /^\.[a-z0-9]+$/.test(fromN)) return fromN;
  switch (format) {
    case "jpeg":
    case "jpg":
      return ".jpg";
    case "png":
      return ".png";
    case "webp":
      return ".webp";
    case "gif":
      return ".gif";
    case "avif":
      return ".avif";
    case "heif":
      return ".heic";
    case "tiff":
      return ".tif";
    default:
      return ".img";
  }
}

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

/** 服务器历史配图（10MB），由 adminServerHistoryRouter 挂到 POST /api/admin/server-history/upload */
export function postServerHistoryImage(req: Request, res: Response, next: NextFunction) {
  uploadServerHistory.single("file")(req, res, (err: unknown) => {
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

function postAnnouncementImage(req: Request, res: Response, next: NextFunction) {
  uploadMemory.single("file")(req, res, (err: unknown) => {
    if (err) {
      next(err);
      return;
    }
    const f = req.file;
    if (!f?.buffer) {
      res.status(400).json({
        error: "未收到文件。请选择图片文件；若仍失败，请换用 Chrome/Edge 或检查是否已登录后台。",
      });
      return;
    }
    const input = f.buffer;
    const originalName = f.originalname;
    void (async () => {
      try {
        const meta = await sharp(input, { failOn: "none" }).metadata();
        const format = meta.format;
        const gifFrames = format === "gif" ? (meta.pages ?? 1) : 1;
        const isAnimatedGif = format === "gif" && gifFrames > 1;

        let out: Buffer;
        let ext: string;
        if (isAnimatedGif) {
          out = input;
          ext = extFromOriginalOrFormat(originalName, format);
        } else {
          out = await sharp(input, { failOn: "none" })
            .rotate()
            .resize(ANNOUNCEMENT_MAX_EDGE, ANNOUNCEMENT_MAX_EDGE, {
              fit: "inside",
              withoutEnlargement: true,
            })
            .webp({ quality: ANNOUNCEMENT_WEBP_QUALITY, effort: 4 })
            .toBuffer();
          ext = ".webp";
        }
        const name = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
        const dest = path.join(uploadDir, name);
        await fs.promises.writeFile(dest, out);
        res.json({ url: `/uploads/public/${name}` });
      } catch (e) {
        next(e instanceof Error ? e : new Error("图片处理失败，请换一张或缩小尺寸后重试。"));
      }
    })();
  });
}

adminUploadRouter.post("/announcement", postAnnouncementImage);
