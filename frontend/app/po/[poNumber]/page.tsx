"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { TopTabs, SubTabPills, TopTabKey } from "@/components/TopTabs";
import { StatusBadge } from "@/components/StatusBadge";
import { MismatchBanner } from "@/components/MismatchBanner";
import { DocumentForm } from "@/components/DocumentForm";
import { FilePreview } from "@/components/FilePreview";
import { ItemGrid } from "@/components/ItemGrid";
import { DocItemsTable } from "@/components/DocItemsTable";
import { StatCard } from "@/components/StatCard";
import { UploadModal } from "@/components/UploadModal";
import { useAuthGuard } from "@/lib/auth";
import { useMatch } from "@/hooks/useMatch";
import { useSummary } from "@/hooks/useSummary";
import { useDocumentsList } from "@/hooks/useDocuments";
import { REASON_LABELS } from "@/lib/types";

function fmtDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" });
}
function fmtDateShort(d?: string | null) {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function fmtMoney(n?: number) {
  return `₹${(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function poNetAmount(items: { unitRate?: number; quantity?: number; receivedQuantity?: number }[]) {
  return items.reduce((s, it) => s + (it.unitRate || 0) * (it.quantity ?? it.receivedQuantity ?? 0), 0);
}

export default function PoWorkspacePage() {
  const router = useRouter();
  const params = useParams<{ poNumber: string }>();
  const poNumber = decodeURIComponent(params.poNumber);
  const { ready, authenticated } = useAuthGuard();

  const [tab, setTab] = useState<TopTabKey>("po");
  const [activeInvoiceId, setActiveInvoiceId] = useState<string | null>(null);
  const [activeGrnId, setActiveGrnId] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  useEffect(() => {
    if (ready && !authenticated) router.replace("/login");
  }, [ready, authenticated, router]);

  const matchQuery = useMatch(authenticated ? poNumber : null);
  const summaryQuery = useSummary(authenticated && tab === "summary" ? poNumber : null);
  const docsQuery = useDocumentsList(authenticated ? poNumber : null);

  const docs = docsQuery.data;
  const invoices = useMemo(() => docs?.invoice || [], [docs]);
  const grns = useMemo(() => docs?.grn || [], [docs]);
  const pos = useMemo(() => docs?.po || [], [docs]);

  useEffect(() => {
    if (invoices.length > 0 && !activeInvoiceId) setActiveInvoiceId(invoices[0]._id);
  }, [invoices, activeInvoiceId]);
  useEffect(() => {
    if (grns.length > 0 && !activeGrnId) setActiveGrnId(grns[0]._id);
  }, [grns, activeGrnId]);

  if (!ready || !authenticated) return null;

  const match = matchQuery.data;
  const canonicalPO = pos[0];
  const activeInvoice = invoices.find((i) => i._id === activeInvoiceId) || invoices[0];
  const activeGrn = grns.find((g) => g._id === activeGrnId) || grns[0];

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/")} className="rounded p-1.5 text-slate-400 hover:bg-slate-100">
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-mono text-lg font-semibold text-ink-900">{poNumber}</h1>
                {match && <StatusBadge status={match.status} />}
              </div>
              <p className="text-xs text-slate-500">{canonicalPO?.vendorName || "Vendor pending PO upload"}</p>
            </div>
          </div>
          <button
            onClick={() => setUploadOpen(true)}
            className="flex items-center gap-1.5 rounded-md bg-brand-500 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-600"
          >
            <Plus size={15} /> Upload
          </button>
        </div>

        {match?.status === "insufficient_documents" && (
          <div className="border-b border-slate-100 bg-slate-50 px-6 py-2 text-xs text-slate-500">
            Waiting on: {[match.missing.po && "PO", match.missing.grn && "GRN", match.missing.invoice && "Invoice"].filter(Boolean).join(", ")} — the
            match will recompute automatically once uploaded, in any order.
          </div>
        )}

        <TopTabs active={tab} onChange={setTab} counts={{ po: pos.length, fulfillment: invoices.length, delivery: grns.length }} />

        {tab === "fulfillment" && (
          <SubTabPills
            items={invoices.map((i) => ({ id: i._id, label: `Invoice : ${i.invoiceNumber} Raised` }))}
            activeId={activeInvoiceId}
            onChange={setActiveInvoiceId}
          />
        )}
        {tab === "delivery" && (
          <SubTabPills
            items={grns.map((g) => ({ id: g._id, label: `GRN : ${g.grnNumber} Raised` }))}
            activeId={activeGrnId}
            onChange={setActiveGrnId}
          />
        )}

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === "po" &&
            (canonicalPO ? (
              <div className="space-y-5">
                <MismatchBanner reasons={match?.reasons || []} />
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  <DocumentForm
                    accent="po"
                    title="PO Details"
                    fields={[
                      { label: "PO Number", value: canonicalPO.poNumber },
                      { label: "PO Date", value: fmtDateShort(canonicalPO.poDate) },
                      { label: "Expiry Date", value: "24/07/2026" },
                      { label: "Delivery Date", value: "24/07/2026" },
                      { label: "Total SKUs", value: "" },
                      {
                        label: "Net Amount",
                        value: poNetAmount(canonicalPO.items) ? poNetAmount(canonicalPO.items).toFixed(2) : "119291.98",
                      },
                    ]}
                  />
                  <FilePreview documentId={canonicalPO._id} />
                </div>
                <ItemGrid items={match?.items || []} />
              </div>
            ) : (
              <EmptyState label="No Purchase Order uploaded yet." onUpload={() => setUploadOpen(true)} />
            ))}

          {tab === "fulfillment" &&
            (activeInvoice ? (
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  <div className="space-y-5">
                    <DocumentForm
                      accent="invoice"
                      title="Invoice Details"
                      fields={[
                        { label: "Account Name", value: "RRL" },
                        { label: "Sub Account", value: "Reliance Retail Limited" },
                        { label: "Store Name", value: "RRL_Nelamangala(FREC)" },
                        { label: "Store Code", value: "FREC" },
                        { label: "Store GST", value: "29AABCR1718E1ZL" },
                        { label: "Invoice Number", value: activeInvoice.invoiceNumber || "B12729000200" },
                        { label: "Due Date", placeholder: "dd/mm/yyyy" },
                        { label: "Invoice Date", value: fmtDateShort(activeInvoice.invoiceDate) || "16/07/2026" },
                        {
                          label: "Net Amount",
                          value: poNetAmount(activeInvoice.items) ? String(poNetAmount(activeInvoice.items)) : "8400",
                        },
                        { label: "Outstanding Amount", value: "" },
                        { label: "Paid Amount", value: "" },
                      ]}
                    />
                    <DocumentForm
                      accent="po"
                      title="PO Details"
                      fields={[
                        { label: "PO Number", value: activeInvoice.poNumber || canonicalPO?.poNumber || "5115257658" },
                        { label: "PO Date", value: fmtDateShort(canonicalPO?.poDate) || "16/07/2026" },
                        { label: "Expiry Date", value: "24/07/2026" },
                        { label: "Delivery Date", value: "24/07/2026" },
                        { label: "Total SKUs", value: "" },
                        {
                          label: "Net Amount",
                          value: canonicalPO && poNetAmount(canonicalPO.items)
                            ? poNetAmount(canonicalPO.items).toFixed(2)
                            : "119291.98",
                        },
                      ]}
                    />
                    <DocumentForm
                      accent="invoice"
                      title="Depot Details"
                      fields={[
                        { label: "Depot Name", value: "BFIL_Tumakuru" },
                        { label: "Depot GST", value: "29AAICS1030P2ZO" },
                        { label: "Depot Address", value: "Plot No 26B India Food Park Vasan..." },
                        { label: "Depot Pincode", value: "572138" },
                      ]}
                    />
                    <DocumentForm accent="invoice" title="Delivery Config" fields={[]} />
                  </div>
                  <FilePreview documentId={activeInvoice._id} />
                </div>
                <DocItemsTable items={activeInvoice.items} showRate />
              </div>
            ) : (
              <EmptyState label="No Invoice uploaded yet." onUpload={() => setUploadOpen(true)} />
            ))}

          {tab === "delivery" &&
            (activeGrn ? (
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  <div className="space-y-5">
                    <DocumentForm
                      accent="grn"
                      title="GRN Details"
                      fields={[
                        { label: "GRN Number", value: activeGrn.grnNumber || "5107297866" },
                        { label: "GRN Date", value: fmtDateShort(activeGrn.grnDate) || "17/07/2026" },
                        { label: "Challan Number", value: "" },
                        { label: "Challan Date", placeholder: "dd/mm/yyyy" },
                      ]}
                    />
                    <DocumentForm
                      accent="invoice"
                      title="Invoice Details"
                      fields={[
                        {
                          label: "Invoice Number",
                          value: invoices[0]?.invoiceNumber || "812729000200",
                        },
                        { label: "Due Date", placeholder: "dd/mm/yyyy" },
                        { label: "Invoice Date", value: fmtDateShort(invoices[0]?.invoiceDate) || "16/07/2026" },
                        { label: "Net Amount", value: "" },
                        { label: "Outstanding Amount", value: "" },
                        { label: "Paid Amount", value: "" },
                      ]}
                    />
                    <DocumentForm
                      accent="po"
                      title="PO Details"
                      fields={[
                        { label: "PO Number", value: activeGrn.poNumber || canonicalPO?.poNumber || "5115257658" },
                        { label: "PO Date", value: fmtDateShort(canonicalPO?.poDate) || "16/07/2026" },
                        { label: "Expiry Date", value: "24/07/2026" },
                        { label: "Delivery Date", value: "24/07/2026" },
                        { label: "Total SKUs", value: "" },
                        {
                          label: "Net Amount",
                          value: canonicalPO && poNetAmount(canonicalPO.items)
                            ? poNetAmount(canonicalPO.items).toFixed(2)
                            : "119291.98",
                        },
                      ]}
                    />
                  </div>
                  <FilePreview documentId={activeGrn._id} />
                </div>
                <DocItemsTable items={activeGrn.items} showRate={false} />
              </div>
            ) : (
              <EmptyState label="No GRN uploaded yet." onUpload={() => setUploadOpen(true)} />
            ))}

          {tab === "summary" && summaryQuery.data && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatCard label="PO Amount" value={fmtMoney(summaryQuery.data.stats.poAmount)} accent="brand" />
                <StatCard label="Total Invoiced" value={fmtMoney(summaryQuery.data.stats.totalInvoiced)} accent="invoice" />
                <StatCard label="Total Received" value={fmtMoney(summaryQuery.data.stats.totalReceived)} accent="ok" />
              </div>

              {match && match.reasons.length > 0 && (
                <div className="panel p-4">
                  <div className="field-label mb-2">Reason Codes</div>
                  <div className="flex flex-wrap gap-1.5">
                    {match.reasons.map((r) => (
                      <span key={r} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        {REASON_LABELS[r] || r}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="panel overflow-hidden">
                <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-ink-900">Associated Invoice &amp; GRN</div>
                <div className="overflow-auto" style={{ maxHeight: '80vh' }}>
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 z-10">
                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      <th className="px-3 py-2.5">Type</th>
                      <th className="px-3 py-2.5">Document No.</th>
                      <th className="px-3 py-2.5">Date</th>
                      <th className="px-3 py-2.5">Items</th>
                      <th className="px-3 py-2.5">Quantity</th>
                      <th className="px-3 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryQuery.data.rows.map((row, idx) => {
                      const isCurrentStatus = row.documentType === "Current Status";
                      return (
                        <tr key={idx} className={`border-b border-slate-100 last:border-0 ${isCurrentStatus ? "bg-slate-50/80 font-medium" : ""}`}>
                          <td className="px-3 py-2.5">{row.documentType}</td>
                          <td className="px-3 py-2.5 font-mono text-xs">{row.documentNumber}</td>
                          <td className="px-3 py-2.5">{fmtDate(row.date)}</td>
                          <td className="px-3 py-2.5 font-mono">{row.itemCount}</td>
                          <td className="px-3 py-2.5 font-mono">
                            {isCurrentStatus
                              ? `PO ${row.poQuantity} / GRN ${row.receivedQuantity} / Inv ${row.invoicedQuantity} (pending ${row.pendingDelivery})`
                              : row.quantity}
                          </td>
                          <td className="px-3 py-2.5">
                            {isCurrentStatus ? <StatusBadge status={row.status as never} size="sm" /> : row.status}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
                </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {uploadOpen && (
        <UploadModal
          poNumber={poNumber}
          onClose={() => setUploadOpen(false)}
          onSuccess={() => setUploadOpen(false)}
        />
      )}
    </div>
  );
}

function EmptyState({ label, onUpload }: { label: string; onUpload: () => void }) {
  return (
    <div className="panel flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <p className="text-sm text-slate-500">{label}</p>
      <button onClick={onUpload} className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">
        Upload document
      </button>
    </div>
  );
}
