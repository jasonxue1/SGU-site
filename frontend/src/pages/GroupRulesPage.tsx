import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { usePublicSite } from "../context/PublicSiteContext";

export function GroupRulesPage() {
  const { config } = usePublicSite();
  const title = config.groupRulesTitle?.trim() || "服规";
  const md =
    config.groupRulesMarkdown?.trim() ||
    "_管理员尚未配置服规内容_";

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
