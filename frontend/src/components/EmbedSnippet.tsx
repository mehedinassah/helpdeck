import { useState } from "react";
import { API_URL } from "../api";

export default function EmbedSnippet({ apiKey, name }: { apiKey: string; name: string }) {
  const [copied, setCopied] = useState(false);

  const snippet = `<script
  src="${API_URL}/widget/widget.js"
  data-api-key="${apiKey}"
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
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-700">Embed on your website</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Paste this before <code className="bg-slate-100 px-1 rounded">&lt;/body&gt;</code> on
            any page.
          </p>
        </div>
        <button
          onClick={copy}
          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition shrink-0"
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>
      <pre className="text-xs bg-slate-900 text-slate-100 rounded-lg p-4 overflow-x-auto leading-relaxed">
        <code>{snippet}</code>
      </pre>
    </div>
  );
}
