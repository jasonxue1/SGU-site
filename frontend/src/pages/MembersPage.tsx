import { usePublicSite } from "../context/PublicSiteContext";
import { publicImageSrc } from "../lib/mediaUrl";
import { isSafeHttpUrl } from "../lib/safeLink";

export function MembersPage() {
  const { members } = usePublicSite();

  return (
    <main className="container main-spacious">
      <h1 className="page-title">服务器成员</h1>
      <p className="page-intro muted">服务器成员与贡献者</p>
      <section className="grid grid-spacious members-grid">
        {members.map((m) => {
          const avatarSrc = publicImageSrc(m.avatarUrl);
          const memberLink = m.linkUrl && isSafeHttpUrl(m.linkUrl) ? m.linkUrl : null;
          return (
            <article key={m.id} className="card member-card">
              {avatarSrc ? (
                <img className="member-avatar" src={avatarSrc} alt="" />
              ) : (
                <div className="member-avatar member-avatar--ph" aria-hidden />
              )}
              <h3>{m.name}</h3>
              {m.role ? <p className="sub">{m.role}</p> : null}
              <p className="body">{m.bio}</p>
              {memberLink ? (
                <a href={memberLink} target="_blank" rel="noreferrer noopener">
                  {m.linkLabel ?? "链接"}
                </a>
              ) : null}
            </article>
          );
        })}
      </section>
      {members.length === 0 ? <p className="muted">暂无公开成员</p> : null}
    </main>
  );
}
