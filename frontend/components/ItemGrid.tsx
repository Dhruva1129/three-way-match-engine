import clsx from "clsx";
import { AlertCircle } from "lucide-react";
import { MatchItem } from "@/lib/types";

const COLS = [
  "SKU Name",
  "SKU ID",
  "Mapped SKU Name",
  "ERP Code",
  "EAN",
  "HSN",
  "UOM",
  "PO Qty",
  "GRN Qty",
  "Inv Qty",
  "Unit Price",
  "Unit MRP",
  "Gross Amount",
];

export function ItemGrid({ items }: { items: MatchItem[] }) {
  if (items.length === 0) {
    return <div className="panel p-6 text-center text-sm text-slate-400">No line items to display yet.</div>;
  }

  return (
    <div className="panel overflow-hidden">
      <div className="overflow-auto" style={{ maxHeight: '80vh' }}>
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {COLS.map((c) => (
                <th key={c} className="whitespace-nowrap px-3 py-2.5">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const qtyIssue = item.reasons.some((r) => r.includes("qty_exceeds") || r === "item_missing_in_po");
              return (
                <tr key={item.key} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                  <td className="px-3 py-2.5 font-medium text-ink-900">
                    <div className="flex items-center gap-1.5">
                      {item.description || "—"}
                      {item.unmappedMasterSku && (
                        <span title="Unmapped SKU — not found in SKU Master">
                          <AlertCircle size={13} className="text-warn-500" />
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs text-slate-500">{item.itemCode || "—"}</td>
                  <td className={clsx("px-3 py-2.5", item.unmappedMasterSku ? "italic text-warn-600" : "text-slate-700")}>
                    {item.skuMaster?.name || "Unmapped"}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs text-slate-500">{item.skuMaster?.skuErpCode || "—"}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-slate-500">{item.skuMaster?.eanCode || "—"}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-slate-500">{item.skuMaster?.hsnCode || "—"}</td>
                  <td className="px-3 py-2.5 text-slate-600">{item.skuMaster?.uom || "—"}</td>
                  <td className={clsx("px-3 py-2.5 font-mono", qtyIssue && "rounded bg-bad-50 font-semibold text-bad-700")}>{item.poQuantity}</td>
                  <td className={clsx("px-3 py-2.5 font-mono", qtyIssue && "rounded bg-bad-50 font-semibold text-bad-700")}>{item.grnQuantity}</td>
                  <td className={clsx("px-3 py-2.5 font-mono", qtyIssue && "rounded bg-bad-50 font-semibold text-bad-700")}>{item.invoiceQuantity}</td>
                  <td className={clsx("px-3 py-2.5 font-mono", item.priceMismatch && "rounded bg-bad-50 font-semibold text-bad-700")}>
                    {item.unitRate ? item.unitRate.toFixed(2) : "—"}
                  </td>
                  <td className={clsx("px-3 py-2.5 font-mono", item.mrpMismatch && "rounded bg-bad-50 font-semibold text-bad-700")}>
                    {item.mrp ? item.mrp.toFixed(2) : "—"}
                  </td>
                  <td className="px-3 py-2.5 font-mono font-medium text-ink-900">{item.grossAmount.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
