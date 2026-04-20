import { usePublicSite } from "../context/PublicSiteContext";

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" });
}

export function HistoryPage() {
  const { serverHistory: events } = usePublicSite();

  return (
    <main className="container main-spacious">
      <div className="page-headline-row">
        <h1 className="page-title">服务器历史</h1>
        <span className="page-title-note muted">可能不完整</span>
      </div>
      <p className="page-intro muted">开服以来的重要节点与记录。</p>
      <ul className="timeline">
        {events.map((e) => (
          <li key={e.id} className="timeline-item">
            <div className="timeline-marker" aria-hidden />
            <div className="timeline-card panel-elevated">
              <div className="timeline-date muted">{formatDate(e.eventDate) || "日期待定"}</div>
              <h2 className="timeline-title">{e.title}</h2>
              <p className="body timeline-body">{e.body}</p>
            </div>
          </li>
        ))}
      </ul>
      {events.length === 0 ? <p className="muted">暂无记录，请在后台「服务器历史」中添加。</p> : null}
    </main>
  );
}
