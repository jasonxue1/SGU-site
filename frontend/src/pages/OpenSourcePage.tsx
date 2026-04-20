import { usePublicSite } from "../context/PublicSiteContext";
import { publicImageSrc } from "../lib/mediaUrl";
import { isSafeHttpUrl } from "../lib/safeLink";

export function OpenSourcePage() {
  const { openSourceProjects: projects } = usePublicSite();

  return (
    <main className="container main-spacious">
      <h1 className="page-title">开源项目</h1>
      <p className="page-intro muted">相关开源仓库与资源。</p>
      <section className="oss-list">
        {projects.map((p) => {
          const ossLogo = publicImageSrc(p.logoUrl);
          const projectUrl = isSafeHttpUrl(p.url) ? p.url : null;
          return (
            <article key={p.id} className="oss-item panel-elevated">
              <div className="oss-main">
                {ossLogo ? <img className="oss-logo" src={ossLogo} alt="" /> : <div className="oss-logo oss-logo--ph" />}
                <div>
                  <h2 className="oss-name">
                    {projectUrl ? (
                      <a href={projectUrl} target="_blank" rel="noreferrer noopener">
                        {p.name}
                      </a>
                    ) : (
                      <span>{p.name}</span>
                    )}
                  </h2>
                  <p className="body oss-desc">{p.description}</p>
                </div>
              </div>
            </article>
          );
        })}
      </section>
      {projects.length === 0 ? <p className="muted">暂无项目，请在后台「开源项目」中添加。</p> : null}
    </main>
  );
}
