"use client";

import { Sidebar } from "@/components/Sidebar";
import {
  Upload,
  FileSearch,
  GitCompare,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Database,
  ArrowRight,
} from "lucide-react";

const STEPS = [
  {
    icon: Upload,
    title: "1. Upload a Document",
    color: "text-brand-500",
    bg: "bg-brand-50",
    description:
      "From the Purchase Orders page, click the 'Upload document' button. Select a file (PDF or image) and choose the document type — Purchase Order, GRN, or Invoice. The system accepts documents in any order; you don't need the PO first.",
  },
  {
    icon: FileSearch,
    title: "2. AI-Powered Extraction",
    color: "text-violet-500",
    bg: "bg-violet-50",
    description:
      "Once uploaded, the backend sends the file to Google Gemini AI, which reads the document and extracts structured fields like PO number, vendor name, line-item codes, quantities, and dates. You can review the extracted data on the PO workspace page.",
  },
  {
    icon: Database,
    title: "3. SKU Master Resolution",
    color: "text-teal-500",
    bg: "bg-teal-50",
    description:
      "Each extracted line item is automatically matched against the SKU Master catalogue. If a code can't be resolved, it is flagged as 'unmapped' so you can review and correct it from the SKU Master page.",
  },
  {
    icon: GitCompare,
    title: "4. Three-Way Matching",
    color: "text-blue-500",
    bg: "bg-blue-50",
    description:
      "When at least a PO, one GRN, and one Invoice exist for the same PO number, the engine automatically runs a three-way match. It compares quantities, unit rates, and item codes across all three documents line by line.",
  },
  {
    icon: AlertTriangle,
    title: "5. Mismatch Detection",
    color: "text-amber-500",
    bg: "bg-amber-50",
    description:
      "If any discrepancies are found — such as quantity differences between the PO and GRN, price mismatches between the PO and Invoice, or missing items — the system generates specific reason codes. These are displayed as banners on the PO workspace page.",
  },
  {
    icon: CheckCircle2,
    title: "6. Review the Summary",
    color: "text-emerald-500",
    bg: "bg-emerald-50",
    description:
      "Switch to the 'Summary' tab on any PO workspace to see consolidated statistics: total PO amount, total invoiced, total received, pending quantities, and a table listing every associated document with its status.",
  },
];

const PAGES = [
  {
    name: "Purchase Orders",
    description:
      "The home page. Lists all POs in the system. Click any PO to open its workspace. Use the search bar to filter by PO number or vendor name. You can also delete a PO and all its associated documents.",
  },
  {
    name: "PO Workspace (/po/[number])",
    description:
      "The detail view for a single PO. Contains four tabs — PO, Fulfillment (invoices), Delivery (GRNs), and Summary. Each tab shows extracted fields, a preview of the original document, and line-item tables.",
  },
  {
    name: "Documents",
    description:
      "A flat list of every uploaded document across all PO numbers. Useful for auditing or finding a specific invoice or GRN by its document number.",
  },
  {
    name: "SKU Master",
    description:
      "Manage the product catalogue used for item-code resolution. You can add, edit, or remove SKU entries. Items in uploaded documents are matched against this catalogue automatically.",
  },
];

const STATUSES = [
  {
    label: "Matched",
    color: "bg-emerald-100 text-emerald-700",
    meaning: "All three documents agree — quantities and prices match perfectly.",
  },
  {
    label: "Mismatched",
    color: "bg-red-100 text-red-700",
    meaning: "Discrepancies were found between the PO, GRN, and/or Invoice.",
  },
  {
    label: "Insufficient Documents",
    color: "bg-amber-100 text-amber-700",
    meaning: "Not all three document types have been uploaded yet for this PO.",
  },
];

export default function HowToUsePage() {
  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-ink-900">
              How to Use the Three-Way Match Engine
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              This application reconciles <strong>Purchase Orders (PO)</strong>,{" "}
              <strong>Goods Receipt Notes (GRN)</strong>, and{" "}
              <strong>Invoices</strong> using AI-powered document extraction and
              automated line-item comparison. Follow the steps below to get
              started.
            </p>
          </div>

          {/* Workflow Steps */}
          <section className="mb-10">
            <h2 className="mb-4 text-lg font-medium text-ink-800">
              <ClipboardList size={18} className="mr-2 inline text-brand-500" />
              Workflow — Step by Step
            </h2>
            <div className="space-y-4">
              {STEPS.map((step) => (
                <div
                  key={step.title}
                  className="flex gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${step.bg}`}
                  >
                    <step.icon size={20} className={step.color} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-ink-900">
                      {step.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Pages Guide */}
          <section className="mb-10">
            <h2 className="mb-4 text-lg font-medium text-ink-800">
              Pages Overview
            </h2>
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">Page</th>
                    <th className="px-4 py-3">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {PAGES.map((page) => (
                    <tr
                      key={page.name}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-ink-900">
                        {page.name}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {page.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Match Statuses */}
          <section className="mb-10">
            <h2 className="mb-4 text-lg font-medium text-ink-800">
              Match Status Reference
            </h2>
            <div className="space-y-3">
              {STATUSES.map((s) => (
                <div
                  key={s.label}
                  className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <span
                    className={`inline-flex items-center rounded px-2.5 py-0.5 text-xs font-medium ${s.color}`}
                  >
                    {s.label}
                  </span>
                  <span className="text-sm text-slate-600">{s.meaning}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}