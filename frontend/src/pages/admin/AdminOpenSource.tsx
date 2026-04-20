import { FormEvent, useEffect, useState } from "react";
import { apiJson, apiUpload } from "../../api";

type Row = {
  id: string;
  name: string;
  description: string;
  url: string;
  logoUrl: string | null;
  sortOrder: number;
  published: boolean;
};

const empty: Partial<Row> = {
  name: "",
  description: "",
  url: "",
  logoUrl: "",
  sortOrder: 0,
  published: true,
};

export function AdminOpenSource() {
  const [rows, setRows] = useState<Row[]>([]);
  const [draft, setDraft] = useState<Partial<Row>>(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function reload() {
    const data = await apiJson<{ projects: Row[] }>("/api/admin/open-source");
    setRows(data.projects);
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
      name: row.name,
      description: row.description,
      url: row.url,
      logoUrl: row.logoUrl ?? "",
      sortOrder: row.sortOrder,
      published: row.published,
    });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      const payload = {
        name: draft.name ?? "",
        description: draft.description ?? "",
        url: draft.url ?? "",
        logoUrl: draft.logoUrl || null,
        sortOrder: Number(draft.sortOrder ?? 0),
        published: draft.published !== false,
      };
      if (editingId) {
        await apiJson(`/api/admin/open-source/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiJson("/api/admin/open-source", {
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
    if (!confirm("确定删除？")) return;
    setErr(null);
    try {
      await apiJson(`/api/admin/open-source/${id}`, { method: "DELETE" });
      await reload();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "删除失败");
    }
  }

  async function onLogo(file: File | null) {
    if (!file) return;
    const { url } = await apiUpload("/api/admin/upload/logo", file);
    setDraft((d) => ({ ...d, logoUrl: url }));
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>开源项目</h1>
      <p className="muted">前台「开源项目」页面展示已发布条目。</p>

      <div className="panel">
        <button type="button" className="btn btn-primary" onClick={startNew}>
          新建项目
        </button>
        {err ? <p className="error">{err}</p> : null}
        <form onSubmit={(e) => void onSubmit(e)} style={{ marginTop: 12 }}>
          <div className="row">
            <label>项目名称</label>
            <input value={draft.name ?? ""} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} required />
          </div>
          <div className="row">
            <label>简介</label>
            <textarea value={draft.description ?? ""} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} required />
          </div>
          <div className="row">
            <label>项目链接（GitHub 等）</label>
            <input value={draft.url ?? ""} onChange={(e) => setDraft((d) => ({ ...d, url: e.target.value }))} required />
          </div>
          <div className="row">
            <label>Logo URL 或上传</label>
            <input value={draft.logoUrl ?? ""} onChange={(e) => setDraft((d) => ({ ...d, logoUrl: e.target.value }))} />
            <input type="file" accept="image/*" onChange={(e) => void onLogo(e.target.files?.[0] ?? null)} />
          </div>
          <div className="row">
            <label>排序</label>
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
        <h3 style={{ marginTop: 0 }}>项目列表</h3>
        <table className="table">
          <thead>
            <tr>
              <th>排序</th>
              <th>名称</th>
              <th>发布</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.sortOrder}</td>
                <td>{r.name}</td>
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
