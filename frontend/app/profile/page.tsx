"use client";

import { Sidebar } from "@/components/Sidebar";

export default function ProfilePage() {
  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <h1 className="mb-6 text-2xl font-semibold text-ink-900">Company Profile</h1>
          <section className="mb-4">
            <h2 className="text-lg font-medium text-ink-800">Company Information</h2>
            <p className="mt-2 text-sm text-slate-600"><strong>Name:</strong> Three Way Match Inc.</p>
            <p className="mt-1 text-sm text-slate-600"><strong>Address:</strong> 1234 Example Street, City, Country</p>
            <p className="mt-1 text-sm text-slate-600"><strong>Contact:</strong> +1 (555) 123‑4567 | info@threewaymatch.com</p>
            <p className="mt-1 text-sm text-slate-600"><strong>Industry:</strong> Supply Chain / Procurement</p>
          </section>
          <section className="mb-4">
            <h2 className="text-lg font-medium text-ink-800">Project Overview</h2>
            <p className="mt-2 text-sm text-slate-600">
              This application provides a three‑way matching engine to reconcile purchase orders, goods receipt notes, and invoices. It helps organizations ensure data consistency and reduces manual effort.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-medium text-ink-800">Key Metrics</h2>
            <ul className="mt-2 list-disc list-inside text-sm text-slate-600">
              <li>Active PO count: 128</li>
              <li>Monthly matched documents: 342</li>
              <li>Average processing time: 2.4 seconds</li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
