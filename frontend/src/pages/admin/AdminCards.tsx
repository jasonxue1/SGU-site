import { FormEvent, useEffect, useState } from "react";
import { apiJson, apiUpload } from "../../api";
import type { PublicCard } from "../../types";

type CardRow = PublicCard & { published?: boolean };

const empty: Partial<CardRow> = {
  title: "",
  subtitle: "",
  body: "",
  imageUrl: "",
  linkLabel: "",
  linkUrl: "",
  badge: "",
  sortOrder: 0,
  published: true,
};

export function AdminCards() {
  const [cards, setCards] = useState<CardRow[]>([]);
  const [draft, setDraft] = useState<Partial<CardRow>>(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function reload() {
    const data = await apiJson<{ cards: CardRow[] }>("/api/admin/cards");
    setCards(data.cards);
  }

  useEffect(() => {
    void reload().catch((e) => setErr(e instanceof Error ? e.message : "加载失败"));
  }, []);

  function startNew() {
    setEditingId(null);
    setDraft({ ...empty, sortOrder: cards.length });
  }

  function startEdit(c: CardRow) {
    setEditingId(c.id);
    setDraft({
      title: c.title,
      subtitle: c.subtitle ?? "",
      body: c.body,
      imageUrl: c.imageUrl ?? "",
      linkLabel: c.linkLabel ?? "",
      linkUrl: c.linkUrl ?? "",
      badge: c.badge ?? "",
      sortOrder: c.sortOrder,
      published: c.published ?? true,
    });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      const payload = {
        title: draft.title ?? "",
        subtitle: draft.subtitle || null,
        body: draft.body ?? "",
        imageUrl: draft.imageUrl || null,
        linkLabel: draft.linkLabel || null,
        linkUrl: draft.linkUrl || null,
        badge: draft.badge || null,
        sortOrder: Number(draft.sortOrder ?? 0),
        published: draft.published !== false,
      };
      if (editingId) {
        await apiJson(`/api/admin/cards/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiJson("/api/admin/cards", {
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
    if (!confirm("确定删除此卡片？")) return;
    setErr(null);
    try {
      await apiJson(`/api/admin/cards/${id}`, { method: "DELETE" });
      await reload();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "删除失败");
    }
  }

  async function uploadImage(file: File | null) {
    if (!file) return;
    const { url } = await apiUpload("/api/admin/upload/logo", file);
    setDraft((d) => ({ ...d, imageUrl: url }));
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>内容卡片</h1>
      <p className="muted">首页展示的卡片全部来自数据库，可控制排序与是否发布。</p>

      <div className="panel">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="btn btn-primary" onClick={startNew}>
            新建卡片
          </button>
        </div>
        {err ? <p className="error">{err}</p> : null}
        <form onSubmit={(e) => void onSubmit(e)} style={{ marginTop: 12 }}>
          <div className="row">
            <label>标题</label>
            <input value={draft.title ?? ""} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} required />
          </div>
          <div className="row">
            <label>副标题</label>
            <input value={draft.subtitle ?? ""} onChange={(e) => setDraft((d) => ({ ...d, subtitle: e.target.value }))} />
          </div>
          <div className="row">
            <label>正文</label>
            <textarea value={draft.body ?? ""} onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))} required />
          </div>
          <div className="row">
            <label>角标（如：特色）</label>
            <input value={draft.badge ?? ""} onChange={(e) => setDraft((d) => ({ ...d, badge: e.target.value }))} />
          </div>
          <div className="row">
            <label>图片 URL 或上传</label>
            <input value={draft.imageUrl ?? ""} onChange={(e) => setDraft((d) => ({ ...d, imageUrl: e.target.value }))} />
            <input type="file" accept="image/*" onChange={(e) => void uploadImage(e.target.files?.[0] ?? null)} />
          </div>
          <div className="row">
            <label>按钮文字</label>
            <input value={draft.linkLabel ?? ""} onChange={(e) => setDraft((d) => ({ ...d, linkLabel: e.target.value }))} />
          </div>
          <div className="row">
            <label>按钮链接</label>
            <input value={draft.linkUrl ?? ""} onChange={(e) => setDraft((d) => ({ ...d, linkUrl: e.target.value }))} />
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
              发布到首页
            </label>
          </div>
          <button className="btn btn-primary" type="submit">
            {editingId ? "保存修改" : "创建卡片"}
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
              取消编辑
            </button>
          ) : null}
        </form>
      </div>

      <div className="panel">
        <h3 style={{ marginTop: 0 }}>已有卡片</h3>
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>排序</th>
                <th>标题</th>
                <th>发布</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {cards.map((c) => (
                <tr key={c.id}>
                  <td>{c.sortOrder}</td>
                  <td>{c.title}</td>
                  <td>{c.published === false ? "否" : "是"}</td>
                  <td>
                    <button type="button" className="btn btn-ghost" onClick={() => startEdit(c)}>
                      编辑
                    </button>{" "}
                    <button type="button" className="btn btn-ghost" onClick={() => void remove(c.id)}>
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
