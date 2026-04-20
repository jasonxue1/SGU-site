import { FormEvent, useEffect, useState } from "react";
import { apiJson } from "../../api";
import type { AdminUser } from "../../types";

export function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  async function reload() {
    const data = await apiJson<{ users: AdminUser[] }>("/api/admin/users");
    setUsers(data.users);
  }

  useEffect(() => {
    void reload().catch((e) => setErr(e instanceof Error ? e.message : "加载失败"));
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      await apiJson("/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          username,
          password,
          displayName: displayName || null,
        }),
      });
      setUsername("");
      setPassword("");
      setDisplayName("");
      await reload();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "创建失败");
    }
  }

  async function toggleActive(u: AdminUser) {
    setErr(null);
    try {
      await apiJson(`/api/admin/users/${u.id}`, {
        method: "PUT",
        body: JSON.stringify({ isActive: !u.isActive }),
      });
      await reload();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "更新失败");
    }
  }

  async function resetPassword(u: AdminUser) {
    const next = prompt(`为 ${u.username} 设置新密码（至少 6 位）`);
    if (!next || next.length < 6) return;
    setErr(null);
    try {
      await apiJson(`/api/admin/users/${u.id}`, {
        method: "PUT",
        body: JSON.stringify({ password: next }),
      });
      await reload();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "重置失败");
    }
  }

  async function remove(u: AdminUser) {
    if (!confirm(`确定删除管理员 ${u.username} ？`)) return;
    setErr(null);
    try {
      await apiJson(`/api/admin/users/${u.id}`, { method: "DELETE" });
      await reload();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "删除失败");
    }
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>管理员账号</h1>
      <p className="muted">密码使用 bcrypt 存储；登录接口有频率限制。请为每位管理员使用强密码。</p>

      <div className="panel">
        <h3 style={{ marginTop: 0 }}>新建管理员</h3>
        <form onSubmit={(e) => void onCreate(e)}>
          <div className="row">
            <label>用户名（字母数字下划线）</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} required pattern="^[a-zA-Z0-9_-]+$" minLength={3} />
          </div>
          <div className="row">
            <label>密码（至少 6 位）</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
          <div className="row">
            <label>显示名称（可选）</label>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          {err ? <p className="error">{err}</p> : null}
          <button className="btn btn-primary" type="submit">
            创建
          </button>
        </form>
      </div>

      <div className="panel">
        <h3 style={{ marginTop: 0 }}>账号列表</h3>
        <table className="table">
          <thead>
            <tr>
              <th>用户名</th>
              <th>显示名</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.username}</td>
                <td>{u.displayName ?? "—"}</td>
                <td>{u.isActive ? "正常" : "已停用"}</td>
                <td>
                  <button type="button" className="btn btn-ghost" onClick={() => void toggleActive(u)}>
                    {u.isActive ? "停用" : "启用"}
                  </button>{" "}
                  <button type="button" className="btn btn-ghost" onClick={() => void resetPassword(u)}>
                    重置密码
                  </button>{" "}
                  <button type="button" className="btn btn-ghost" onClick={() => void remove(u)}>
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
