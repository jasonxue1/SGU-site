import { Link } from "react-router-dom";
import { staticSiteData } from "../staticSiteData";

function formatDate(date: string | null) {
  if (!date) return null;
  const [year, month, day] = date.split("-");
  if (!year || !month || !day) return date;
  return `${year}年${Number(month)}月${Number(day)}日`;
}

export function HomePage() {
  const { config, cards, announcements } = staticSiteData;
  const heroImage = config.heroBannerUrl;
  const hasBannerImage = heroImage != null;

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
                style={{ backgroundImage: `url(${JSON.stringify(heroImage)})` }}
              />
            </div>
            <div className="home-banner__scrim" aria-hidden />
          </>
        ) : null}
        <div className="home-banner__glow" aria-hidden />
        <div className="container home-banner__inner">
          <div className="home-banner__content">
            <div
              className="home-banner__quick home-banner__quick--top"
              aria-label="快捷入口"
            >
              <Link
                to="/"
                className="home-banner__chip home-banner__chip--home"
              >
                首页
              </Link>
              <span className="home-banner__chip-sep" aria-hidden>
                ·
              </span>
              <Link
                to="/join"
                className="home-banner__chip home-banner__chip--subtle"
              >
                入服指引
              </Link>
              <Link
                to="/history"
                className="home-banner__chip home-banner__chip--subtle"
              >
                历程
              </Link>
            </div>
            <h1 className="home-banner__title">{config.heroTitle}</h1>
            <p className="home-banner__lead">{config.heroSubtitle}</p>
            <div className="home-banner__actions">
              <Link to="/history" className="home-banner__cta">
                服务器历史
              </Link>
              <Link
                to="/join"
                className="home-banner__cta home-banner__cta--ghost"
              >
                加入我们
              </Link>
              <Link
                to="/members"
                className="home-banner__cta home-banner__cta--ghost"
              >
                成员
              </Link>
              <Link
                to="/open-source"
                className="home-banner__cta home-banner__cta--ghost"
              >
                开源项目
              </Link>
            </div>
          </div>
        </div>
      </section>

      <main className="container main-spacious home-below-banner">
        {(announcements ?? []).length > 0 ? (
          <section
            className="home-announcements"
            aria-labelledby="home-announcements-title"
          >
            <h2
              id="home-announcements-title"
              className="home-announcements__title"
            >
              近期公告
            </h2>
            <ul className="home-announcements__list">
              {(announcements ?? []).map((item) => (
                <li
                  key={`${item.title}-${item.announcedAt}`}
                  className="home-announcements__item"
                >
                  <div className="home-announcements__item-head">
                    <h3 className="home-announcements__item-title">
                      {item.title}
                    </h3>
                    {item.announcedAt ? (
                      <time
                        className="home-announcements__date"
                        dateTime={item.announcedAt}
                      >
                        {formatDate(item.announcedAt)}
                      </time>
                    ) : null}
                  </div>
                  <div className="home-announcements__body">{item.body}</div>
                  {item.linkUrl ? (
                    <a
                      className="home-announcements__link"
                      href={item.linkUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      {item.linkLabel ?? "点我跳转"}
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="grid grid-spacious">
          {cards.map((card, i) => (
            <article
              key={card.title}
              className="card card--lift"
              style={{ ["--stagger" as string]: i }}
            >
              {card.badge ? <span className="badge">{card.badge}</span> : null}
              <h3>{card.title}</h3>
              {card.subtitle ? <p className="sub">{card.subtitle}</p> : null}
              <p className="body">{card.body}</p>
            </article>
          ))}
        </section>
      </main>
    </>
  );
}
