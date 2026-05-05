import { staticSiteData } from "../staticSiteData";

export function MembersPage() {
  const { members } = staticSiteData;

  return (
    <main className="container main-spacious">
      <h1 className="page-title">服务器成员</h1>
      <p className="page-intro muted">服务器成员与贡献者</p>
      <section className="grid grid-spacious members-grid">
        {members.map((member) => (
          <article key={member.name} className="card member-card">
            {member.avatarUrl ? (
              <img className="member-avatar" src={member.avatarUrl} alt="" />
            ) : (
              <div className="member-avatar member-avatar--ph" aria-hidden />
            )}
            <h3>{member.name}</h3>
            {member.role ? <p className="sub">{member.role}</p> : null}
            <p className="body">{member.bio}</p>
            {member.linkUrl ? (
              <a
                href={member.linkUrl}
                target="_blank"
                rel="noreferrer noopener"
              >
                {member.linkLabel ?? "链接"}
              </a>
            ) : null}
          </article>
        ))}
      </section>
      {members.length === 0 ? <p className="muted">暂无公开成员</p> : null}
    </main>
  );
}
