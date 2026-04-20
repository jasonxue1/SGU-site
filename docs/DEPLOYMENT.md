# 生电服务器官网：本地部署超详细指南（Windows 友好）

本文档面向**第一次接触 Node.js / MySQL** 的同学，目标是：在你自己的电脑上把**前端 + 后端 + MySQL** 跑起来，并能用后台改首页文字、Logo、卡片和管理员账号。

参考风格站点：[CloudTown 雲鎮工藝](https://mc-ctec.org/)（本项目为自建实现，不保证与其完全一致）。

---

## 一、你将得到什么

- **访客首页**：展示服务器名称、标语、Logo、主视觉文案、服务器地址（一键复制）、外链（Discord / 哔哩哔哩 / QQ 群等）、内容卡片网格、页脚说明。
- **管理后台**（需登录）：
  - 编辑站点与品牌（含 Logo 上传或 URL）
  - 增删改内容卡片（图片、外链、排序、是否发布）
  - 管理后台管理员账号（创建、停用、重置密码、删除）
- **数据库**：MySQL 持久化站点配置、卡片、管理员。
- **安全相关**（已实现）：
  - 密码 **bcrypt** 哈希（成本因子 12）
  - 登录 **JWT** 存放在 **HttpOnly Cookie**（前端 JS 读不到令牌内容）
  - **Helmet** 安全响应头
  - 登录接口 **速率限制**（防暴力破解）
  - 管理接口 **必须登录**；输入使用 **Zod** 校验
  - SQL 使用 **Prisma** 参数化查询，降低注入风险

> 生产环境请再配合 **HTTPS**、强 `JWT_SECRET`、服务器防火墙、定期备份数据库与 `uploads` 目录。

---

## 二、需要提前安装的工具

### 1. Node.js（LTS）

1. 打开 Node.js 官网：https://nodejs.org/
2. 下载 **LTS** 版本并安装。
3. 安装完成后，打开 **PowerShell**，执行：

```powershell
node -v
npm -v
```

能看到版本号即可。

### 2. MySQL 8.x

任选一种安装方式：

- **官方安装包**：https://dev.mysql.com/downloads/mysql/
- 或使用 **XAMPP / WAMP** 自带的 MySQL（高级用户）

安装完成后，确保 MySQL **服务已启动**，并记住：

- **主机**：一般是 `127.0.0.1` 或 `localhost`
- **端口**：默认 `3306`
- **root 密码**（或你自己创建的用户名/密码）

### 3. Git（可选）

如果你从 Git 仓库拉代码，需要 Git：https://git-scm.com/

---

## 三、准备数据库

### 1. 登录 MySQL

使用 MySQL 命令行、MySQL Workbench、或 Navicat 等工具，用 root（或你的账号）登录。

### 2. 创建数据库

执行（库名可改，但要与后面的 `DATABASE_URL` 一致）：

```sql
CREATE DATABASE sgu_server_site
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

### 3. 创建专用账号（推荐）

把下面 SQL 里的密码改成你自己的强密码：

```sql
CREATE USER 'sgu_site'@'localhost' IDENTIFIED BY '你自己的强密码';
GRANT ALL PRIVILEGES ON sgu_server_site.* TO 'sgu_site'@'localhost';
FLUSH PRIVILEGES;
```

> 若你只想用 `root`，也可以跳过这步，直接把 `DATABASE_URL` 写成 root 的连接串（不推荐在生产环境这样做）。

---

## 四、下载项目并配置环境变量

假设你的项目文件夹是：`d:\sgu-server.xin`

### 1. 后端环境变量

1. 复制 `backend\.env.example` 为 `backend\.env`
2. 用记事本 / VS Code 打开 `backend\.env`，修改：

**`DATABASE_URL` 格式：**

```env
DATABASE_URL="mysql://用户名:密码@127.0.0.1:3306/sgu_server_site"
```

示例（使用上一步创建的 `sgu_site` 用户）：

```env
DATABASE_URL="mysql://sgu_site:你的密码@127.0.0.1:3306/sgu_server_site"
```

**`JWT_SECRET`：**

- 至少 **32 个字符**的随机字符串。
- 你可以让 PowerShell 生成一段（示例）：

```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 48 | ForEach-Object {[char]$_})
```

把输出粘贴到：

```env
JWT_SECRET="粘贴这里"
```

**`FRONTEND_ORIGIN`（非常重要）：**

- 本地开发默认：

```env
FRONTEND_ORIGIN="http://localhost:5173"
```

这会影响：

- 浏览器 **CORS**（哪些前端域名可以调用 API）
- Cookie 策略相关行为

**`SEED_ADMIN_USERNAME` / `SEED_ADMIN_PASSWORD`（可选）：**

- 用于**第一次**写入数据库时的管理员账号。
- 登录密码在数据库里是哈希存储；**部署后请尽快登录后台或重置密码**。

---

## 五、安装依赖并初始化数据库表

在 PowerShell 中执行（注意路径）：

```powershell
cd d:\sgu-server.xin\backend
npm install
```

把 Prisma  schema 同步到 MySQL（开发环境推荐 `db push`，简单直接）：

```powershell
npx prisma db push
```

写入初始数据（默认站点配置、示例卡片、管理员账号）：

```powershell
npx prisma db seed
```

若成功，你会看到类似 “Seed OK” 的提示。

### 常见问题

1. **`JWT_SECRET 未设置或过短`**
   - 检查 `backend\.env` 是否存在、`JWT_SECRET` 是否 ≥ 32 字符。

2. **数据库连接失败**
   - 检查 MySQL 是否启动、`DATABASE_URL` 用户名密码是否正确、数据库是否已创建。

3. **`prisma db push` 权限错误**
   - 确认数据库用户对 `sgu_server_site` 库有 `ALL PRIVILEGES`。

---

## 六、启动后端 API

仍在 `backend` 目录：

```powershell
npm run dev
```

看到类似：

```text
API  listening on http://127.0.0.1:4000
```

保持这个窗口**不要关**。

自测健康检查（新开一个 PowerShell）：

```powershell
curl http://127.0.0.1:4000/api/health
```

应返回 JSON：`{"ok":true}`

---

## 七、启动前端（访客站 + 后台界面）

再开一个 PowerShell：

```powershell
cd d:\sgu-server.xin\frontend
npm install
npm run dev
```

终端会提示本地地址，一般是：

```text
http://localhost:5173/
```

### 访问入口

- **访客首页**：http://localhost:5173/
- **后台登录**：http://localhost:5173/admin/login

默认管理员账号来自你 `backend\.env` 里的 `SEED_ADMIN_USERNAME` / `SEED_ADMIN_PASSWORD`（若未改，请看 `backend\.env.example` 里的示例默认值；**务必修改**）。

> 开发模式下，Vite 会把 `/api` 与 `/uploads` **代理**到 `http://127.0.0.1:4000`，所以前端页面可以直接加载上传后的 Logo。

---

## 八、你第一次应该做的安全检查

1. 登录后台后，到 **管理员账号** 页面，给主账号设置一个**新的强密码**（或新建账号再停用旧账号）。
2. 确认 `backend\.env` 中的 `JWT_SECRET` 足够随机且**不要提交到 Git**（本仓库 `.gitignore` 已忽略 `.env`）。
3. 若电脑是多人共用，使用完毕后**退出后台**，并考虑清除浏览器 Cookie。

---

## 九、生产环境部署思路（进阶简述）

生产环境建议：

1. **HTTPS**：由 Nginx / Caddy / 云厂商负载均衡终止 TLS。
2. **同域部署**（减少 CORS 复杂度）：
   - `npm run build` 构建前端静态文件
   - **方式一**：Nginx 托管 `frontend/dist`，并把 `/api`、`/uploads` 反代到 Node
   - **方式二（适合 SSH 单机）**：`NODE_ENV=production` 时由 **Express 自动托管** `../frontend/dist`（或 `FRONTEND_DIST`），Nginx 只需把整站反代到 Node；构建脚本见仓库 `deploy/build-production.sh`，说明见根目录 **`代码说明.md`**
3. 设置环境变量：
   - `NODE_ENV=production`
   - `FRONTEND_ORIGIN=https://你的域名`
   - Cookie 会自动使用 `Secure`（仅 HTTPS 发送）
4. 定期备份：
   - MySQL 数据库
   - `backend/uploads`（用户上传的图片）

---

## 十、目录说明（便于你维护）

| 路径 | 作用 |
|------|------|
| `backend/prisma/schema.prisma` | 数据库表结构定义 |
| `backend/src/index.ts` | API 入口、静态资源、中间件 |
| `backend/src/routes/` | 路由：公开站点、登录、后台 CRUD |
| `backend/uploads/public/` | Logo / 卡片图片上传保存目录 |
| `frontend/src/pages/HomePage.tsx` | 访客首页 |
| `frontend/src/pages/admin/` | 后台页面 |
| `frontend/vite.config.ts` | 开发代理配置 |

---

## 十一、API 一览（给进阶用户）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| GET | `/api/public/site` | 访客首页数据（配置 + 已发布卡片） |
| POST | `/api/auth/login` | 登录（Set-Cookie） |
| POST | `/api/auth/logout` | 退出 |
| GET | `/api/auth/me` | 当前管理员信息（需登录） |
| GET/PUT | `/api/admin/settings` | 读取/更新站点 JSON 配置 |
| GET/POST | `/api/admin/cards` | 卡片列表/新建 |
| PUT/DELETE | `/api/admin/cards/:id` | 更新/删除卡片 |
| GET/POST | `/api/admin/users` | 管理员列表/创建 |
| PUT/DELETE | `/api/admin/users/:id` | 更新/删除管理员 |
| POST | `/api/admin/upload/logo` | 上传图片（multipart，字段名 `file`） |

---

## 十二、仍然报错怎么办？

1. 把 **后端终端** 和 **前端终端** 的报错全文复制下来。
2. 确认 MySQL、Node 版本、`.env` 内容（**不要**把密码和 `JWT_SECRET` 发给不可信的人）。
3. 优先检查：`DATABASE_URL`、`FRONTEND_ORIGIN`、MySQL 是否监听 `3306`、防火墙是否拦截。

---

祝你开服顺利。若你希望下一步把**生产环境 Nginx 配置**或**一键 Docker Compose**也补上，可以在项目里继续加一章专门写那部分。
