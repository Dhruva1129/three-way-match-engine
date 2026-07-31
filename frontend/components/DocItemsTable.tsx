import { AlertCircle } from "lucide-react";
import { DocItem } from "@/lib/types";

export function DocItemsTable({ items, showRate }: { items: DocItem[]; showRate: boolean }) {
  if (!items || items.length === 0) {
    return <div className="panel p-6 text-center text-sm text-slate-400">No line items to display.</div>;
  }

  return (
    <div className="panel overflow-hidden">
      <div className="overflow-auto" style={{ maxHeight: '80vh' }}>
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-3 py-2.5">SKU Name</th>
              <th className="px-3 py-2.5">SKU ID</th>
              <th className="px-3 py-2.5">Mapped SKU Name</th>
              <th className="px-3 py-2.5">ERP Code</th>
              <th className="px-3 py-2.5">EAN</th>
              <th className="px-3 py-2.5">HSN</th>
              <th className="px-3 py-2.5">UOM</th>
              <th className="px-3 py-2.5">Quantity</th>
              {showRate && <th className="px-3 py-2.5">Unit Price</th>}
              <th className="px-3 py-2.5">Unit MRP</th>
              {showRate && <th className="px-3 py-2.5">Gross Amount</th>}
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const qty = item.quantity ?? item.receivedQuantity ?? 0;
              const gross = (item.unitRate || 0) * qty;
              const sku = typeof item.skuMaster === "object" ? item.skuMaster : null;
              return (
                <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                  <td className="px-3 py-2.5 font-medium text-ink-900">
                    <div className="flex items-center gap-1.5">
                      {item.description || "—"}
                      {item.unmappedMasterSku && (
                        <span title="Unmapped SKU">
                          <AlertCircle size={13} className="text-warn-500" />
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs text-slate-500">{item.itemCode}</td>
                  <td className={`px-3 py-2.5 ${item.unmappedMasterSku ? "italic text-warn-600" : "text-slate-700"}`}>{sku?.name || "Unmapped"}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-slate-500">{sku?.skuErpCode || "—"}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-slate-500">{sku?.eanCode || "—"}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-slate-500">{sku?.hsnCode || "—"}</td>
                  <td className="px-3 py-2.5 text-slate-600">{sku?.uom || "—"}</td>
                  <td className="px-3 py-2.5 font-mono">{qty}</td>
                  {showRate && <td className="px-3 py-2.5 font-mono">{item.unitRate ? item.unitRate.toFixed(2) : "—"}</td>}
                  <td className="px-3 py-2.5 font-mono">{item.mrp ? item.mrp.toFixed(2) : "—"}</td>
                  {showRate && <td className="px-3 py-2.5 font-mono font-medium text-ink-900">{gross.toFixed(2)}</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
