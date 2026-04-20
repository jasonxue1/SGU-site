/**
 * PM2 配置：固定 cwd，避免在错误目录下启动导致读到旧代码或其它项目的 dist。
 *
 * 用法（在 backend 目录）：
 *   pm2 delete sgu-backend
 *   npm run build
 *   pm2 start ecosystem.config.cjs
 *   pm2 save
 */
const path = require("path");

module.exports = {
  apps: [
    {
      name: "sgu-backend",
      cwd: __dirname,
      script: path.join(__dirname, "dist", "index.js"),
      interpreter: "node",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
    },
  ],
};
