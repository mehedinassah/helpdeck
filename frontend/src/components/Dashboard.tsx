import { useCallback, useEffect, useState } from "react";
import { api, type Tenant, type Usage } from "../api";
import Documents from "./Documents";
import EmbedSnippet from "./EmbedSnippet";
import UsageCard from "./UsageCard";

export default function Dashboard({
  apiKey,
  onLogout,
}: {
  apiKey: string;
  onLogout: () => void;
}) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [keyCopied, setKeyCopied] = useState(false);

  const loadUsage = useCallback(() => {
    api.usage(apiKey).then(setUsage).catch(() => {});
  }, [apiKey]);

  useEffect(() => {
    api.me(apiKey).then(setTenant).catch(() => {});
    loadUsage();
  }, [apiKey, loadUsage]);

  function copyKey() {
    navigator.clipboard.writeText(apiKey);
    setKeyCopied(true);
    setTimeout(() => setKeyCopied(false), 1800);
  }

  return (
    <div className="min-h-full">
      {/* Top bar */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              H
            </div>
            <span className="font-bold text-slate-800">Helpdeck</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500 hidden sm:block">
              {tenant?.name ?? "…"}
            </span>
            <button
              onClick={onLogout}
              className="text-sm text-slate-500 hover:text-slate-800 transition"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage your AI assistant's knowledge and embed it on your site.
          </p>
        </div>

        {/* API key banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-amber-800">Your API key</p>
            <code className="text-sm text-amber-900 break-all">{apiKey}</code>
            <p className="text-xs text-amber-700 mt-1">
              Save this — it's how you log back in and authenticate the widget.
            </p>
          </div>
          <button
            onClick={copyKey}
            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition shrink-0"
          >
            {keyCopied ? "Copied ✓" : "Copy key"}
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Documents apiKey={apiKey} onChange={loadUsage} />
            <EmbedSnippet apiKey={apiKey} name={tenant?.name ?? "Your"} />
          </div>
          <div className="space-y-6">
            <UsageCard usage={usage} />
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Test your assistant</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                After adding documents, open any page with the embed snippet and click the chat
                bubble. The assistant answers only from your knowledge base.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
