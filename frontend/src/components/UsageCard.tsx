import type { Usage } from "../api";

export default function UsageCard({ usage }: { usage: Usage | null }) {
  if (!usage) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse h-32" />
    );
  }
  const pct = Math.min(100, Math.round((usage.messages_used / usage.message_limit) * 100));
  const danger = pct >= 90;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-slate-700">Usage this period</h3>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 capitalize">
          {usage.plan} plan
        </span>
      </div>
      <div className="flex items-baseline gap-1.5 mt-3">
        <span className="text-3xl font-bold text-slate-800">{usage.messages_used}</span>
        <span className="text-sm text-slate-400">/ {usage.message_limit} messages</span>
      </div>
      <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${danger ? "bg-red-500" : "bg-indigo-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-slate-400 mt-2">
        {usage.messages_remaining} messages remaining
      </p>
    </div>
  );
}
