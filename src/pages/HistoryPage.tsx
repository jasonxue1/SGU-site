import { staticSiteData } from "../staticSiteData";

function formatDate(date: string | null) {
  if (!date) return "日期待定";
  const [year, month, day] = date.split("-");
  if (!year || !month || !day) return date;
  return `${year}年${Number(month)}月${Number(day)}日`;
}

export function HistoryPage() {
  const { serverHistory } = staticSiteData;

  return (
    <main className="container main-spacious">
      <div className="page-headline-row">
        <h1 className="page-title">服务器历史</h1>
        <span className="page-title-note muted">可能不完整</span>
      </div>
      <p className="page-intro muted">开服以来的重要节点与记录。</p>
      <ul className="timeline">
        {serverHistory.map((event) => (
          <li
            key={`${event.title}-${event.eventDate}`}
            className="timeline-item"
          >
            <div className="timeline-marker" aria-hidden />
            <div className="timeline-card panel-elevated">
              <div className="timeline-date muted">
                {formatDate(event.eventDate) || "日期待定"}
              </div>
              <h2 className="timeline-title">{event.title}</h2>
              {event.imageUrl ? (
                <div className="timeline-media">
                  <img src={event.imageUrl} alt="" loading="lazy" />
                </div>
              ) : null}
              <p className="body timeline-body">{event.body}</p>
            </div>
          </li>
        ))}
      </ul>
      {serverHistory.length === 0 ? <p className="muted">暂无记录</p> : null}
    </main>
  );
}
