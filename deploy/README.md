# SSH / 生产部署辅助文件

| 文件 | 说明 |
|------|------|
| `build-production.sh` | 在 Linux 服务器上构建 `backend` 与 `frontend`（需在仓库根目录执行） |
| `sgu-backend.service.example` | systemd 单元示例，`WorkingDirectory` 指向 `backend` |
| `nginx-one-upstream.example.conf` | Nginx 仅反代到 Node 的示例片段（适合「一体化」托管） |

更详细的步骤见仓库根目录 **`代码说明.md`**（部署章节）与 **`docs/DEPLOYMENT.md`**（本地开发）。
