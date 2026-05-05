import { staticSiteData } from "../staticSiteData";
import { rulesPageHtml } from "../siteHtml";

export function GroupRulesPage() {
  const { config } = staticSiteData;

  return (
    <main className="container main-spacious">
      <article className="prose-panel">
        <h1>{config.groupRulesTitle}</h1>
        <div
          className="markdown-body"
          dangerouslySetInnerHTML={{ __html: rulesPageHtml }}
        />
      </article>
    </main>
  );
}
