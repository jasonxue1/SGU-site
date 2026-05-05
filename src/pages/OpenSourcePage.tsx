import { staticSiteData } from "../staticSiteData";

export function OpenSourcePage() {
  const { openSourceProjects } = staticSiteData;

  return (
    <main className="container main-spacious">
      <h1 className="page-title">开源项目</h1>
      <p className="page-intro muted">相关开源仓库与资源。</p>
      <section className="oss-list">
        {openSourceProjects.map((project) => (
          <article key={project.name} className="oss-item panel-elevated">
            <div className="oss-main">
              {project.logoUrl ? (
                <img className="oss-logo" src={project.logoUrl} alt="" />
              ) : (
                <div className="oss-logo oss-logo--ph" />
              )}
              <div>
                <h2 className="oss-name">
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    {project.name}
                  </a>
                </h2>
                <p className="body oss-desc">{project.description}</p>
              </div>
            </div>
          </article>
        ))}
      </section>
      {openSourceProjects.length === 0 ? (
        <p className="muted">暂无项目</p>
      ) : null}
    </main>
  );
}
