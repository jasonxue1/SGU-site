import { FormEvent, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiJson } from "../../api";

function safeAdminRedirectPath(from: string | undefined): string {
  if (typeof from !== "string") return "/admin";
  const p = from.trim();
  if (!p.startsWith("/admin")) return "/admin";
  if (p === "/admin/login") return "/admin";
  if (p.includes("..") || p.includes("\0")) return "/admin";
  if (p.includes("//")) return "/admin";
  return p;
}

export function AdminLogin() {
  const nav = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await apiJson("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      const from = (location.state as { from?: string } | null)?.from;
      nav(safeAdminRedirectPath(from), { replace: true });
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "登录失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <h1>管理后台登录</h1>
        <p className="muted">使用管理员账号登录。Cookie 为 HttpOnly，请勿在公共电脑勾选“记住密码”。</p>
        <form onSubmit={(e) => void onSubmit(e)}>
          <div className="row">
            <label htmlFor="u">用户名</label>
            <input
              id="u"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="row">
            <label htmlFor="p">密码</label>
            <input
              id="p"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          {err ? <p className="error">{err}</p> : null}
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: "100%", marginTop: 8 }}>
            {loading ? "登录中…" : "登录"}
          </button>
        </form>
      </div>
    </div>
  );
}
