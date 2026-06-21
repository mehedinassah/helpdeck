import { useState } from "react";
import { api } from "../api";

interface Props {
  onAuthed: (apiKey: string) => void;
}

export default function Login({ onAuthed }: Props) {
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [name, setName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const tenant = await api.createTenant(name.trim() || "My Business");
      onAuthed(tenant.api_key);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.me(apiKey.trim()); // validates key
      onAuthed(apiKey.trim());
    } catch {
      setError("Invalid API key");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-full flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 justify-center mb-6">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
            H
          </div>
          <span className="text-xl font-bold text-slate-800">Helpdeck</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="flex gap-1 p-1 bg-slate-100 rounded-lg mb-6">
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition ${
                mode === "signup" ? "bg-white shadow-sm text-slate-800" : "text-slate-500"
              }`}
            >
              Create account
            </button>
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition ${
                mode === "login" ? "bg-white shadow-sm text-slate-800" : "text-slate-500"
              }`}
            >
              I have a key
            </button>
          </div>

          {mode === "signup" ? (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Business name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Acme Inc"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                />
              </div>
              <button
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition disabled:opacity-50"
              >
                {loading ? "Creating…" : "Create account & get API key"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  API key
                </label>
                <input
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="hd_…"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition font-mono text-sm"
                />
              </div>
              <button
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition disabled:opacity-50"
              >
                {loading ? "Checking…" : "Continue"}
              </button>
            </form>
          )}

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          AI customer-support widget for your website
        </p>
      </div>
    </div>
  );
}
