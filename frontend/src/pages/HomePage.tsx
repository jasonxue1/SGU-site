import { useMemo } from "react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { usePublicSite } from "../context/PublicSiteContext";
import { collectHeroBannerSlides } from "../lib/heroBanner";
import { publicImageSrc } from "../lib/mediaUrl";
import { isSafeHttpUrl } from "../lib/safeLink";

function formatAnnouncementDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" });
}

export function HomePage() {
  const { config, cards, announcements: annRaw } = usePublicSite();
  const announcements = annRaw ?? [];
  const bannerConfigKey = useMemo(
    () => JSON.stringify([config.heroBannerUrl, config.heroBannerUrls]),
    [config.heroBannerUrl, config.heroBannerUrls],
  );
  const bannerImage = useMemo(() => {
    const slides = collectHeroBannerSlides(config);
    return slides[0] ?? null;
  }, [config, bannerConfigKey]);
  const hasBannerImage = bannerImage != null;

  return (
    <>
      <section
        className={`home-banner${hasBannerImage ? " home-banner--has-image" : ""}`}
        aria-label="站点首屏"
      >
        {hasBannerImage ? (
          <>
            <div className="home-banner__photo-wrap" aria-hidden>
              <div
                className="home-banner__photo"
                style={{ backgroundImage: `url(${JSON.stringify(bannerImage)})` }}
              />
            </div>
            <div className="home-banner__scrim" aria-hidden />
          </>
        ) : null}
        <div className="home-banner__glow" aria-hidden />
        <div className="container home-banner__inner">
          <div className="home-banner__content">
            <div className="home-banner__quick home-banner__quick--top" aria-label="快捷入口">
              <Link to="/" className="home-banner__chip home-banner__chip--home">
                首页
              </Link>
              <span className="home-banner__chip-sep" aria-hidden>
                ·
              </span>
              <Link to="/join" className="home-banner__chip home-banner__chip--subtle">
                入服指引
              </Link>
              <Link to="/history" className="home-banner__chip home-banner__chip--subtle">
                历程
              </Link>
            </div>
            <h1 className="home-banner__title">{config.heroTitle ?? "欢迎"}</h1>
            <p className="home-banner__lead">{config.heroSubtitle ?? ""}</p>
            <div className="home-banner__actions">
              <Link to="/history" className="home-banner__cta">
                服务器历史
              </Link>
              <Link to="/join" className="home-banner__cta home-banner__cta--ghost">
                加入我们
              </Link>
              <Link to="/members" className="home-banner__cta home-banner__cta--ghost">
                成员
              </Link>
              <Link to="/open-source" className="home-banner__cta home-banner__cta--ghost">
                开源项目
              </Link>
            </div>
          </div>
        </div>
      </section>

      <main className="container main-spacious home-below-banner">
        {announcements.length > 0 ? (
          <section className="home-announcements" aria-labelledby="home-announcements-title">
            <h2 id="home-announcements-title" className="home-announcements__title">
              近期公告
            </h2>
            <ul className="home-announcements__list">
              {announcements.map((a) => {
                const ext = a.linkUrl && isSafeHttpUrl(a.linkUrl) ? a.linkUrl : null;
                const dateLine = formatAnnouncementDate(a.announcedAt);
                return (
                  <li key={a.id} className="home-announcements__item">
                    <div className="home-announcements__item-head">
                      <h3 className="home-announcements__item-title">{a.title}</h3>
                      {dateLine ? (
                        <time className="home-announcements__date" dateTime={a.announcedAt ?? undefined}>
                          {dateLine}
                        </time>
                      ) : null}
                    </div>
                    <div className="home-announcements__body markdown-body">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          img: (props) => {
                            const raw = typeof props.src === "string" ? props.src : "";
                            const src = publicImageSrc(raw);
                            if (!src) return null;
                            return <img src={src} alt={typeof props.alt === "string" ? props.alt : ""} />;
                          },
                        }}
                      >
                        {a.body}
                      </ReactMarkdown>
                    </div>
                    {ext ? (
                      <a
                        className="home-announcements__link"
                        href={ext}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        {a.linkLabel?.trim() || "相关链接"}
                      </a>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
        <section className="grid grid-spacious">
          {cards.map((c, i) => {
            const cardImg = publicImageSrc(c.imageUrl);
            const cardLink = c.linkUrl && isSafeHttpUrl(c.linkUrl) ? c.linkUrl : null;
            return (
              <article
                key={c.id}
                className="card card--lift"
                style={{ "--stagger": i } as React.CSSProperties}
              >
                {c.badge ? <span className="badge">{c.badge}</span> : null}
                {cardImg ? <img src={cardImg} alt="" /> : null}
                <h3>{c.title}</h3>
                {c.subtitle ? <p className="sub">{c.subtitle}</p> : null}
                <p className="body">{c.body}</p>
                {cardLink ? (
                  <a href={cardLink} target="_blank" rel="noreferrer noopener">
                    {c.linkLabel ?? "了解更多"}
                  </a>
                ) : null}
              </article>
            );
          })}
        </section>

        <section className="home-litematic" aria-labelledby="home-litematic-title">
          <div className="home-litematic__card">
            <div className="home-litematic__text">
              <h2 id="home-litematic-title" className="home-litematic__title">
                Litematic Manager
              </h2>
              <p className="home-litematic__lead">
                在线管理、浏览与分享 Litematica 投影文件，方便生电与建筑协作。
              </p>
            </div>
            <a
              className="home-litematic__btn"
              href="https://litematic.sgu-server.xin/"
              target="_blank"
              rel="noopener noreferrer"
            >
              前往 Litematic 管理站
            </a>
          </div>
        </section>
      </main>
    </>
  );
}
