"use client";

import { Sidebar } from "@/components/Sidebar";

export default function SettingsPage() {
  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <h1 className="mb-4 text-2xl font-semibold text-ink-900">Settings</h1>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Settings page content will go here.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
