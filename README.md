# 项目代码说明（全览）

面向需要阅读、修改或通过 **SSH 部署**本项目的开发者。仓库为**前后端分目录**的单体应用：访客站 + 管理后台 + REST API + MySQL。

---

## 一、仓库目录结构

```text
sgu-server.xin/
├── backend/                 # Node.js + Express + Prisma（API、上传、生产环境可托管前端静态文件）
│   ├── prisma/
│   │   ├── schema.prisma  # 数据模型
│   │   └── seed.ts        # 首次初始化示例数据与管理员
│   ├── src/
│   │   ├── index.ts       # HTTP 入口：中间件、路由挂载、静态资源与 SPA 回退
│   │   ├── routes/        # 按业务拆分的路由
│   │   ├── middleware/    # 鉴权、统一错误处理
│   │   └── lib/           # JWT、URL 校验、Prisma 客户端等
│   ├── uploads/           # 运行时上传文件（如 public 图，勿删生产数据）
│   ├── .env.example       # 环境变量模板
│   └── package.json
├── frontend/                # React + Vite + React Router
│   ├── public/              # 构建时原样拷贝的静态资源
│   ├── src/
│   │   ├── main.tsx / App.tsx
│   │   ├── pages/           # 访客页 + admin 子目录
│   │   ├── layout/          # 外壳、主题、动效
│   │   ├── context/         # 站点公开配置 Context
│   │   ├── lib/             # 媒体 URL、Banner 解析等
│   │   └── api.ts           # fetch 封装（相对路径 /api）
│   ├── vite.config.ts       # 开发代理 /api、/uploads → 后端
│   └── package.json
├── deploy/                  # SSH 部署脚本与 systemd / Nginx 示例
├── docs/
│   └── DEPLOYMENT.md        # 本地 Windows 开发跑通指南
└── 代码说明.md              # 本文件
```

---

## 二、技术栈一览

| 层级 | 技术 |
|------|------|
| 前端 | React 19、react-router-dom 7、Vite 6、TypeScript |
| 后端 | Express 5、TypeScript（编译为 `dist/`）、dotenv |
| 数据库 | MySQL 8 + Prisma ORM |
| 安全 | Helmet、CORS（单一 `FRONTEND_ORIGIN`）、bcrypt 密码、JWT（HttpOnly Cookie）、express-rate-limit、Zod 校验 |
| 上传 | multer，图片存 `backend/uploads`，公开 URL 前缀 `/uploads/...` |

---

## 三、后端代码说明

### 1. 入口 `backend/src/index.ts`

- 读取 `PORT`（默认 `4000`）、`NODE_ENV`、`FRONTEND_ORIGIN`（必填且不可为 `*`）。
- 启用 `trust proxy`（便于反代后获取真实协议/IP）。
- 中间件：`helmet`、`cors`（带 Cookie）、`cookie-parser`、JSON body（上限约 512KB）。
- **速率限制**：公开 API、管理 API、登录相关路由分别挂载不同 `rateLimit`。
- **静态目录 `/uploads`**：映射到进程工作目录下的 `uploads` 文件夹（生产环境请保证 `WorkingDirectory` 为 `backend` 且目录可写）。
- **路由**：`/api/health`、`/api/auth`、`/api/public`、`/api/admin`。
- **未匹配的 `/api/*`**：返回 JSON `404`（`接口不存在`）。
- **生产环境 + 前端已构建**：若存在 `index.html`（默认路径为相对 `cwd` 的 `../frontend/dist`，或通过环境变量 `FRONTEND_DIST` 指定），则由 Express **托管前端静态资源**，并对非 `/api`、`非 /uploads` 的 GET/HEAD 请求回退到 **`index.html`**（单页应用）。
- 最后：纯文本 `404` 兜底、`errorHandler`。

这样 SSH 部署时可只维护 **一个 Node 进程** + 可选 **Nginx 反代 443 → 4000**，无需 Nginx 单独配置 `root` 指向前端 `dist`（仍可按旧方式拆静态，见下文）。

### 2. 路由 `backend/src/routes/`

| 路径 | 文件 | 作用 |
|------|------|------|
| `/api/auth` | `auth.ts` | 登录（限流）、登出、`/me`（需登录） |
| `/api/public` | `public.ts` | 访客站数据：站点配置、卡片、历程、成员、开源项目等（仅已发布） |
| `/api/admin/*` | `admin/index.ts` 及子文件 | 均需 `requireAdmin`；settings、cards、users、upload、server-history、members、open-source |

管理端上传：`admin/upload.ts`，与前台使用的 Logo/Banner 等同源校验逻辑在 `lib/safeUrl.ts`、`lib/mediaUrl.ts` 等。

### 3. 中间件

- `middleware/auth.ts`：从 Cookie 读 JWT，校验后注入 `req.admin`。
- `middleware/error.ts`：统一处理 Zod 校验错误、multer 文件限制等，生产环境隐藏多余堆栈。

### 4. 库 `backend/src/lib/`

- `auth.ts`：签发/校验 JWT，设置/清除 HttpOnly Cookie（生产 `Secure`）。
- `prisma.ts`：单例 `PrismaClient`。
- `mediaUrl.ts` / `safeUrl.ts` / `zodUrl.ts`：媒体地址规范化与上传/配置中的 URL 白名单校验。

### 5. 数据库 `backend/prisma/schema.prisma`

| 模型 | 用途 |
|------|------|
| `AdminUser` | 后台管理员账号 |
| `SiteSetting` | `site_config` 等键值 JSON（站点标题、Banner、页脚等） |
| `ContentCard` | 首页等内容卡片 |
| `ServerHistoryEvent` | 服务器历程时间线 |
| `TeamMember` | 成员展示 |
| `OpenSourceProject` | 开源项目列表 |

表结构变更后需执行 `npx prisma db push`（或迁移流程），详见 Prisma 文档。

---

## 四、前端代码说明

### 1. 入口与路由 `frontend/src/main.tsx`、`App.tsx`

- `BrowserRouter` + `Routes`：访客路由嵌套在 `PublicShell` 下；`/admin` 为后台布局；`/admin/login` 独立登录页。
- 路由与页面：`/` 首页、`join`、`members`、`open-source`、`history`；后台 `site`、`cards`、`server-history`、`members`、`open-source`、`users`。

### 2. 数据与请求

- `context/PublicSiteContext.tsx`：拉取 `GET /api/public/site`（或等价数据），供外壳与首页使用。
- `api.ts`：`fetch` 封装，**相对路径** `/api/...`，`credentials: "include"` 以携带 Cookie。
- 开发时由 `vite.config.ts` 将 `/api`、`/uploads` **代理**到 `http://127.0.0.1:4000`。
- 生产环境若由 Node 托管静态文件，浏览器与 API **同源**，无需改前端环境变量。

### 3. 页面与组件（要点）

- `pages/HomePage.tsx`：首屏 Banner、站点文案、卡片网格、外链区块等。
- `pages/admin/AdminSiteSettings.tsx`：站点配置表单，含防抖自动保存等。
- `layout/PublicShell.tsx`：顶栏、主题、Outlet、页脚等。
- `lib/heroBanner.ts`：从站点配置中解析首张 Banner 图 URL。
- `lib/mediaUrl.ts`：把配置里的相对路径转成浏览器可请求的 `publicImageSrc`。

### 4. 构建产物

- `npm run build` 输出到 `frontend/dist/`。生产环境由后端自动检测该目录（或 `FRONTEND_DIST`）并托管。

---

## 五、环境变量（后端）

复制 `backend/.env.example` 为 `backend/.env`。常用项：

| 变量 | 说明 |
|------|------|
| `DATABASE_URL` | MySQL 连接串 |
| `JWT_SECRET` | 至少 32 字符 |
| `NODE_ENV` | `production` 时 Cookie `Secure`、托管前端、HSTS 等 |
| `PORT` | 监听端口，默认 4000 |
| `FRONTEND_ORIGIN` | 与浏览器访问来源完全一致（含 `https`、是否 `www`） |
| `FRONTEND_DIST` | 可选，前端 `dist` 绝对路径或相对 `backend` cwd 的路径 |
| `SEED_ADMIN_*` | 仅 `prisma db seed` 使用 |

---

## 六、部署方式（与 SSH 的关系）

### 模式 A：一体化（推荐 SSH 单机）

1. 服务器上克隆仓库，配置 `backend/.env`。
2. 执行 `bash deploy/build-production.sh`（或在 `backend` / `frontend` 分别 `npm ci && npm run build`）。
3. 首次：`npx prisma db push`、`npx prisma db seed`（在 `backend` 下）。
4. `NODE_ENV=production node dist/index.js`（工作目录为 `backend`），或使用 `deploy/sgu-backend.service.example`。
5. Nginx 仅需 **`location /` 反代到 Node**（参考 `deploy/nginx-one-upstream.example.conf`），Certbot 申请 HTTPS。

### 模式 B：Nginx 托管静态 + 仅反代 API

与模式 A 二选一：Nginx `root` 指向 `frontend/dist`，`location /api` 与 `/uploads` 反代到 Node。此时可不依赖 Express 托管 `dist`，但若 `NODE_ENV=production` 且仍存在 `../frontend/dist`，**仍会**由 Express 提供静态页（通常可删除服务器上的 `dist` 或设 `FRONTEND_DIST` 为空路径并确保无默认目录——当前实现为「若不存在 `index.html` 则不托管」）。

### 本地开发

见 `docs/DEPLOYMENT.md`：后端 `npm run dev`，前端 `npm run dev`，依赖 Vite 代理。

---

## 七、运维与安全提示

- 生产环境必须 **HTTPS**，否则 `Secure` Cookie 无法用于登录。
- 定期备份 **MySQL** 与 **`backend/uploads`**。
- 勿将 `.env` 提交到 Git；`JWT_SECRET` 与数据库密码需足够强度。
- 云服务器安全组：**不要**对公网开放 MySQL 端口。

---

## 八、相关文件索引

| 需求 | 位置 |
|------|------|
| 本地从零跑通 | `docs/DEPLOYMENT.md` |
| 生产构建脚本 | `deploy/build-production.sh` |
| systemd 示例 | `deploy/sgu-backend.service.example` |
| API 健康检查 | `GET /api/health` |
| 环境变量模板 | `backend/.env.example` |

若你扩展了新接口或新页面，建议在本文件对应章节追加一行说明，便于后来者快速定位。
