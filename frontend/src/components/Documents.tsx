import { useEffect, useRef, useState } from "react";
import { api, type Document } from "../api";

export default function Documents({
  apiKey,
  onChange,
}: {
  apiKey: string;
  onChange?: () => void;
}) {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    try {
      setDocs(await api.listDocuments(apiKey));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  async function addText(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setBusy(true);
    setError("");
    try {
      await api.addTextDocument(apiKey, title.trim(), content.trim());
      setTitle("");
      setContent("");
      await refresh();
      onChange?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      await api.uploadDocument(apiKey, file);
      await refresh();
      onChange?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      await api.deleteDocument(apiKey, id);
      await refresh();
      onChange?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-700">
          Knowledge base{" "}
          <span className="text-slate-400 font-normal">({docs.length})</span>
        </h3>
        <label className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 cursor-pointer transition">
          {busy ? "Working…" : "Upload .txt / .md / .pdf"}
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.md,.pdf"
            onChange={upload}
            disabled={busy}
            className="hidden"
          />
        </label>
      </div>

      {/* Add text doc */}
      <form onSubmit={addText} className="space-y-2 mb-5">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Document title (e.g. Refund policy)"
          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste your FAQ, policy, or any text the assistant should know…"
          rows={4}
          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none resize-y"
        />
        <button
          disabled={busy || !title.trim() || !content.trim()}
          className="px-4 py-2 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition disabled:opacity-50"
        >
          Add to knowledge base
        </button>
      </form>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      {/* Doc list */}
      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : docs.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-6">
          No documents yet. Add one above to give your assistant knowledge.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {docs.map((d) => (
            <li key={d.id} className="flex items-center justify-between py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{d.title}</p>
                <p className="text-xs text-slate-400">
                  {d.source} · {d.chunk_count} chunks · {d.status}
                </p>
              </div>
              <button
                onClick={() => remove(d.id)}
                disabled={busy}
                className="text-xs text-slate-400 hover:text-red-600 transition px-2 py-1"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
