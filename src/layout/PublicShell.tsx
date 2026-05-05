import { useEffect, useState, type ReactNode } from "react";
import { FaDiscord } from "react-icons/fa";
import { SiBilibili } from "react-icons/si";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { staticSiteData } from "../staticSiteData";

function useThemeInit() {
  useEffect(() => {
    const saved = localStorage.getItem("sgu-theme");
    const theme = saved === "light" || saved === "dark" ? saved : "light";
    document.documentElement.dataset.theme = theme;
  }, []);
}

function useDocumentMeta() {
  const { pathname } = useLocation();
  const { config } = staticSiteData;

  useEffect(() => {
    const base = config.siteName ?? "SGU Server";
    const titleMap: Record<string, string> = {
      "/": base,
      "/join": `${config.joinPageTitle ?? "加入我们"} | ${base}`,
      "/rules": `${config.groupRulesTitle ?? "服规及群规"} | ${base}`,
      "/members": `成员 | ${base}`,
      "/open-source": `开源项目 | ${base}`,
      "/history": `服务器历史 | ${base}`,
    };
    document.title = titleMap[pathname] ?? base;

    const desc = config.seoDescription?.trim() || "Minecraft SGU Server";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", desc);
  }, [pathname, config]);
}

function navClass(_active: boolean) {
  return "nav-text";
}

type Theme = "light" | "dark";

function readTheme(): Theme {
  const saved = localStorage.getItem("sgu-theme");
  if (saved === "light" || saved === "dark") return saved;
  return "light";
}

function ThemeToggle() {
  useThemeInit();
  const [theme, setTheme] = useState<Theme>(() =>
    typeof document !== "undefined" &&
    document.documentElement.getAttribute("data-theme") === "dark"
      ? "dark"
      : "light",
  );

  useEffect(() => {
    setTheme(readTheme());
  }, []);

  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem("sgu-theme", next);
  };

  return (
    <button
      type="button"
      className="topbar-action-btn topbar-action-btn--theme theme-toggle"
      title={theme === "dark" ? "切换浅色" : "切换深色"}
      aria-label="切换明暗主题"
      onClick={toggleTheme}
    >
      <span className="topbar-action-btn__emoji" aria-hidden>
        {theme === "dark" ? "☀" : "🌙"}
      </span>
    </button>
  );
}

function HeaderLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <NavLink to={href} className={({ isActive }) => navClass(isActive)}>
      {children}
    </NavLink>
  );
}

export function PublicShell() {
  useDocumentMeta();
  const { config } = staticSiteData;

  return (
    <div className="public-page">
      <header className="topbar-shell">
        <div className="container topbar">
          <NavLink to="/" className="brand brand-link">
            <img
              src={config.logoUrl ?? "/images/site/logo.png"}
              alt="SGU Server"
              className="brand-logo"
            />
            <div>
              <div className="brand-title">
                {config.siteName ?? "SGU Server"}
              </div>
              <div className="brand-tagline muted">{config.tagline ?? ""}</div>
            </div>
          </NavLink>

          <nav className="topbar-nav" aria-label="站内导航">
            <HeaderLink href="/">首页</HeaderLink>
            <HeaderLink href="/join">加入我们</HeaderLink>
            <HeaderLink href="/rules">服规</HeaderLink>
            <HeaderLink href="/members">成员</HeaderLink>
            <HeaderLink href="/open-source">开源项目</HeaderLink>
            <HeaderLink href="/history">服务器历史</HeaderLink>
          </nav>

          <div className="topbar-actions">
            {config.discordUrl ? (
              <a
                href={config.discordUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="topbar-action-btn topbar-action-btn--discord"
                title="Discord"
                aria-label="打开 Discord"
              >
                <FaDiscord
                  className="topbar-action-btn__img"
                  aria-hidden="true"
                />
              </a>
            ) : null}
            {config.bilibiliUrl ? (
              <a
                href={config.bilibiliUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="topbar-action-btn topbar-action-btn--bilibili"
                title="哔哩哔哩"
                aria-label="在哔哩哔哩关注我们"
              >
                <SiBilibili
                  className="topbar-action-btn__img topbar-action-btn__img--bili"
                  aria-hidden="true"
                />
              </a>
            ) : null}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="page-transition">
        <Outlet />
      </main>

      <footer className="container footer footer-spacious">
        {config.footerNote ? (
          <div className="footer-note">{config.footerNote}</div>
        ) : null}
        {config.icpLicense ? (
          <div className="footer-icp muted">{config.icpLicense}</div>
        ) : null}
      </footer>
    </div>
  );
}
