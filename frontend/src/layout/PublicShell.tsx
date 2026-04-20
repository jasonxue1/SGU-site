import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageTransition } from "./PageTransition";
import { apiJson } from "../api";
import { PublicSiteContext } from "../context/PublicSiteContext";
import { publicImageSrc } from "../lib/mediaUrl";
import { isSafeHttpUrl } from "../lib/safeLink";
import type { PublicSitePayload, SiteConfig } from "../types";
import { ThemeToggle } from "./ThemeToggle";
import { DiscordIcon } from "./DiscordIcon";

function useThemeInit() {
  useEffect(() => {
    const saved = localStorage.getItem("sgu-theme");
    const mode = saved === "light" || saved === "dark" ? saved : "light";
    document.documentElement.setAttribute("data-theme", mode);
  }, []);
}

export function PublicShell() {
  useThemeInit();
  const [payload, setPayload] = useState<PublicSitePayload | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiJson<PublicSitePayload>("/api/public/site");
        if (!cancelled) setPayload(data);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "加载失败");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const cfg = payload?.config as SiteConfig | undefined;
    if (!cfg) return;
    document.title = cfg.siteName?.trim() || "生电服务器";
    const desc = cfg.seoDescription?.trim();
    if (desc) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "description");
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", desc);
    }
  }, [payload]);

  if (err) {
    return (
      <div className="container" style={{ padding: "48px 0" }}>
        <p className="error">{err}</p>
      </div>
    );
  }

  if (!payload) {
    return (
      <div className="container" style={{ padding: "48px 0" }}>
        <p className="muted">加载中…</p>
      </div>
    );
  }

  const config = payload.config ?? {};
  const logoSrc = publicImageSrc(config.logoUrl);
  const discordHref = isSafeHttpUrl(config.discordUrl) ? config.discordUrl : null;
  const bilibiliHref = isSafeHttpUrl(config.bilibiliUrl) ? config.bilibiliUrl : null;

  return (
    <PublicSiteContext.Provider value={payload}>
      <div className="public-page">
        <header className="topbar-shell">
          <div className="container topbar">
            <Link to="/" className="brand brand-link">
              {logoSrc ? (
                <img src={logoSrc} alt="" className="brand-logo" />
              ) : (
                <div className="brand-logo brand-logo--placeholder" aria-hidden />
              )}
              <div>
                <div className="brand-title">{config.siteName ?? "生电服务器"}</div>
                <div className="brand-tagline muted">{config.tagline ?? ""}</div>
              </div>
            </Link>

            <nav className="topbar-nav" aria-label="站内导航">
              <Link to="/join" className="nav-text">
                加入我们
              </Link>
              <Link to="/members" className="nav-text">
                成员
              </Link>
              <Link to="/open-source" className="nav-text">
                开源项目
              </Link>
              <Link to="/history" className="nav-text">
                服务器历史
              </Link>
            </nav>

            <div className="topbar-actions">
              {discordHref ? (
                <a
                  className="topbar-action-btn topbar-action-btn--discord"
                  href={discordHref}
                  target="_blank"
                  rel="noreferrer"
                  title="Discord"
                  aria-label="打开 Discord"
                >
                  <DiscordIcon />
                </a>
              ) : null}
              {bilibiliHref ? (
                <a
                  className="topbar-action-btn topbar-action-btn--bilibili"
                  href={bilibiliHref}
                  target="_blank"
                  rel="noreferrer"
                  title="哔哩哔哩"
                  aria-label="在哔哩哔哩关注我们"
                >
                  <img src="/bilibili.png" alt="" className="topbar-action-btn__img topbar-action-btn__img--bili" width={28} height={28} />
                </a>
              ) : null}
              <ThemeToggle />
            </div>
          </div>
        </header>

        <PageTransition variant="public" />

        <footer className="container footer footer-spacious">
          {config.footerNote ? <div className="footer-note">{config.footerNote}</div> : null}
          {config.icpLicense?.trim() ? (
            <div className="footer-icp muted">{config.icpLicense.trim()}</div>
          ) : null}
        </footer>
      </div>
    </PublicSiteContext.Provider>
  );
}
