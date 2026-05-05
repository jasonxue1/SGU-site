import { staticSiteData } from "../staticSiteData";
import { joinPageHtml } from "../siteHtml";

export function JoinPage() {
  const { config } = staticSiteData;

  return (
    <main className="container main-spacious">
      <article className="prose-panel">
        <h1>{config.joinPageTitle}</h1>
        <div
          className="markdown-body"
          dangerouslySetInnerHTML={{ __html: joinPageHtml }}
        />
      </article>
    </main>
  );
}
