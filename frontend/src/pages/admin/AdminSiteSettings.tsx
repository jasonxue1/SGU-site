import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { apiJson, apiUpload } from "../../api";
import { publicImageSrc } from "../../lib/mediaUrl";
import type { SiteConfig } from "../../types";

const AUTOSAVE_DEBOUNCE_MS = 900;

function siteSettingsPayload(c: SiteConfig): SiteConfig {
  return { ...c, heroBannerUrls: [] };
}

export function AdminSiteSettings() {
  const [config, setConfig] = useState<SiteConfig>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const saveGeneration = useRef(0);
  const hydratedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiJson<{ config: SiteConfig }>("/api/admin/settings");
        if (!cancelled) setConfig(data.config ?? {});
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "加载失败");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback(async (snapshot: SiteConfig, source: "auto" | "manual") => {
    const myGen = ++saveGeneration.current;
    setSaving(true);
    setErr(null);
    if (source === "manual") setMsg(null);
    try {
      await apiJson("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify(siteSettingsPayload(snapshot)),
      });
      if (myGen !== saveGeneration.current) return;
      const t = new Date().toLocaleTimeString();
      setMsg(source === "auto" ? `已自动保存 · ${t}` : `已保存 · ${t}`);
    } catch (e2) {
      if (myGen !== saveGeneration.current) return;
      setErr(e2 instanceof Error ? e2.message : "保存失败");
      setMsg(null);
    } finally {
      if (myGen === saveGeneration.current) setSaving(false);
    }
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!hydratedRef.current) {
      hydratedRef.current = true;
      return;
    }
    const t = window.setTimeout(() => {
      void persist(config, "auto");
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [config, loading, persist]);

  function patch<K extends keyof SiteConfig>(key: K, value: SiteConfig[K]) {
    setConfig((c) => ({ ...c, [key]: value }));
  }

  async function onSaveNow(e: FormEvent) {
    e.preventDefault();
    await persist(config, "manual");
  }

  async function onLogoFile(file: File | null) {
    if (!file) return;
    setErr(null);
    try {
      const { url } = await apiUpload("/api/admin/upload/logo", file);
      patch("logoUrl", url);
      setMsg("Logo 已上传");
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "上传失败");
    }
  }

  async function onHeroBannerPrimaryFile(file: File | null) {
    if (!file) return;
    setErr(null);
    try {
      const { url } = await apiUpload("/api/admin/upload/logo", file);
      patch("heroBannerUrl", url);
      setMsg("首页 Banner 已上传");
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "上传失败");
    }
  }

  if (loading) return <p className="muted">加载中…</p>;

  const logoPreview = publicImageSrc(config.logoUrl);
  const bannerPreview = publicImageSrc(config.heroBannerUrl);

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>站点与品牌</h1>
      <form className="panel" onSubmit={(e) => void onSaveNow(e)}>
        <p className="muted" style={{ marginTop: 0 }}>
          {saving ? "正在保存…" : err ? "保存失败，请查看下方说明" : msg ?? "修改表单后约 1 秒内自动保存到服务器"}
        </p>
        <div className="row">
          <label>站点名称</label>
          <input value={config.siteName ?? ""} onChange={(e) => patch("siteName", e.target.value)} />
        </div>
        <div className="row">
          <label>一句话标语</label>
          <input value={config.tagline ?? ""} onChange={(e) => patch("tagline", e.target.value)} />
        </div>
        <div className="row">
          <label>Logo 图片 URL（也可上传）</label>
          <input value={config.logoUrl ?? ""} onChange={(e) => patch("logoUrl", e.target.value)} placeholder="/uploads/public/xxx.png 或外链" />
          <input type="file" accept="image/*" onChange={(e) => void onLogoFile(e.target.files?.[0] ?? null)} />
          {logoPreview ? <img src={logoPreview} alt="" style={{ maxWidth: 120, marginTop: 8, borderRadius: 12 }} /> : null}
        </div>
        <div className="row">
          <label>主标题（首页 Hero）</label>
          <input value={config.heroTitle ?? ""} onChange={(e) => patch("heroTitle", e.target.value)} />
        </div>
        <div className="row">
          <label>副标题</label>
          <textarea value={config.heroSubtitle ?? ""} onChange={(e) => patch("heroSubtitle", e.target.value)} />
        </div>
        <div className="row">
          <label>首页 Banner 背景图（可选）</label>
          <input
            value={config.heroBannerUrl ?? ""}
            onChange={(e) => patch("heroBannerUrl", e.target.value)}
            placeholder="/uploads/public/xxx.jpg 或外链"
          />
          <input type="file" accept="image/*" onChange={(e) => void onHeroBannerPrimaryFile(e.target.files?.[0] ?? null)} />
          {bannerPreview ? (
            <img
              src={bannerPreview}
              alt=""
              style={{ width: "100%", maxWidth: 520, maxHeight: 140, marginTop: 8, borderRadius: 12, objectFit: "cover" }}
            />
          ) : null}
        </div>
        <div className="row">
          <label>页脚说明</label>
          <textarea value={config.footerNote ?? ""} onChange={(e) => patch("footerNote", e.target.value)} />
        </div>
        <div className="row">
          <label>备案号（显示在页脚，纯文本）</label>
          <input
            value={config.icpLicense ?? ""}
            onChange={(e) => patch("icpLicense", e.target.value)}
            placeholder="例如：京ICP备xxxxxxxx号"
          />
        </div>
        <div className="row">
          <label>「加入我们」页面标题</label>
          <input value={config.joinPageTitle ?? ""} onChange={(e) => patch("joinPageTitle", e.target.value)} />
        </div>
        <div className="row">
          <label>「加入我们」页面正文</label>
          <textarea value={config.joinPageBody ?? ""} onChange={(e) => patch("joinPageBody", e.target.value)} rows={8} />
        </div>
        <div className="row">
          <label>Discord 链接</label>
          <input value={config.discordUrl ?? ""} onChange={(e) => patch("discordUrl", e.target.value)} />
        </div>
        <div className="row">
          <label>哔哩哔哩链接（首页右上角图标按钮）</label>
          <input value={config.bilibiliUrl ?? ""} onChange={(e) => patch("bilibiliUrl", e.target.value)} />
        </div>
        <div className="row">
          <label>SEO 描述（meta description）</label>
          <textarea value={config.seoDescription ?? ""} onChange={(e) => patch("seoDescription", e.target.value)} />
        </div>
        {err ? <p className="error">{err}</p> : null}
        <button className="btn btn-primary" type="submit" disabled={saving}>
          立即保存
        </button>
      </form>
    </div>
  );
}
