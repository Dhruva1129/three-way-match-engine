export type DocumentType = "po" | "grn" | "invoice";

export type MatchStatus = "insufficient_documents" | "mismatch" | "partially_matched" | "matched";

export interface SkuMaster {
  _id: string;
  skuErpCode: string;
  name: string;
  eanCode?: string | null;
  hsnCode?: string | null;
  uom?: string;
  agreedRate: number;
  mrp: number;
  priceTolerance: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface MatchItem {
  key: string;
  itemCode: string;
  description: string;
  skuMaster: {
    id: string;
    skuErpCode: string;
    name: string;
    eanCode?: string | null;
    hsnCode?: string | null;
    uom?: string;
    agreedRate: number;
    mrp: number;
  } | null;
  unmappedMasterSku: boolean;
  onPO: boolean;
  onGRN: boolean;
  onInvoice: boolean;
  poQuantity: number;
  grnQuantity: number;
  invoiceQuantity: number;
  unitRate: number;
  mrp: number;
  grossAmount: number;
  priceMismatch: boolean;
  mrpMismatch: boolean;
  reasons: string[];
}

export interface DocSummaryRef {
  id: string;
  poNumber?: string;
  grnNumber?: string;
  invoiceNumber?: string;
  poDate?: string;
  grnDate?: string;
  invoiceDate?: string;
  vendorName?: string;
  createdAt: string;
}

export interface MatchResult {
  poNumber: string;
  status: MatchStatus;
  reasons: string[];
  missing: { po: boolean; grn: boolean; invoice: boolean };
  documents: { po: DocSummaryRef[]; grn: DocSummaryRef[]; invoice: DocSummaryRef[] };
  items: MatchItem[];
  audit: { step: string; status: string; message: string; at: string }[];
}

export interface SummaryRow {
  documentType: string;
  documentNumber: string;
  date: string | null;
  itemCount: number;
  quantity: number | null;
  poQuantity?: number;
  receivedQuantity?: number;
  invoicedQuantity?: number;
  pendingDelivery?: number;
  status: string;
}

export interface SummaryResult {
  poNumber: string;
  status: MatchStatus;
  stats: { poAmount: number; totalInvoiced: number; totalReceived: number };
  rows: SummaryRow[];
}

export interface DocItem {
  itemCode: string;
  normalizedCode: string;
  description: string;
  quantity?: number;
  receivedQuantity?: number;
  unitRate?: number;
  mrp?: number;
  skuMaster?: SkuMaster | null;
  unmappedMasterSku: boolean;
}

export interface DocumentRecord {
  _id: string;
  poNumber: string;
  grnNumber?: string;
  invoiceNumber?: string;
  poDate?: string;
  grnDate?: string;
  invoiceDate?: string;
  vendorName?: string;
  items: DocItem[];
  rawParsed?: unknown;
  sourceFile?: { filename: string; originalName: string; mimeType: string };
  createdAt: string;
}

export const REASON_LABELS: Record<string, string> = {
  grn_qty_exceeds_po_qty: "GRN Qty Exceeds PO Qty",
  invoice_qty_exceeds_grn_qty: "Invoice Qty Exceeds GRN Qty",
  invoice_qty_exceeds_po_qty: "Invoice Qty Exceeds PO Qty",
  invoice_date_after_po_date: "Invoice Date After PO Date",
  duplicate_po: "Duplicate PO",
  duplicate_document: "Duplicate Document",
  item_missing_in_po: "Item Missing In PO",
  price_mismatch: "Price Mismatch",
  mrp_mismatch: "MRP Mismatch",
  unmapped_master_sku: "Unmapped SKU",
};
