import { AlertTriangle } from "lucide-react";
import { REASON_LABELS } from "@/lib/types";

export function MismatchBanner({ reasons }: { reasons: string[] }) {
  if (!reasons || reasons.length === 0) return null;

  const hardReasons = new Set([
    "grn_qty_exceeds_po_qty",
    "invoice_qty_exceeds_grn_qty",
    "invoice_qty_exceeds_po_qty",
    "invoice_date_after_po_date",
    "duplicate_po",
    "duplicate_document",
    "item_missing_in_po",
  ]);
  const isHard = reasons.some((r) => hardReasons.has(r));

  return (
    <div
      className={`mb-4 flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm ${
        isHard ? "border-bad-500/30 bg-bad-50 text-bad-700" : "border-warn-500/30 bg-warn-50 text-warn-700"
      }`}
    >
      <AlertTriangle size={16} className="mt-0.5 shrink-0" strokeWidth={2.5} />
      <div>
        <div className="font-semibold">{isHard ? "Mismatch detected" : "Needs attention"}</div>
        <div className="mt-0.5 flex flex-wrap gap-x-1.5 gap-y-1">
          {reasons.map((r) => (
            <span key={r} className="rounded bg-white/60 px-1.5 py-0.5 text-xs font-medium">
              {REASON_LABELS[r] || r}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
