# SGU Server Site

> Self-hostable full-stack site: **Vite + React + TypeScript** frontend, **Express + Prisma + TypeScript** backend. Root scripts help install and build in one go—suitable for VPS deployment (e.g. **aaPanel / 宝塔**).

面向自建部署的全栈网站项目，前后端分离；生产环境下可由**同一 Node 进程**托管 API 与前端静态资源，也支持由 Nginx 分别反代。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 19、Vite 6、TypeScript、React Router、Framer Motion |
| 后端 | Express 5、Prisma 6、Zod、JWT、Helmet、rate-limit |
| 数据库 | MySQL（由 Prisma 管理） |

## 目录结构

```
.
├── frontend/     # 前端（Vite）
├── backend/      # 后端（Express + Prisma）
└── package.json  # 根目录：一键安装 / 构建脚本
```

## 环境要求

- **Node.js** 18+（建议当前 LTS）
- **MySQL** 5.7+ / 8.x，并准备连接字符串

## 快速开始

### 1. 安装依赖

在仓库根目录执行：

```bash
npm run install:all
```

或分别进入 `frontend/`、`backend/` 执行 `npm install`。

### 2. 配置环境变量

在 `backend/` 下创建 `.env`（**勿提交**到版本库），至少包含：

| 变量 | 说明 |
|------|------|
| `DATABASE_URL` | Prisma 所需 MySQL 连接串，如 `mysql://user:pass@host:3306/dbname` |
| `JWT_SECRET` | 签名管理员 Cookie 的密钥，**至少 32 字符** |
| `FRONTEND_ORIGIN` | 浏览器访问前端的**单一**来源，如开发 `http://localhost:5173`，生产为实际站点 `https://你的域名`（**不可**使用 `*`） |

常用可选变量：

| 变量 | 说明 |
|------|------|
| `PORT` | 后端端口，默认 `4000` |
| `NODE_ENV` | 设为 `production` 时启用生产策略（如托管前端 `dist`、HSTS 等） |
| `FRONTEND_DIST` | 前端构建目录；不设则默认识别为相对 `backend` 进程工作目录的 `../frontend/dist` |
| `LISTEN_HOST` | 监听地址；生产默认可为 `0.0.0.0`，本地仅本机可设为 `127.0.0.1` |

### 3. 数据库

在 `backend` 目录中：

```bash
npm run db:push
# 或迁移工作流
npm run db:migrate
```

需要初始数据时：

```bash
npm run db:seed
```

### 4. 本地开发

**终端 A（后端，默认 `http://127.0.0.1:4000`）：**

```bash
cd backend
npm run dev
```

**终端 B（前端，默认 `http://127.0.0.1:5173`）：**

```bash
cd frontend
npm run dev
```

Vite 已将 `/api`、`/uploads` 代理到本机 4000 端口。

自检接口：`GET http://127.0.0.1:4000/api/health`

### 5. 生产构建

在**仓库根目录**：

```bash
npm run build
```

或分步执行 `npm run build:frontend` / `npm run build:backend`。

将 `backend` 的工作目录设为其自身目录，设置好 `.env` 后：

```bash
cd backend
NODE_ENV=production npm start
```

若 `NODE_ENV=production` 且存在已构建的 `frontend/dist`（或 `FRONTEND_DIST` 指向有效目录），后端会**同进程托管**前端静态资源并做 SPA 回退。

> **生产环境务必**：使用强 `JWT_SECRET`、正确配置 `FRONTEND_ORIGIN` 与 HTTPS，并在前面使用 Nginx 等反向代理，勿将 Node 端口直接长期暴露于公网。

## 在宝塔等面板中部署的提示

- 用网站「反向代理」到 Node 监听的 `PORT`，并保留以 `/api`、`/uploads` 为前缀的完整路径（**不要**误删 `/api` 导致接口 404；可先访问 `GET /api` 与 `/api/health` 排查）。
- 确保 `FRONTEND_ORIGIN` 与浏览器实际访问的协议 + 域名 + 端口一致，否则 CORS 会失败。

## 参与贡献

欢迎通过 Issue、Pull Request 反馈问题或提交改进。请保持变更范围清晰、说明动机与测试方式（若有）。

## 许可证

本仓库**尚未**包含 `LICENSE` 文件时，默认**不**自动授予使用许可。若你计划开源，请自行添加 [Choose a License](https://choosealicense.com/) 上合适的许可证，并更新本段说明。

---

*第三方库归各自所有；若对外展示，请同时遵守相关依赖的许可证要求。*
