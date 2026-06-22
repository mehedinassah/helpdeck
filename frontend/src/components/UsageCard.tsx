import { Activity } from "lucide-react";
import type { Usage } from "../api";

export default function UsageCard({ usage }: { usage: Usage | null }) {
  if (!usage) {
    return <div className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-white shadow-sm" />;
  }
  const pct = Math.min(100, Math.round((usage.messages_used / usage.message_limit) * 100));
  const danger = pct >= 90;
  const warn = pct >= 70 && pct < 90;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
            <Activity className="size-4" />
          </span>
          <h3 className="text-sm font-semibold text-slate-800">Usage this period</h3>
        </div>
        <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold capitalize text-indigo-700">
          {usage.plan}
        </span>
      </div>

      <div className="mt-4 flex items-baseline gap-1.5">
        <span className="tabular text-3xl font-bold tracking-tight text-slate-900">{usage.messages_used}</span>
        <span className="tabular text-sm text-slate-400">/ {usage.message_limit.toLocaleString()} messages</span>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            danger ? "bg-red-500" : warn ? "bg-amber-500" : "bg-gradient-to-r from-indigo-500 to-violet-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-slate-400">
        <span className="tabular">{usage.messages_remaining.toLocaleString()}</span> messages remaining
      </p>
    </div>
  );
}
