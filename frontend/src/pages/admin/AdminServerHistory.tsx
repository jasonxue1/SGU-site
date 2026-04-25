import { FormEvent, useEffect, useState } from "react";
import { apiJson, apiUpload } from "../../api";
import { publicImageSrc } from "../../lib/mediaUrl";

type HistoryRow = {
  id: string;
  title: string;
  body: string;
  imageUrl: string | null;
  eventDate: string | null;
  sortOrder: number;
  published: boolean;
};

const empty: Partial<HistoryRow> = {
  title: "",
  body: "",
  imageUrl: "",
  eventDate: null,
  sortOrder: 0,
  published: true,
};

export function AdminServerHistory() {
  const [events, setEvents] = useState<HistoryRow[]>([]);
  const [draft, setDraft] = useState<Partial<HistoryRow>>(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function reload() {
    const data = await apiJson<{ events: HistoryRow[] }>("/api/admin/server-history");
    setEvents(data.events);
  }

  useEffect(() => {
    void reload().catch((e) => setErr(e instanceof Error ? e.message : "加载失败"));
  }, []);

  function startNew() {
    setEditingId(null);
    setDraft({ ...empty, sortOrder: events.length });
  }

  function startEdit(row: HistoryRow) {
    setEditingId(row.id);
    setDraft({
      title: row.title,
      body: row.body,
      imageUrl: row.imageUrl ?? "",
      eventDate: row.eventDate,
      sortOrder: row.sortOrder,
      published: row.published,
    });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      const payload = {
        title: draft.title ?? "",
        body: draft.body ?? "",
        imageUrl: draft.imageUrl?.trim() ? draft.imageUrl.trim() : null,
        eventDate: draft.eventDate ? draft.eventDate.slice(0, 10) : null,
        sortOrder: Number(draft.sortOrder ?? 0),
        published: draft.published !== false,
      };
      if (editingId) {
        await apiJson(`/api/admin/server-history/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiJson("/api/admin/server-history", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      setDraft(empty);
      setEditingId(null);
      await reload();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "保存失败");
    }
  }

  async function uploadImage(file: File | null) {
    if (!file) return;
    setErr(null);
    try {
      const { url } = await apiUpload("/api/admin/server-history/upload", file);
      setDraft((d) => ({ ...d, imageUrl: url }));
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "上传失败");
    }
  }

  async function remove(id: string) {
    if (!confirm("确定删除此条记录？")) return;
    setErr(null);
    try {
      await apiJson(`/api/admin/server-history/${id}`, { method: "DELETE" });
      await reload();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "删除失败");
    }
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>服务器历史</h1>
      <p className="muted">按时间线展示的记录；未填日期则前台显示「日期待定」。每条可配一张配图（可选）。</p>

      <div className="panel">
        <button type="button" className="btn btn-primary" onClick={startNew}>
          新建记录
        </button>
        {err ? <p className="error">{err}</p> : null}
        <form onSubmit={(e) => void onSubmit(e)} style={{ marginTop: 12 }}>
          <div className="row">
            <label>标题</label>
            <input value={draft.title ?? ""} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} required />
          </div>
          <div className="row">
            <label>日期（可选）</label>
            <input
              type="date"
              value={draft.eventDate ? draft.eventDate.slice(0, 10) : ""}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  eventDate: e.target.value ? `${e.target.value}T00:00:00.000Z` : null,
                }))
              }
            />
          </div>
          <div className="row">
            <label>配图 URL（可选，或上传）</label>
            <input
              value={draft.imageUrl ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, imageUrl: e.target.value }))}
              placeholder="/uploads/public/… 或外链"
            />
            <input type="file" accept="image/*" onChange={(e) => void uploadImage(e.target.files?.[0] ?? null)} />
            {draft.imageUrl?.trim() ? (
              <img
                src={publicImageSrc(draft.imageUrl.trim()) ?? draft.imageUrl}
                alt=""
                style={{ maxWidth: 280, marginTop: 8, borderRadius: 12 }}
              />
            ) : null}
          </div>
          <div className="row">
            <label>正文</label>
            <textarea value={draft.body ?? ""} onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))} required />
          </div>
          <div className="row">
            <label>排序（越小越靠前）</label>
            <input
              type="number"
              value={draft.sortOrder ?? 0}
              onChange={(e) => setDraft((d) => ({ ...d, sortOrder: Number(e.target.value) }))}
            />
          </div>
          <div className="row">
            <label>
              <input
                type="checkbox"
                checked={draft.published !== false}
                onChange={(e) => setDraft((d) => ({ ...d, published: e.target.checked }))}
              />{" "}
              发布
            </label>
          </div>
          <button className="btn btn-primary" type="submit">
            {editingId ? "保存修改" : "创建"}
          </button>
          {editingId ? (
            <button
              type="button"
              className="btn"
              style={{ marginLeft: 8 }}
              onClick={() => {
                setEditingId(null);
                setDraft(empty);
              }}
            >
              取消
            </button>
          ) : null}
        </form>
      </div>

      <div className="panel">
        <h3 style={{ marginTop: 0 }}>已有记录</h3>
        <table className="table">
          <thead>
            <tr>
              <th>排序</th>
              <th>日期</th>
              <th>图</th>
              <th>标题</th>
              <th>发布</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {events.map((ev) => (
              <tr key={ev.id}>
                <td>{ev.sortOrder}</td>
                <td>{ev.eventDate ? ev.eventDate.slice(0, 10) : "—"}</td>
                <td>
                  {ev.imageUrl ? (
                    <img
                      src={publicImageSrc(ev.imageUrl) ?? ev.imageUrl}
                      alt=""
                      style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 8 }}
                    />
                  ) : (
                    "—"
                  )}
                </td>
                <td>{ev.title}</td>
                <td>{ev.published ? "是" : "否"}</td>
                <td>
                  <button type="button" className="btn btn-ghost" onClick={() => startEdit(ev)}>
                    编辑
                  </button>{" "}
                  <button type="button" className="btn btn-ghost" onClick={() => void remove(ev.id)}>
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
