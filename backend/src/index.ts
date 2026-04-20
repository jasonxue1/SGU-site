import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { authRouter } from "./routes/auth.js";
import { publicRouter } from "./routes/public.js";
import { adminRouter } from "./routes/admin/index.js";
import { errorHandler } from "./middleware/error.js";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT ?? 4000);
const isProd = process.env.NODE_ENV === "production";

const rawOrigin = (process.env.FRONTEND_ORIGIN ?? "http://localhost:5173").trim();
if (!rawOrigin || rawOrigin.includes("*")) {
  throw new Error("FRONTEND_ORIGIN 必须配置为单一合法来源，不能使用通配符 *");
}
const frontendOrigin = rawOrigin;

/** 生产环境托管前端：默认 ../frontend/dist（相对 backend 进程 cwd），可通过 FRONTEND_DIST 覆盖 */
function resolveFrontendDistDir(): string | null {
  const raw = process.env.FRONTEND_DIST?.trim();
  const candidate = raw
    ? path.isAbsolute(raw)
      ? raw
      : path.resolve(process.cwd(), raw)
    : path.resolve(process.cwd(), "..", "frontend", "dist");
  if (!fs.existsSync(path.join(candidate, "index.html"))) {
    return null;
  }
  return candidate;
}

app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    ...(isProd
      ? { strictTransportSecurity: { maxAge: 15552000, includeSubDomains: true, preload: false } }
      : {}),
  }),
);
app.use(
  cors({
    origin: frontendOrigin,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json({ limit: "512kb" }));

const publicApiLimiter = rateLimit({
  windowMs: 60_000,
  limit: 120,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "请求过于频繁，请稍后再试" },
});

const adminApiLimiter = rateLimit({
  windowMs: 60_000,
  limit: 400,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "请求过于频繁，请稍后再试" },
});

const authApiLimiter = rateLimit({
  windowMs: 60_000,
  limit: 90,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "请求过于频繁，请稍后再试" },
  skip: (req) => req.method === "POST" && /\/api\/auth\/login\/?$/.test(req.originalUrl.split("?")[0] ?? ""),
});

const uploadsPath = path.join(process.cwd(), "uploads");
app.use(
  "/uploads",
  express.static(uploadsPath, {
    setHeaders(res) {
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Cache-Control", "public, max-age=86400");
    },
  }),
);

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    api: "sgu-server-backend",
    /** 便于对照：若管理后台保存仍报 heroBannerUrl，但此处为 false，说明请求没到本进程 */
    features: { siteConfigHeroBanner: true },
  });
});

app.use("/api/auth", authApiLimiter, authRouter);
app.use("/api/public", publicApiLimiter, publicRouter);
app.use("/api/admin", adminApiLimiter, adminRouter);

app.use("/api", (_req, res) => {
  res.status(404).json({ error: "接口不存在" });
});

const spaDist = isProd ? resolveFrontendDistDir() : null;
if (spaDist) {
  console.log(`[sgu-backend] 生产模式已启用：由本进程托管前端静态文件（${spaDist}）`);
  app.use(
    express.static(spaDist, {
      maxAge: 3600_000,
    }),
  );
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
      next();
      return;
    }
    if (req.method !== "GET" && req.method !== "HEAD") {
      next();
      return;
    }
    res.sendFile(path.join(spaDist, "index.html"), (err) => {
      if (err) next(err);
    });
  });
} else if (isProd) {
  console.warn(
    "[sgu-backend] NODE_ENV=production 但未找到前端构建目录（默认 ../frontend/dist）。请先执行 frontend npm run build，或设置 FRONTEND_DIST。",
  );
}

app.use((_req, res) => {
  res.status(404).type("text/plain").send("Not Found");
});

app.use(errorHandler);

const server = app.listen(port, () => {
  console.log(`API  listening on http://127.0.0.1:${port}`);
  console.log(`CORS 允许来源: ${frontendOrigin}`);
  console.log(
    `[sgu-backend] 进程 cwd=${process.cwd()} 入口目录=${__dirname}（若 heroBannerUrl 仍报 Unrecognized key，说明实际跑的不是本目录下刚编译的 dist）`,
  );
});
server.ref();
