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

/** 接口清单：用于反代排查（若 404 无此结构，说明请求未到本 Node 进程） */
app.get("/api", (_req, res) => {
  res.type("json").json({
    name: "sgu-server.xin API",
    health: { method: "GET", path: "/api/health" },
    public: { method: "GET", path: "/api/public/site", note: "全站首包" },
    auth: { prefix: "/api/auth", paths: "login, me, logout…" },
    admin: { prefix: "/api/admin", note: "需管理员 Cookie" },
  });
});

app.use("/api/auth", authApiLimiter, authRouter);
app.use("/api/public", publicApiLimiter, publicRouter);
app.use("/api/admin", adminApiLimiter, adminRouter);

app.use("/api", (req, res) => {
  res.status(404).json({
    error: "接口不存在",
    method: req.method,
    path: req.path,
    originalUrl: req.originalUrl,
    hint: "Nginx 反代到 Node 时须保留完整路径（例如 /api/public/site，勿误删 /api 前缀）。可先访问 GET /api 或 /api/health 自检。",
  });
});

const spaDist = isProd ? resolveFrontendDistDir() : null;
if (spaDist) {
  console.log(`[sgu-backend] 生产模式已启用：由本进程托管前端静态文件（${spaDist}）`);
  app.use(
    express.static(spaDist, {
      maxAge: 3600_000,
    }),
  );
  /** Express 5 / path-to-regexp 8 不再支持 app.get('*')，用中间件做 SPA 回退 */
  app.use((req, res, next) => {
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

/** 生产环境默认绑定 0.0.0.0，便于宝塔 / Docker 等环境反代访问；可用 LISTEN_HOST 覆盖（如 127.0.0.1） */
const listenHost =
  process.env.LISTEN_HOST?.trim() ||
  (isProd ? "0.0.0.0" : undefined);

const onListen = () => {
  const bindHint =
    listenHost === "0.0.0.0"
      ? "0.0.0.0（外网请仍走 Nginx/防火墙，勿直接暴露 Node 端口）"
      : listenHost ?? "默认（本机所有网卡）";
  console.log(`API  listening on port ${port}，绑定：${bindHint}`);
  console.log(`CORS 允许来源: ${frontendOrigin}`);
  console.log(
    `[sgu-backend] 进程 cwd=${process.cwd()} 入口目录=${__dirname}（若 heroBannerUrl 仍报 Unrecognized key，说明实际跑的不是本目录下刚编译的 dist）`,
  );
};

const server = listenHost
  ? app.listen(port, listenHost, onListen)
  : app.listen(port, onListen);
server.ref();
