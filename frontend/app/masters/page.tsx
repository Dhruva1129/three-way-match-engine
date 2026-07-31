"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { SkuMasterTable } from "@/components/SkuMasterTable";
import { useAuthGuard } from "@/lib/auth";

export default function MastersPage() {
  const router = useRouter();
  const { ready, authenticated } = useAuthGuard();

  useEffect(() => {
    if (ready && !authenticated) router.replace("/login");
  }, [ready, authenticated, router]);

  if (!ready || !authenticated) return null;

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-ink-900">SKU Master</h1>
            <p className="text-sm text-slate-500">The catalogue every PO/GRN/Invoice line item resolves against for matching.</p>
          </div>
          <SkuMasterTable />
        </div>
      </main>
    </div>
  );
}
