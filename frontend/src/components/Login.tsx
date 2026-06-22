import { useState } from "react";
import { Bot, FileText, Code2, BarChart3 } from "lucide-react";
import { api } from "../api";

interface Props {
  onAuthed: (apiKey: string) => void;
}

type Mode = "signup" | "login" | "key";

const PERKS = [
  { icon: FileText, label: "Train it on your own docs & PDFs" },
  { icon: Code2, label: "Embed with one line of code" },
  { icon: BarChart3, label: "Usage-based, scales with you" },
];

export default function Login({ onAuthed }: Props) {
  const [mode, setMode] = useState<Mode>("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function run(fn: () => Promise<{ api_key: string }>) {
    setError("");
    setLoading(true);
    try {
      const t = await fn();
      onAuthed(t.api_key);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "signup") run(() => api.signup(email.trim(), password, name.trim()));
    else if (mode === "login") run(() => api.login(email.trim(), password));
    else run(() => api.me(apiKey.trim()));
  }

  const inputCls =
    "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";

  return (
    <div className="grid min-h-full lg:grid-cols-2">
      {/* Left: brand / value panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 size-80 rounded-full bg-violet-400/20 blur-3xl" />
        <div className="relative flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-white/15 text-sm font-bold text-white backdrop-blur">H</span>
          <span className="text-lg font-bold text-white">Helpdeck</span>
        </div>
        <div className="relative">
          <h2 className="max-w-sm text-3xl font-bold leading-tight tracking-tight text-white">
            An AI support agent for your website, in minutes.
          </h2>
          <ul className="mt-8 space-y-3.5">
            {PERKS.map((p) => (
              <li key={p.label} className="flex items-center gap-3 text-indigo-100">
                <span className="grid size-8 place-items-center rounded-lg bg-white/10 text-white backdrop-blur">
                  <p.icon className="size-4" />
                </span>
                <span className="text-sm">{p.label}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-indigo-200/80">Trusted by businesses to deflect support tickets 24/7.</p>
      </div>

      {/* Right: auth card */}
      <div className="flex items-center justify-center p-5 sm:p-8">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex items-center gap-2.5 lg:hidden">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white">H</span>
            <span className="text-xl font-bold text-slate-900">Helpdeck</span>
          </div>

          <div className="mb-1 inline-flex size-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Bot className="size-5.5" />
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
            {mode === "signup" ? "Create your account" : mode === "login" ? "Welcome back" : "Sign in with API key"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {mode === "signup"
              ? "Spin up your AI assistant — no card required."
              : mode === "login"
                ? "Sign in to manage your assistant."
                : "Paste your API key to continue."}
          </p>

          {mode !== "key" && (
            <div className="mt-6 flex gap-1 rounded-xl bg-slate-100 p-1">
              <button
                onClick={() => setMode("signup")}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                  mode === "signup" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Create account
              </button>
              <button
                onClick={() => setMode("login")}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                  mode === "login" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Sign in
              </button>
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            {mode === "signup" && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Business name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Inc" className={inputCls} />
              </div>
            )}

            {mode !== "key" ? (
              <>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
                  <input
                    type="password"
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
                    className={inputCls}
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">API key</label>
                <input
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="hd_…"
                  className={`${inputCls} font-mono`}
                />
              </div>
            )}

            <button
              disabled={loading}
              className={`w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.99] disabled:opacity-50 ${
                mode === "signup"
                  ? "bg-gradient-to-r from-indigo-500 to-violet-600 shadow-sm hover:shadow-md"
                  : "bg-slate-900 hover:bg-slate-700"
              }`}
            >
              {loading
                ? "Please wait…"
                : mode === "signup"
                  ? "Create account"
                  : mode === "login"
                    ? "Sign in"
                    : "Continue"}
            </button>
          </form>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

          <div className="mt-6 text-center">
            {mode !== "key" ? (
              <button onClick={() => { setMode("key"); setError(""); }} className="text-xs font-medium text-slate-400 hover:text-slate-600">
                Sign in with an API key instead
              </button>
            ) : (
              <button onClick={() => { setMode("login"); setError(""); }} className="text-xs font-medium text-slate-400 hover:text-slate-600">
                ← Back to email sign in
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
