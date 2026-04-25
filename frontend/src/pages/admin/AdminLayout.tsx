import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { apiJson } from "../../api";

type Me = {
  user: {
    id: string;
    username: string;
    displayName: string | null;
  };
};

type AuthState = "loading" | "authed" | "anon";

const adminEase = [0.22, 1, 0.36, 1] as const;

function isValidMe(data: unknown): data is Me {
  if (!data || typeof data !== "object") return false;
  const u = (data as Me).user;
  return Boolean(u && typeof u.id === "string" && u.id.length > 0 && typeof u.username === "string");
}

export function AdminLayout() {
  const nav = useNavigate();
  const location = useLocation();
  const reduce = useReducedMotion();
  const [auth, setAuth] = useState<AuthState>("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setAuth("loading");
      try {
        const data = await apiJson<unknown>("/api/auth/me");
        if (cancelled) return;
        if (!isValidMe(data)) {
          setAuth("anon");
          return;
        }
        setAuth("authed");
      } catch {
        if (!cancelled) setAuth("anon");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  async function logout() {
    await apiJson("/api/auth/logout", { method: "POST" });
    setAuth("anon");
    nav("/admin/login", { replace: true });
  }

  if (auth === "loading") {
    return (
      <div className="container" style={{ padding: 24 }}>
        <p className="muted">验证登录状态…</p>
      </div>
    );
  }

  if (auth === "anon") {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  const y = 10;
  const yExit = -6;
  const duration = reduce ? 0.01 : 0.26;

  return (
    <div className="admin-shell">
      <aside className="admin-nav">
        <div className="brand" style={{ marginBottom: 16 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg, #1f6f54, #3ecf8e)",
            }}
          />
          <div>
            <div style={{ fontWeight: 700 }}>后台</div>
            <div className="muted" style={{ fontSize: 12 }}>
              CMS
            </div>
          </div>
        </div>
        <NavLink end to="/admin" className={({ isActive }) => (isActive ? "active" : "")}>
          总览
        </NavLink>
        <NavLink to="/admin/site" className={({ isActive }) => (isActive ? "active" : "")}>
          站点与品牌
        </NavLink>
        <NavLink to="/admin/cards" className={({ isActive }) => (isActive ? "active" : "")}>
          内容卡片
        </NavLink>
        <NavLink to="/admin/announcements" className={({ isActive }) => (isActive ? "active" : "")}>
          近期公告
        </NavLink>
        <NavLink to="/admin/server-history" className={({ isActive }) => (isActive ? "active" : "")}>
          服务器历史
        </NavLink>
        <NavLink to="/admin/members" className={({ isActive }) => (isActive ? "active" : "")}>
          成员栏
        </NavLink>
        <NavLink to="/admin/open-source" className={({ isActive }) => (isActive ? "active" : "")}>
          开源项目
        </NavLink>
        <NavLink to="/admin/users" className={({ isActive }) => (isActive ? "active" : "")}>
          管理员账号
        </NavLink>
        <button type="button" className="btn btn-ghost" style={{ width: "100%", marginTop: 16 }} onClick={() => void logout()}>
          退出登录
        </button>
      </aside>
      <section className="admin-main">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            className="page-transition page-transition--admin"
            initial={{ opacity: 0, y: reduce ? 0 : y }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduce ? 0 : yExit }}
            transition={{ duration, ease: adminEase }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </section>
    </div>
  );
}
