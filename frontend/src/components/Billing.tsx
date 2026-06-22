import { useEffect, useState } from "react";
import { api, type PlansResponse } from "../api";

export default function Billing({ apiKey }: { apiKey: string }) {
  const [data, setData] = useState<PlansResponse | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getPlans(apiKey).then(setData).catch((e) => setError((e as Error).message));
  }, [apiKey]);

  async function upgrade(plan: string) {
    setError("");
    setBusy(plan);
    try {
      const { url } = await api.checkout(apiKey, plan);
      window.location.href = url;
    } catch (e) {
      setError((e as Error).message);
      setBusy(null);
    }
  }

  async function manage() {
    setError("");
    setBusy("portal");
    try {
      const { url } = await api.portal(apiKey);
      window.location.href = url;
    } catch (e) {
      setError((e as Error).message);
      setBusy(null);
    }
  }

  if (!data) {
    return <div className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse h-40" />;
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-slate-700">Plan & billing</h3>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 capitalize">
          {data.current_plan}
        </span>
      </div>

      {!data.configured && (
        <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Billing isn't configured yet (add Stripe keys to enable upgrades).
        </p>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {data.plans.map((p) => {
          const current = p.id === data.current_plan;
          const paid = p.price_usd > 0;
          return (
            <div
              key={p.id}
              className={`rounded-lg border p-4 ${current ? "border-indigo-500 bg-indigo-50/40" : "border-slate-200"}`}
            >
              <p className="text-sm font-semibold text-slate-800">{p.name}</p>
              <p className="mt-1">
                <span className="text-2xl font-bold text-slate-800">${p.price_usd}</span>
                <span className="text-xs text-slate-400">/mo</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {p.message_limit.toLocaleString()} messages/mo
              </p>
              {current ? (
                <span className="mt-3 block text-center text-xs font-medium text-indigo-600">
                  Current plan
                </span>
              ) : paid ? (
                <button
                  onClick={() => upgrade(p.id)}
                  disabled={!data.configured || busy !== null}
                  className="mt-3 w-full py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition disabled:opacity-50"
                >
                  {busy === p.id ? "Redirecting…" : `Upgrade to ${p.name}`}
                </button>
              ) : (
                <span className="mt-3 block text-center text-xs text-slate-400">Free tier</span>
              )}
            </div>
          );
        })}
      </div>

      {data.current_plan !== "free" && (
        <button
          onClick={manage}
          disabled={busy !== null}
          className="mt-4 text-xs font-medium text-slate-500 hover:text-slate-800 transition disabled:opacity-50"
        >
          {busy === "portal" ? "Opening…" : "Manage billing →"}
        </button>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
