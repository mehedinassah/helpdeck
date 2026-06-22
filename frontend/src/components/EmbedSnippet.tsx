import { useState } from "react";
import { Code2, Copy, Check } from "lucide-react";
import { API_URL } from "../api";

export default function EmbedSnippet({ widgetKey, name }: { widgetKey: string; name: string }) {
  const [copied, setCopied] = useState(false);

  const snippet = `<script
  src="${API_URL}/widget/widget.js"
  data-widget-key="${widgetKey || "wk_…"}"
  data-api-url="${API_URL}"
  data-title="${name} Support"
  data-accent="#4f46e5">
</script>`;

  function copy() {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-900 text-white">
            <Code2 className="size-4.5" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Embed on your website</h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Paste this before <code className="rounded bg-slate-100 px-1 py-0.5 text-slate-600">&lt;/body&gt;</code> on any page.
            </p>
          </div>
        </div>
        <button
          onClick={copy}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-indigo-700 active:scale-[0.98]"
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900 p-4 text-xs leading-relaxed text-slate-100">
        <code>{snippet}</code>
      </pre>
    </div>
  );
}
