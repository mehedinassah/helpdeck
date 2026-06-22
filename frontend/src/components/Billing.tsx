import { useEffect, useState } from "react";
import { Check, Sparkles, ArrowUpRight, CreditCard } from "lucide-react";
import { api, type PlansResponse, type PlanInfo } from "../api";

const PLAN_BLURB: Record<string, string> = {
  free: "Get started and try it out",
  pro: "For growing sites with steady traffic",
  business: "High volume & priority needs",
};

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
    return <div className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white shadow-sm" />;
  }

  const order = ["free", "pro", "business"];
  const plans = [...data.plans].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900">Plans &amp; billing</h2>
          <p className="mt-1 text-sm text-slate-500">
            You're on the{" "}
            <span className="font-semibold capitalize text-slate-700">{data.current_plan}</span> plan.
            Upgrade anytime as your traffic grows.
          </p>
        </div>
        {data.current_plan !== "free" && (
          <button
            onClick={manage}
            disabled={busy !== null}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            <CreditCard className="size-4" />
            {busy === "portal" ? "Opening…" : "Manage billing"}
          </button>
        )}
      </div>

      {!data.configured && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Sparkles className="mt-0.5 size-4 shrink-0" />
          <span>Billing isn't connected yet — add your Stripe keys to enable live upgrades.</span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((p) => (
          <PlanCard
            key={p.id}
            plan={p}
            current={p.id === data.current_plan}
            popular={p.id === "pro"}
            disabled={!data.configured || busy !== null}
            loading={busy === p.id}
            blurb={PLAN_BLURB[p.id] ?? ""}
            onUpgrade={() => upgrade(p.id)}
          />
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </section>
  );
}

function PlanCard({
  plan,
  current,
  popular,
  disabled,
  loading,
  blurb,
  onUpgrade,
}: {
  plan: PlanInfo;
  current: boolean;
  popular: boolean;
  disabled: boolean;
  loading: boolean;
  blurb: string;
  onUpgrade: () => void;
}) {
  const paid = plan.price_usd > 0;
  const highlight = popular && !current;

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-5 transition-all ${
        current
          ? "border-indigo-300 bg-indigo-50/50 ring-1 ring-indigo-200"
          : highlight
            ? "border-indigo-200 bg-white shadow-md shadow-indigo-100"
            : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      {highlight && (
        <span className="absolute -top-2.5 left-5 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-sm">
          <Sparkles className="size-3" /> Popular
        </span>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">{plan.name}</h3>
        {current && (
          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
            Current
          </span>
        )}
      </div>

      <p className="mt-3 flex items-baseline gap-1">
        <span className="tabular text-3xl font-bold tracking-tight text-slate-900">${plan.price_usd}</span>
        <span className="text-sm text-slate-400">/mo</span>
      </p>
      <p className="mt-1 text-xs text-slate-500">{blurb}</p>

      <ul className="mt-4 flex-1 space-y-2 text-sm text-slate-600">
        <li className="flex items-center gap-2">
          <Check className="size-4 shrink-0 text-emerald-500" />
          <span className="tabular">{plan.message_limit.toLocaleString()}</span> messages / month
        </li>
        <li className="flex items-center gap-2">
          <Check className="size-4 shrink-0 text-emerald-500" />
          Unlimited documents
        </li>
        <li className="flex items-center gap-2">
          <Check className="size-4 shrink-0 text-emerald-500" />
          {paid ? "Priority responses" : "Community support"}
        </li>
      </ul>

      <div className="mt-5">
        {current ? (
          <div className="rounded-lg bg-slate-100 py-2 text-center text-sm font-medium text-slate-500">
            Your plan
          </div>
        ) : paid ? (
          <button
            onClick={onUpgrade}
            disabled={disabled}
            className={`inline-flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50 ${
              highlight
                ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-sm hover:shadow-md"
                : "bg-slate-900 text-white hover:bg-slate-700"
            }`}
          >
            {loading ? "Redirecting…" : `Upgrade to ${plan.name}`}
            {!loading && <ArrowUpRight className="size-4" />}
          </button>
        ) : (
          <div className="py-2 text-center text-xs text-slate-400">Free forever</div>
        )}
      </div>
    </div>
  );
}
