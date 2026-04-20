import { FormEvent, useEffect, useState } from "react";
import { apiJson, apiUpload } from "../../api";

type Row = {
  id: string;
  name: string;
  role: string | null;
  bio: string;
  avatarUrl: string | null;
  linkLabel: string | null;
  linkUrl: string | null;
  sortOrder: number;
  published: boolean;
};

const empty: Partial<Row> = {
  name: "",
  role: "",
  bio: "",
  avatarUrl: "",
  linkLabel: "",
  linkUrl: "",
  sortOrder: 0,
  published: true,
};

export function AdminTeamMembers() {
  const [rows, setRows] = useState<Row[]>([]);
  const [draft, setDraft] = useState<Partial<Row>>(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function reload() {
    const data = await apiJson<{ members: Row[] }>("/api/admin/members");
    setRows(data.members);
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
      role: row.role ?? "",
      bio: row.bio,
      avatarUrl: row.avatarUrl ?? "",
      linkLabel: row.linkLabel ?? "",
      linkUrl: row.linkUrl ?? "",
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
        role: draft.role || null,
        bio: draft.bio ?? "",
        avatarUrl: draft.avatarUrl || null,
        linkLabel: draft.linkLabel || null,
        linkUrl: draft.linkUrl || null,
        sortOrder: Number(draft.sortOrder ?? 0),
        published: draft.published !== false,
      };
      if (editingId) {
        await apiJson(`/api/admin/members/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiJson("/api/admin/members", {
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
      await apiJson(`/api/admin/members/${id}`, { method: "DELETE" });
      await reload();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "删除失败");
    }
  }

  async function onAvatar(file: File | null) {
    if (!file) return;
    const { url } = await apiUpload("/api/admin/upload/logo", file);
    setDraft((d) => ({ ...d, avatarUrl: url }));
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>成员栏</h1>
      <p className="muted">前台「成员」页面展示已发布条目。</p>

      <div className="panel">
        <button type="button" className="btn btn-primary" onClick={startNew}>
          新建成员
        </button>
        {err ? <p className="error">{err}</p> : null}
        <form onSubmit={(e) => void onSubmit(e)} style={{ marginTop: 12 }}>
          <div className="row">
            <label>名称</label>
            <input value={draft.name ?? ""} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} required />
          </div>
          <div className="row">
            <label>身份 / 职位（可选）</label>
            <input value={draft.role ?? ""} onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value }))} />
          </div>
          <div className="row">
            <label>介绍</label>
            <textarea value={draft.bio ?? ""} onChange={(e) => setDraft((d) => ({ ...d, bio: e.target.value }))} required />
          </div>
          <div className="row">
            <label>头像 URL 或上传</label>
            <input value={draft.avatarUrl ?? ""} onChange={(e) => setDraft((d) => ({ ...d, avatarUrl: e.target.value }))} />
            <input type="file" accept="image/*" onChange={(e) => void onAvatar(e.target.files?.[0] ?? null)} />
          </div>
          <div className="row">
            <label>链接文字</label>
            <input value={draft.linkLabel ?? ""} onChange={(e) => setDraft((d) => ({ ...d, linkLabel: e.target.value }))} />
          </div>
          <div className="row">
            <label>链接 URL</label>
            <input value={draft.linkUrl ?? ""} onChange={(e) => setDraft((d) => ({ ...d, linkUrl: e.target.value }))} />
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
        <h3 style={{ marginTop: 0 }}>成员列表</h3>
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
