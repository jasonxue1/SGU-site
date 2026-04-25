#!/usr/bin/env bash
# 在服务器上通过 SSH 登录后执行：用于构建后端 + 前端，供生产环境由 Node 托管静态站。
# 用法：bash deploy/build-production.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT/backend"
npm ci
npm run build
npx prisma generate
cd "$ROOT/frontend"
npm ci
npm run build
echo ""
echo "构建完成。"
echo "1. 配置 backend/.env（NODE_ENV=production、DATABASE_URL、JWT_SECRET、FRONTEND_ORIGIN=https://你的域名）"
echo "2. 首次部署执行：cd backend && npx prisma db push && npx prisma db seed"
echo "3. 启动：cd backend && node dist/index.js（或使用 systemd / pm2）"
