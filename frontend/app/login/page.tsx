"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { api, setToken, ApiError } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post<{ token: string }>("/auth/login", { username, password });
      setToken(res.token);
      router.push("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500 font-mono text-sm font-bold text-white">3M</div>
          <h1 className="text-lg font-semibold text-ink-900">Three-Way Match Engine</h1>
          <p className="text-sm text-slate-500">Sign in to reconcile PO, GRN & Invoice documents</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block">
            <span className="field-label mb-1 block">Username</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
            />
          </label>
          <label className="block">
            <span className="field-label mb-1 block">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
            />
          </label>

          {error && <div className="rounded-md bg-bad-50 px-3 py-2 text-sm text-bad-700">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={14} />}
            Sign in
          </button>
          <div className="mt-4 text-center text-sm text-slate-600">
            Don't have an account? <a href="/signup" className="font-medium text-brand-500 hover:underline">Sign up</a>
          </div>
        </form>
      </div>
    </div>
  );
}
