"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, ChevronRight, Search, Trash2, X, Loader2 } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { UploadModal } from "@/components/UploadModal";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuthGuard } from "@/lib/auth";
import { api } from "@/lib/api";
import { DocumentRecord, MatchStatus } from "@/lib/types";

interface PoListEntry extends DocumentRecord {
  matchStatus?: MatchStatus;
}

export default function HomePage() {
  const router = useRouter();
  const { ready, authenticated } = useAuthGuard();
  const queryClient = useQueryClient();
  
  const [uploadOpen, setUploadOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (ready && !authenticated) router.replace("/login");
  }, [ready, authenticated, router]);

  const { data: pos, isLoading } = useQuery({
    queryKey: ["poList"],
    queryFn: () => api.get<PoListEntry[]>("/documents?type=po"),
    enabled: authenticated,
  });

  const deleteMutation = useMutation({
    mutationFn: async (poNum: string) => api.delete(`/documents/po/${encodeURIComponent(poNum)}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["poList"] });
      setDeleteConfirm(null);
    },
  });

  if (!ready || !authenticated) return null;

  const filtered = (pos || []).filter(
    (p) => !search || p.poNumber.toLowerCase().includes(search.toLowerCase()) || (p.vendorName || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-ink-900">Purchase Orders</h1>
              <p className="text-sm text-slate-500">Upload a PO, GRN, or Invoice to start a three-way match.</p>
            </div>
            <button
              onClick={() => setUploadOpen(true)}
              className="flex items-center gap-1.5 rounded-md bg-brand-500 px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
            >
              <Plus size={16} /> Upload document
            </button>
          </div>

          <div className="relative mb-4 w-80">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search PO number or vendor…"
              className="w-full rounded-md border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm outline-none focus:border-brand-400"
            />
          </div>

          <div className="panel bg-white shadow-sm rounded-xl overflow-hidden" style={{ maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
            {isLoading && <div className="px-4 py-6 text-center text-sm text-slate-400">Loading…</div>}
            {!isLoading && filtered.length === 0 && (
              <div className="px-4 py-10 text-center text-sm text-slate-400">
                No purchase orders yet. Upload a PO, GRN, or Invoice to get started — documents can arrive in any order.
              </div>
            )}
            {filtered.map((po) => (
              <div key={po._id} className="group flex w-full items-center justify-between px-4 py-3.5 hover:bg-slate-50">
                <button
                  onClick={() => router.push(`/po/${encodeURIComponent(po.poNumber)}`)}
                  className="flex-1 text-left"
                >
                  <div className="font-mono text-sm font-semibold text-ink-900">{po.poNumber}</div>
                  <div className="text-xs text-slate-500">{po.vendorName || "Unknown vendor"}</div>
                </button>
                <div className="flex items-center gap-4">
                  <PoStatusPill poNumber={po.poNumber} />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm(po.poNumber);
                    }}
                    className="p-1.5 text-slate-300 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 rounded"
                    title="Delete PO"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button 
                    className="text-slate-300"
                    onClick={() => router.push(`/po/${encodeURIComponent(po.poNumber)}`)}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            ))}
            </div>
          </div>
        </div>
      </main>

      {uploadOpen && (
        <UploadModal
          poNumber={null}
          onClose={() => setUploadOpen(false)}
          onSuccess={(poNumber) => {
            setUploadOpen(false);
            router.push(`/po/${encodeURIComponent(poNumber)}`);
          }}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink-900">Delete Purchase Order</h2>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <p className="mb-6 text-sm text-slate-600">
              Are you sure you want to delete PO <span className="font-mono font-semibold">{deleteConfirm}</span>? 
              This will also delete any associated GRNs and Invoices. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteConfirm)}
                disabled={deleteMutation.isPending}
                className="flex items-center gap-2 rounded-md bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
              >
                {deleteMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PoStatusPill({ poNumber }: { poNumber: string }) {
  const { data } = useQuery({
    queryKey: ["match", poNumber],
    queryFn: () => api.get<{ status: MatchStatus }>(`/match/${encodeURIComponent(poNumber)}`),
  });
  if (!data) return null;
  return <StatusBadge status={data.status} size="sm" />;
}
