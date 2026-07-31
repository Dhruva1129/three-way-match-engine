"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, X, Search } from "lucide-react";
import { useCreateSkuMaster, useDeleteSkuMaster, useSkuMasters, useUpdateSkuMaster } from "@/hooks/useSkuMasters";
import { SkuMaster } from "@/lib/types";
import { ApiError } from "@/lib/api";

const EMPTY_FORM = { skuErpCode: "", name: "", eanCode: "", hsnCode: "", uom: "EA", agreedRate: 0, mrp: 0, priceTolerance: 0.05 };

export function SkuMasterTable() {
  const [search, setSearch] = useState("");
  const { data: skus, isLoading } = useSkuMasters(search);
  const [editing, setEditing] = useState<SkuMaster | null>(null);
  const [creating, setCreating] = useState(false);
  const deleteMutation = useDeleteSkuMaster();

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="relative w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code, name, or EAN…"
            className="w-full rounded-md border border-slate-200 py-2 pl-8 pr-3 text-sm outline-none focus:border-brand-400"
          />
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 rounded-md bg-brand-500 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          <Plus size={15} /> Add SKU
        </button>
      </div>

      <div className="panel overflow-hidden">
        <div className="overflow-auto" style={{ maxHeight: '80vh' }}>
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-3 py-2.5">ERP Code</th>
              <th className="px-3 py-2.5">Name</th>
              <th className="px-3 py-2.5">EAN</th>
              <th className="px-3 py-2.5">HSN</th>
              <th className="px-3 py-2.5">UOM</th>
              <th className="px-3 py-2.5">Agreed Rate</th>
              <th className="px-3 py-2.5">MRP</th>
              <th className="px-3 py-2.5">Tolerance</th>
              <th className="px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            )}
            {!isLoading && skus?.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-slate-400">
                  No SKU Master records yet.
                </td>
              </tr>
            )}
            {skus?.map((sku) => (
              <tr key={sku._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                <td className="px-3 py-2.5 font-mono text-xs">{sku.skuErpCode}</td>
                <td className="px-3 py-2.5 font-medium text-ink-900">{sku.name}</td>
                <td className="px-3 py-2.5 font-mono text-xs text-slate-500">{sku.eanCode || "—"}</td>
                <td className="px-3 py-2.5 font-mono text-xs text-slate-500">{sku.hsnCode || "—"}</td>
                <td className="px-3 py-2.5">{sku.uom}</td>
                <td className="px-3 py-2.5 font-mono">{sku.agreedRate?.toFixed(2)}</td>
                <td className="px-3 py-2.5 font-mono">{sku.mrp?.toFixed(2)}</td>
                <td className="px-3 py-2.5 font-mono">{(sku.priceTolerance * 100).toFixed(0)}%</td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1">
                    <button onClick={() => setEditing(sku)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600">
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete SKU Master "${sku.skuErpCode}"?`)) deleteMutation.mutate(sku._id);
                      }}
                      className="rounded p-1.5 text-slate-400 hover:bg-bad-50 hover:text-bad-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {(creating || editing) && <SkuMasterFormModal sku={editing} onClose={() => {
        setCreating(false);
        setEditing(null);
      }} />}
    </div>
  );
}

function SkuMasterFormModal({ sku, onClose }: { sku: SkuMaster | null; onClose: () => void }) {
  const [form, setForm] = useState(
    sku
      ? { skuErpCode: sku.skuErpCode, name: sku.name, eanCode: sku.eanCode || "", hsnCode: sku.hsnCode || "", uom: sku.uom || "EA", agreedRate: sku.agreedRate, mrp: sku.mrp, priceTolerance: sku.priceTolerance }
      : EMPTY_FORM
  );
  const [error, setError] = useState<string | null>(null);
  const createMutation = useCreateSkuMaster();
  const updateMutation = useUpdateSkuMaster();
  const isPending = createMutation.isPending || updateMutation.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.skuErpCode || !form.name) {
      setError("skuErpCode and name are required.");
      return;
    }
    try {
      if (sku) {
        await updateMutation.mutateAsync({ id: sku._id, payload: form });
      } else {
        await createMutation.mutateAsync(form);
      }
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 px-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink-900">{sku ? "Edit SKU Master" : "Add SKU Master"}</h2>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
          <Field label="ERP Code" value={form.skuErpCode} onChange={(v) => setForm({ ...form, skuErpCode: v })} />
          <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Field label="EAN Code" value={form.eanCode} onChange={(v) => setForm({ ...form, eanCode: v })} />
          <Field label="HSN Code" value={form.hsnCode} onChange={(v) => setForm({ ...form, hsnCode: v })} />
          <Field label="UOM" value={form.uom} onChange={(v) => setForm({ ...form, uom: v })} />
          <Field label="Agreed Rate" type="number" value={String(form.agreedRate)} onChange={(v) => setForm({ ...form, agreedRate: Number(v) })} />
          <Field label="MRP" type="number" value={String(form.mrp)} onChange={(v) => setForm({ ...form, mrp: Number(v) })} />
          <Field
            label="Price Tolerance (fraction)"
            type="number"
            value={String(form.priceTolerance)}
            onChange={(v) => setForm({ ...form, priceTolerance: Number(v) })}
          />

          {error && <div className="col-span-2 rounded-md bg-bad-50 px-3 py-2 text-sm text-bad-700">{error}</div>}

          <button
            type="submit"
            disabled={isPending}
            className="col-span-2 mt-1 rounded-md bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {isPending ? "Saving…" : "Save"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="field-label mb-1 block">{label}</span>
      <input
        type={type}
        step={type === "number" ? "0.01" : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-slate-200 px-2.5 py-2 text-sm outline-none focus:border-brand-400"
      />
    </label>
  );
}
