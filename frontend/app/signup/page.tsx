"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, company, role }),
      });
      if (!res.ok) throw new Error("Signup failed");
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <h1 className="mb-4 text-center text-2xl font-bold text-ink-900">Create Account</h1>
        {error && <div className="mb-3 rounded-md bg-bad-50 px-3 py-2 text-sm text-bad-700">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block">
            <span className="field-label mb-1 block">Name</span>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400" />
          </label>
          <label className="block">
            <span className="field-label mb-1 block">Email</span>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400" />
          </label>
          <label className="block">
            <span className="field-label mb-1 block">Password</span>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400" />
          </label>
          <label className="block">
            <span className="field-label mb-1 block">Confirm Password</span>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400" />
          </label>
          <label className="block">
            <span className="field-label mb-1 block">Company Name</span>
            <input value={company} onChange={e => setCompany(e.target.value)} className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400" />
          </label>
          <label className="block">
            <span className="field-label mb-1 block">Role</span>
            <input value={role} onChange={e => setRole(e.target.value)} className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400" />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : "Sign up"}
          </button>
        </form>
      </div>
    </div>
  );
}
