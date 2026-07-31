"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search, FileStack } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { api } from "@/lib/api";
import { DocumentRecord, DocumentType } from "@/lib/types";
// import { format } from "date-fns"; // removed, using native date formatting
import { useAuthGuard } from "@/lib/auth";

type DocWithMeta = DocumentRecord & { type: DocumentType };

export default function DocumentsPage() {
  const router = useRouter();
  const { ready, authenticated } = useAuthGuard();

  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["allDocuments"],
    queryFn: () => api.get<Record<DocumentType, DocumentRecord[]>>("/documents"),
    enabled: authenticated,
  });

  const documents: DocWithMeta[] = [];
  if (data) {
    if (data.po) data.po.forEach((d) => documents.push({ ...d, type: "po" }));
    if (data.grn) data.grn.forEach((d) => documents.push({ ...d, type: "grn" }));
    if (data.invoice) data.invoice.forEach((d) => documents.push({ ...d, type: "invoice" }));
  }

  // newest first
  documents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filtered = documents.filter((doc) => {
    const term = search.toLowerCase();
    const id = (doc.poNumber || doc.grnNumber || doc.invoiceNumber || "").toLowerCase();
    return !search || id.includes(term) || (doc.vendorName || "").toLowerCase().includes(term);
  });

  // redirect to login if needed
  useEffect(() => {
    if (ready && !authenticated) router.replace("/login");
  }, [ready, authenticated, router]);

  if (!ready || !authenticated) return null;

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-ink-900">All Documents</h1>
            <p className="text-sm text-slate-500">Every PO, GRN, and Invoice you have uploaded.</p>
          </div>

          <div className="relative mb-4 w-80">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search document number or vendor…"
              className="w-full rounded-md border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm outline-none focus:border-brand-400"
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="grid grid-cols-5 gap-4 border-b border-slate-100 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <div className="col-span-1">Type</div>
              <div className="col-span-1">Doc #</div>
              <div className="col-span-1">Linked PO</div>
              <div className="col-span-1">Uploaded</div>
              <div className="col-span-1 text-right">Action</div>
            </div>
            <div className="divide-y divide-slate-100">
              {isLoading && (
                <div className="px-6 py-8 text-center text-sm text-slate-400">Loading documents…</div>
              )}
              {!isLoading && filtered.length === 0 && (
                <div className="px-6 py-8 text-center text-sm text-slate-400">No documents found.</div>
              )}
              {filtered.map((doc) => {
                const docNumber =
                  doc.type === "po"
                    ? doc.poNumber
                    : doc.type === "grn"
                    ? doc.grnNumber
                    : doc.invoiceNumber;
                return (
                  <div key={doc._id} className="group grid grid-cols-5 items-center gap-4 px-6 py-4 hover:bg-slate-50">
                    <div className="col-span-1 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-100 text-slate-500">
                        <FileStack size={16} />
                      </div>
                      <span className="text-sm font-medium uppercase text-ink-900">{doc.type}</span>
                    </div>
                    <div className="col-span-1">
                      <div className="font-mono text-sm font-semibold text-ink-900">{docNumber || "N/A"}</div>
                      {doc.vendorName && <div className="truncate text-xs text-slate-500">{doc.vendorName}</div>}
                    </div>
                    <div className="col-span-1 font-mono text-sm text-slate-600">{doc.poNumber}</div>
                    <div className="col-span-1 text-sm text-slate-600">{new Date(doc.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</div>
                    <div className="col-span-1 flex justify-end">
                      <button
                        onClick={() => router.push(`/po/${encodeURIComponent(doc.poNumber)}`)}
                        className="rounded border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                      >
                        View Match
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
