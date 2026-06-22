import { useCallback, useEffect, useState } from "react";
import { KeyRound, Copy, Check, LogOut, MessageSquare } from "lucide-react";
import { api, type Tenant, type Usage } from "../api";
import Documents from "./Documents";
import EmbedSnippet from "./EmbedSnippet";
import UsageCard from "./UsageCard";
import Billing from "./Billing";

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
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-lg shadow-indigo-500/30">
              H
            </span>
            <span className="text-[17px] font-bold tracking-tight text-slate-900">Helpdeck</span>
          </div>
          <div className="flex items-center gap-3">
            {tenant && (
              <span className="hidden rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 sm:block">
                {tenant.name}
              </span>
            )}
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <LogOut className="size-4" /> Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-6 sm:py-10">
        {/* Heading */}
        <div className="mb-7">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your AI assistant's knowledge and embed it on your website.
          </p>
        </div>

        {/* API key banner */}
        <div className="mb-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="flex min-w-0 items-start gap-3.5">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
                <KeyRound className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Your API key</p>
                <code className="tabular mt-0.5 block break-all font-mono text-sm text-slate-800">{apiKey}</code>
                <p className="mt-1 text-xs text-slate-400">
                  Secret — use it to log back in and manage your account. Keep it private; the
                  widget uses a separate publishable key.
                </p>
              </div>
            </div>
            <button
              onClick={copyKey}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition-all hover:bg-slate-700 active:scale-[0.98]"
            >
              {keyCopied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {keyCopied ? "Copied" : "Copy key"}
            </button>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Documents apiKey={apiKey} onChange={loadUsage} />
            <EmbedSnippet widgetKey={tenant?.widget_key ?? ""} name={tenant?.name ?? "Your"} />
          </div>
          <div className="space-y-6">
            <UsageCard usage={usage} />
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                  <MessageSquare className="size-4" />
                </span>
                <h3 className="text-sm font-semibold text-slate-800">Test your assistant</h3>
              </div>
              <p className="mt-2.5 text-xs leading-relaxed text-slate-500">
                After adding documents, open any page with the embed snippet and click the chat
                bubble. The assistant answers only from your knowledge base.
              </p>
            </div>
          </div>
        </div>

        {/* Billing — full width so plan cards have room */}
        <div className="mt-6">
          <Billing apiKey={apiKey} />
        </div>
      </main>
    </div>
  );
}
