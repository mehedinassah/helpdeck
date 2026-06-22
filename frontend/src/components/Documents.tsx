import { useEffect, useRef, useState } from "react";
import { FileText, Upload, Trash2, Plus, BookOpen } from "lucide-react";
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

  const inputCls =
    "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
            <BookOpen className="size-4.5" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Knowledge base</h3>
            <p className="text-xs text-slate-400">{docs.length} document{docs.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50">
          <Upload className="size-4" />
          {busy ? "Working…" : "Upload file"}
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
      <form onSubmit={addText} className="space-y-2.5">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Document title (e.g. Refund policy)"
          className={inputCls}
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste your FAQ, policy, or any text the assistant should know…"
          rows={4}
          className={`${inputCls} resize-y`}
        />
        <button
          disabled={busy || !title.trim() || !content.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50"
        >
          <Plus className="size-4" /> Add to knowledge base
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {/* List */}
      <div className="mt-5 border-t border-slate-100 pt-4">
        {loading ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : docs.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <span className="grid size-10 place-items-center rounded-xl bg-slate-50 text-slate-300">
              <FileText className="size-5" />
            </span>
            <p className="text-sm text-slate-400">No documents yet. Add one above to give your assistant knowledge.</p>
          </div>
        ) : (
          <ul className="space-y-1">
            {docs.map((d) => (
              <li
                key={d.id}
                className="group flex items-center justify-between gap-3 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-slate-50"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500">
                    <FileText className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{d.title}</p>
                    <p className="text-xs text-slate-400">
                      {d.source} · {d.chunk_count} chunk{d.chunk_count !== 1 ? "s" : ""} · {d.status}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => remove(d.id)}
                  disabled={busy}
                  aria-label={`Delete ${d.title}`}
                  className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-300 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50 sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
