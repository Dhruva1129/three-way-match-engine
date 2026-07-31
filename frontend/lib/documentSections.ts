import { DocumentSection } from "@/components/DocumentDetailPanel";
import { DocumentRecord } from "@/lib/types";

function fmtDateShort(d?: string | null) {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function poNetAmount(items: { unitRate?: number; quantity?: number; receivedQuantity?: number }[]) {
  return items.reduce((s, it) => s + (it.unitRate || 0) * (it.quantity ?? it.receivedQuantity ?? 0), 0);
}

function poDetailsSection(po?: DocumentRecord | null): DocumentSection {
  const net = po ? poNetAmount(po.items) : 0;
  return {
    title: "PO Details",
    fields: [
      { label: "PO Number", value: po?.poNumber || "5115257658" },
      { label: "PO Date", value: fmtDateShort(po?.poDate) || "16/07/2026" },
      { label: "Expiry Date", value: "24/07/2026" },
      { label: "Delivery Date", value: "24/07/2026" },
      { label: "Total SKUs", value: po ? String(po.items.length) : "" },
      { label: "Net Amount", value: net ? net.toFixed(2) : "119291.98", colSpan: 5 },
    ],
  };
}

function buyerDetailsSection(): DocumentSection {
  return {
    title: "Buyer Details",
    fields: [
      { label: "Account Name", value: "RRL" },
      { label: "Sub Account", value: "Reliance Retail Limited" },
      { label: "Store Name", value: "RRL_Nelamangala(FREC)" },
      { label: "Store Code", value: "FREC" },
      { label: "Store GST", value: "29AABCR1718E1ZL" },
    ],
  };
}

function vendorDetailsSection(po?: DocumentRecord | null): DocumentSection {
  return {
    title: "Vendor Details",
    fields: [
      { label: "Vendor Name", value: po?.vendorName || "Bikaji Foods International Ltd." },
      { label: "Vendor GST", value: "08AAACB2894E1Z5" },
      { label: "Vendor Address", value: "B-38, MIA Extension, Bikaner, Rajasthan", colSpan: 3 },
      { label: "Vendor Pincode", value: "334001" },
      { label: "Contact Person", value: "" },
      { label: "Contact Number", value: "" },
    ],
  };
}

function depotDetailsSection(): DocumentSection {
  return {
    title: "Depot Details",
    fields: [
      { label: "Depot Name", value: "BFIL_Tumakuru" },
      { label: "Depot GST", value: "29AAICS1030P2ZO" },
      { label: "Depot Address", value: "Plot No 26B India Food Park Vasan...", colSpan: 2 },
      { label: "Depot Pincode", value: "572138" },
    ],
  };
}

function deliveryConfigSection(): DocumentSection {
  return {
    title: "Delivery Config",
    fields: [
      { label: "Delivery Mode", value: "" },
      { label: "Transporter", value: "" },
      { label: "LR Number", value: "" },
      { label: "LR Date", placeholder: "dd/mm/yyyy" },
      { label: "POD Status", value: "Pending" },
    ],
  };
}

function invoiceDetailsSection(invoice: DocumentRecord): DocumentSection {
  const net = poNetAmount(invoice.items);
  return {
    title: "Invoice Details",
    fields: [
      { label: "Account Name", value: "RRL" },
      { label: "Sub Account", value: "Reliance Retail Limited" },
      { label: "Store Name", value: "RRL_Nelamangala(FREC)" },
      { label: "Store Code", value: "FREC" },
      { label: "Store GST", value: "29AABCR1718E1ZL" },
      { label: "Invoice Number", value: invoice.invoiceNumber || "B12729000200" },
      { label: "Due Date", placeholder: "dd/mm/yyyy" },
      { label: "Invoice Date", value: fmtDateShort(invoice.invoiceDate) || "16/07/2026" },
      { label: "Net Amount", value: net ? String(net) : "8400" },
      { label: "Outstanding Amount", value: "" },
      { label: "Paid Amount", value: "", colSpan: 5 },
    ],
  };
}

function grnDetailsSection(grn: DocumentRecord): DocumentSection {
  return {
    title: "GRN Details",
    fields: [
      { label: "GRN Number", value: grn.grnNumber || "5107297866" },
      { label: "GRN Date", value: fmtDateShort(grn.grnDate) || "17/07/2026" },
      { label: "Challan Number", value: "" },
      { label: "Challan Date", placeholder: "dd/mm/yyyy" },
      { label: "POD Status", value: "Pending" },
    ],
  };
}

function linkedInvoiceDetailsSection(invoice?: DocumentRecord | null): DocumentSection {
  return {
    title: "Invoice Details",
    fields: [
      { label: "Invoice Number", value: invoice?.invoiceNumber || "812729000200" },
      { label: "Due Date", placeholder: "dd/mm/yyyy" },
      { label: "Invoice Date", value: fmtDateShort(invoice?.invoiceDate) || "16/07/2026" },
      { label: "Net Amount", value: "" },
      { label: "Outstanding Amount", value: "" },
      { label: "Paid Amount", value: "", colSpan: 5 },
    ],
  };
}

export function buildPoTabSections(po: DocumentRecord): DocumentSection[] {
  return [
    poDetailsSection(po),
    buyerDetailsSection(),
    vendorDetailsSection(po),
    depotDetailsSection(),
    deliveryConfigSection(),
  ];
}

export function buildFulfillmentTabSections(invoice: DocumentRecord, po?: DocumentRecord | null): DocumentSection[] {
  return [
    invoiceDetailsSection(invoice),
    poDetailsSection(po),
    depotDetailsSection(),
    deliveryConfigSection(),
  ];
}

export function buildDeliveryTabSections(
  grn: DocumentRecord,
  po?: DocumentRecord | null,
  invoice?: DocumentRecord | null
): DocumentSection[] {
  return [grnDetailsSection(grn), linkedInvoiceDetailsSection(invoice), poDetailsSection(po)];
}
