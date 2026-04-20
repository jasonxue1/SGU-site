import { usePublicSite } from "../context/PublicSiteContext";

export function JoinPage() {
  const { config } = usePublicSite();
  const title = config.joinPageTitle?.trim() || "加入我们";
  const body = config.joinPageBody?.trim() || "请在管理后台「站点与品牌」中编辑本页标题与正文。";

  return (
    <main className="container main-spacious">
      <article className="prose-panel">
        <h1>{title}</h1>
        <div className="prose-body">{body}</div>
      </article>
    </main>
  );
}
