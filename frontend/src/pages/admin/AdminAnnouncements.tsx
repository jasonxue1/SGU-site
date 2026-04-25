import { FormEvent, useEffect, useRef, useState } from "react";
import { apiJson, apiUpload } from "../../api";

type Row = {
  id: string;
  title: string;
  body: string;
  linkLabel: string | null;
  linkUrl: string | null;
  announcedAt: string | null;
  sortOrder: number;
  published: boolean;
};

const empty: Partial<Row> = {
  title: "",
  body: "",
  linkLabel: "",
  linkUrl: "",
  announcedAt: null,
  sortOrder: 0,
  published: true,
};

function fileStem(name: string): string {
  const t = name.replace(/^\s+|\s+$/g, "");
  if (!t) return "图片";
  return t.replace(/\.[a-z0-9]{1,6}$/i, "") || "图片";
}

export function AdminAnnouncements() {
  const [rows, setRows] = useState<Row[]>([]);
  const [draft, setDraft] = useState<Partial<Row>>(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [uploadBusy, setUploadBusy] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);

  async function reload() {
    const data = await apiJson<{ announcements: Row[] }>("/api/admin/announcements");
    setRows(data.announcements);
  }

  useEffect(() => {
    void reload().catch((e) => setErr(e instanceof Error ? e.message : "加载失败"));
  }, []);

  function startNew() {
    setEditingId(null);
    setDraft({ ...empty, sortOrder: rows.length });
  }

  function startEdit(row: Row) {
    setEditingId(row.id);
    setDraft({
      title: row.title,
      body: row.body,
      linkLabel: row.linkLabel ?? "",
      linkUrl: row.linkUrl ?? "",
      announcedAt: row.announcedAt,
      sortOrder: row.sortOrder,
      published: row.published,
    });
  }

  async function onAnnouncementImages(files: FileList | null) {
    if (!files?.length) return;
    setErr(null);
    setUploadBusy(true);
    try {
      const chunks: string[] = [];
      for (const file of Array.from(files)) {
        const { url } = await apiUpload("/api/admin/upload/announcement", file);
        const alt = fileStem(file.name);
        chunks.push(`![${alt}](${url})`);
      }
      const block = `${chunks.join("\n\n")}\n\n`;
      setDraft((d) => {
        const b = d.body ?? "";
        const ta = bodyRef.current;
        if (ta && document.activeElement === ta) {
          const s = ta.selectionStart;
          const e = ta.selectionEnd;
          const next = b.slice(0, s) + block + b.slice(e);
          const pos = s + block.length;
          requestAnimationFrame(() => {
            if (!bodyRef.current) return;
            bodyRef.current.focus();
            bodyRef.current.setSelectionRange(pos, pos);
          });
          return { ...d, body: next };
        }
        const sep = b.trim() ? "\n\n" : "";
        return { ...d, body: b + sep + block };
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "上传失败");
    } finally {
      setUploadBusy(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      const payload = {
        title: draft.title ?? "",
        body: draft.body ?? "",
        linkLabel: draft.linkLabel?.trim() ? draft.linkLabel.trim() : null,
        linkUrl: draft.linkUrl?.trim() ? draft.linkUrl.trim() : null,
        announcedAt: draft.announcedAt ? draft.announcedAt.slice(0, 10) + "T00:00:00.000Z" : null,
        sortOrder: Number(draft.sortOrder ?? 0),
        published: draft.published !== false,
      };
      if (editingId) {
        await apiJson(`/api/admin/announcements/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiJson("/api/admin/announcements", {
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

  async function remove(id: string) {
    if (!confirm("确定删除此条公告？")) return;
    setErr(null);
    try {
      await apiJson(`/api/admin/announcements/${id}`, { method: "DELETE" });
      await reload();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "删除失败");
    }
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>近期公告</h1>
      <p className="muted">
        首页「近期公告」展示已发布条目。正文为 <strong>Markdown</strong>，支持多图：上传会在光标处插入{" "}
        <code>![]()</code>（未聚焦正文则追加在文末）。图片会<strong>统一压到长边不超过 900px</strong> 并转
        WebP；多帧动图不处理以保留动画。
      </p>

      <div className="panel">
        <button type="button" className="btn btn-primary" onClick={startNew}>
          新建公告
        </button>
        {err ? <p className="error">{err}</p> : null}
        <form onSubmit={(e) => void onSubmit(e)} style={{ marginTop: 12 }}>
          <div className="row">
            <label>标题</label>
            <input
              value={draft.title ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              required
            />
          </div>
          <div className="row">
            <label>正文（Markdown）</label>
            <div className="announcement-md-wrap">
              <div className="announcement-md-toolbar">
                <label
                  className="btn btn-ghost btn--upload"
                  style={{
                    display: "inline-block",
                    opacity: uploadBusy ? 0.7 : 1,
                    pointerEvents: uploadBusy ? "none" : "auto",
                  }}
                >
                  {uploadBusy ? "上传中…" : "多图上传（插入正文）"}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={uploadBusy}
                    onChange={(e) => {
                      void onAnnouncementImages(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </label>
                <span className="muted" style={{ fontSize: 13 }}>
                  单张 ≤5MB；缩放大图自动处理。也可手写 <code>![](/uploads/public/…)</code>
                </span>
              </div>
              <textarea
                ref={bodyRef}
                value={draft.body ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
                rows={14}
                required
                placeholder="支持 **粗体**、列表、`代码`、图片 ![说明](/uploads/public/…)"
                spellCheck={false}
              />
            </div>
          </div>
          <div className="row">
            <label>公告日期（可选，前台显示）</label>
            <input
              type="date"
              value={draft.announcedAt ? draft.announcedAt.slice(0, 10) : ""}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  announcedAt: e.target.value ? `${e.target.value}T00:00:00.000Z` : null,
                }))
              }
            />
          </div>
          <div className="row">
            <label>链接文字（可选）</label>
            <input
              value={draft.linkLabel ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, linkLabel: e.target.value }))}
            />
          </div>
          <div className="row">
            <label>链接 URL（可选，需 http:// 或 https://）</label>
            <input
              value={draft.linkUrl ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, linkUrl: e.target.value }))}
              placeholder="https://"
            />
          </div>
          <div className="row">
            <label>排序（数字越小越靠前）</label>
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
            {editingId ? "保存" : "创建"}
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
        <h3 style={{ marginTop: 0 }}>公告列表</h3>
        <table className="table">
          <thead>
            <tr>
              <th>排序</th>
              <th>日期</th>
              <th>标题</th>
              <th>发布</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.sortOrder}</td>
                <td>{r.announcedAt ? r.announcedAt.slice(0, 10) : "—"}</td>
                <td>{r.title}</td>
                <td>{r.published ? "是" : "否"}</td>
                <td>
                  <button type="button" className="btn btn-ghost" onClick={() => startEdit(r)}>
                    编辑
                  </button>{" "}
                  <button type="button" className="btn btn-ghost" onClick={() => void remove(r.id)}>
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
