import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { usePublicSite } from "../context/PublicSiteContext";

export function JoinPage() {
  const { config } = usePublicSite();
  const title = config.joinPageTitle?.trim() || "加入我们";
  const md =
    config.joinPageBody?.trim() ||
    "_请在管理后台「站点与品牌」中编辑本页标题与 **Markdown** 正文。_";

  return (
    <main className="container main-spacious">
      <article className="prose-panel">
        <h1>{title}</h1>
        <div className="markdown-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{md}</ReactMarkdown>
        </div>
      </article>
    </main>
  );
}
