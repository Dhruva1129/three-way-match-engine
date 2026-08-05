import { DocumentSection } from "@/components/DocumentDetailPanel";
import { DocumentRecord } from "@/lib/types";
import { FormFieldDef } from "@/components/FormSection";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function fmtDateShort(d?: string | null) {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtMoney(value?: number | string | null) {
  if (value === null || value === undefined || value === "") return "";
  const num = typeof value === "string" ? Number(value.replace(/[,₹\s]/g, "")) : value;
  if (!Number.isFinite(num) || num === 0) return "";
  return `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Converts camelCase, snake_case, or dot/space separated keys to human readable labels */
function toLabel(key: string): string {
  const customLabels: Record<string, string> = {
    poNumber: "PO Number",
    poDate: "PO Date",
    grnNumber: "GRN Number",
    grnDate: "GRN Date",
    invoiceNumber: "Invoice Number",
    invoiceDate: "Invoice Date",
    dueDate: "Due Date",
    expiryDate: "Expiry Date",
    deliveryDate: "Delivery Date",
    challanNumber: "Challan Number",
    challanDate: "Challan Date",
    vendorName: "Vendor Name",
    vendorGST: "Vendor GST",
    vendorAddress: "Vendor Address",
    accountName: "Account Name",
    subAccount: "Sub Account",
    storeName: "Store Name",
    storeCode: "Store Code",
    storeGST: "Store GST",
    storePinCode: "Store Pin Code",
    billingAddress: "Billing Address",
    storeERPCode: "Store ERP Code",
    shippingOutletGST: "Shipping Outlet GST",
    shippingOutletAddress: "Shipping Outlet Address",
    shippingOutletPincode: "Shipping Outlet Pincode",
    depotName: "Depot Name",
    depotGST: "Depot GST",
    depotAddress: "Depot Address",
    depotPincode: "Depot Pincode",
    totalSKUs: "Total SKUs",
    calculatedNetAmount: "Calculated Net Amount",
    grossAmount: "Gross Amount",
    poNetAmount: "PO Net Amount",
    totalQuantity: "Total Quantity",
    netAmount: "Net Amount",
    taxAmount: "Tax Amount",
    outstandingAmount: "Outstanding Amount",
    paidAmount: "Paid Amount",
  };

  if (customLabels[key]) return customLabels[key];

  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/\./g, " ")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

/** Recursively flattens nested objects into key-value map */
function flattenObject(
  obj: Record<string, unknown>,
  prefix = "",
  ignoreKeys: Set<string> = new Set()
): Record<string, string | number | boolean> {
  const result: Record<string, string | number | boolean> = {};
  if (!obj || typeof obj !== "object") return result;

  for (const [key, val] of Object.entries(obj)) {
    if (ignoreKeys.has(key) || key === "items" || key === "sourceFile") continue;

    const fullKey = prefix ? `${prefix} ${key}` : key;

    if (val !== null && val !== undefined && val !== "") {
      if (typeof val === "object" && !Array.isArray(val)) {
        Object.assign(result, flattenObject(val as Record<string, unknown>, fullKey, ignoreKeys));
      } else if (typeof val === "string" || typeof val === "number" || typeof val === "boolean") {
        const sVal = String(val).trim();
        if (sVal && sVal !== "null" && sVal !== "undefined") {
          result[fullKey] = val;
        }
      }
    }
  }

  return result;
}

/** Extracts FormFieldDef array from an object */
function extractFieldsFromObj(
  obj: Record<string, unknown>,
  ignoreKeys: Set<string> = new Set()
): FormFieldDef[] {
  const fields: FormFieldDef[] = [];
  const flattened = flattenObject(obj, "", ignoreKeys);

  for (const [key, val] of Object.entries(flattened)) {
    const strVal = String(val).trim();
    let formattedVal = strVal;

    if (key.toLowerCase().includes("date") && !isNaN(Date.parse(strVal)) && strVal.length >= 8) {
      formattedVal = fmtDateShort(strVal) || strVal;
    } else if (
      (key.toLowerCase().includes("amount") || key.toLowerCase().includes("price")) &&
      Number.isFinite(Number(strVal.replace(/[,₹\s]/g, "")))
    ) {
      const num = Number(strVal.replace(/[,₹\s]/g, ""));
      if (num > 0) formattedVal = fmtMoney(num);
    }

    const colSpan = (key.toLowerCase().includes("address") || strVal.length > 35) ? 2 : 1;
    fields.push({
      label: toLabel(key),
      value: formattedVal,
      colSpan: colSpan as 1 | 2,
    });
  }

  return fields;
}



/* ------------------------------------------------------------------ */
/*  PO Tab Sections                                                   */
/* ------------------------------------------------------------------ */

export function buildPoTabSections(po: DocumentRecord): DocumentSection[] {
  const sections: DocumentSection[] = [];
  const raw = (po.rawParsed && typeof po.rawParsed === "object") ? (po.rawParsed as Record<string, unknown>) : {};
  const processedKeys = new Set<string>(["items"]);

  // 1. Customer Details
  const custObj = (raw.customerDetails && typeof raw.customerDetails === "object") ? (raw.customerDetails as Record<string, unknown>) : {};
  const custFields = extractFieldsFromObj(custObj);
  if (custFields.length > 0) {
    processedKeys.add("customerDetails");
    sections.push({ title: "Customer Details", fields: custFields });
  } else {
    const flatCust = extractFieldsFromObj({
      accountName: raw.accountName || raw.customerName,
      subAccount: raw.subAccount,
      storeName: raw.storeName,
      storeCode: raw.storeCode,
      storeGST: raw.storeGST || raw.customerGST,
      storePinCode: raw.storePinCode || raw.storePincode,
      billingAddress: raw.billingAddress,
      storeERPCode: raw.storeERPCode || raw.storeErpCode,
      shippingOutletGST: raw.shippingOutletGST,
      shippingOutletAddress: raw.shippingOutletAddress,
      shippingOutletPincode: raw.shippingOutletPincode,
    });
    if (flatCust.length > 0) sections.push({ title: "Customer Details", fields: flatCust });
  }

  // 2. PO Details
  const poObj = (raw.poDetails && typeof raw.poDetails === "object") ? (raw.poDetails as Record<string, unknown>) : {};
  const poFields = extractFieldsFromObj(poObj);

  if (poFields.length > 0) {
    processedKeys.add("poDetails");
    if (!poFields.some((f) => f.label === "PO Number")) poFields.unshift({ label: "PO Number", value: po.poNumber });
    if (!poFields.some((f) => f.label === "PO Date") && po.poDate) poFields.splice(1, 0, { label: "PO Date", value: fmtDateShort(po.poDate) });
    sections.push({ title: "PO Details", fields: poFields });
  } else {
    const flatPo = extractFieldsFromObj({
      poNumber: po.poNumber,
      poDate: fmtDateShort(po.poDate || (raw.poDate as string)),
      expiryDate: fmtDateShort(raw.expiryDate as string),
      deliveryDate: fmtDateShort(raw.deliveryDate as string),
      totalSKUs: raw.totalSKUs || (po.items ? po.items.length : undefined),
      calculatedNetAmount: raw.calculatedNetAmount,
      grossAmount: raw.grossAmount,
      poNetAmount: raw.poNetAmount || raw.netAmount,
      totalQuantity: raw.totalQuantity,
    });
    if (flatPo.length > 0) sections.push({ title: "PO Details", fields: flatPo });
  }

  // 3. Vendor Details
  const vendorObj = (raw.vendorDetails && typeof raw.vendorDetails === "object") ? (raw.vendorDetails as Record<string, unknown>) : {};
  const vendorFields = extractFieldsFromObj(vendorObj);
  if (vendorFields.length > 0) {
    processedKeys.add("vendorDetails");
    sections.push({ title: "Vendor Details", fields: vendorFields });
  } else {
    const flatVendor = extractFieldsFromObj({
      vendorName: po.vendorName || (raw.vendorName as string),
      vendorGST: raw.vendorGST || raw.vendorGst,
      vendorAddress: raw.vendorAddress,
    });
    if (flatVendor.length > 0) {
      processedKeys.add("vendorName");
      processedKeys.add("vendorGST");
      processedKeys.add("vendorAddress");
      sections.push({ title: "Vendor Details", fields: flatVendor });
    }
  }

  // 4. Depot Details
  const depotObj = (raw.depotDetails && typeof raw.depotDetails === "object") ? (raw.depotDetails as Record<string, unknown>) : {};
  const depotFields = extractFieldsFromObj(depotObj);
  if (depotFields.length > 0) {
    processedKeys.add("depotDetails");
    sections.push({ title: "Depot Details", fields: depotFields });
  } else {
    const flatDepot = extractFieldsFromObj({
      depotName: raw.depotName,
      depotGST: raw.depotGST,
      depotAddress: raw.depotAddress,
      depotPincode: raw.depotPincode,
    });
    if (flatDepot.length > 0) sections.push({ title: "Depot Details", fields: flatDepot });
  }

  // 5. Remaining extracted top-level & nested attributes in rawParsed
  processedKeys.add("poNumber");
  processedKeys.add("poDate");
  const otherFields = extractFieldsFromObj(raw, processedKeys);
  if (otherFields.length > 0) {
    sections.push({ title: "Other Details", fields: otherFields });
  }

  return sections;
}

/* ------------------------------------------------------------------ */
/*  Fulfillment (Invoice) Tab Sections                                */
/* ------------------------------------------------------------------ */

export function buildFulfillmentTabSections(invoice: DocumentRecord, po?: DocumentRecord | null): DocumentSection[] {
  const sections: DocumentSection[] = [];
  const raw = (invoice.rawParsed && typeof invoice.rawParsed === "object") ? (invoice.rawParsed as Record<string, unknown>) : {};
  const poRaw = (po?.rawParsed && typeof po.rawParsed === "object") ? (po.rawParsed as Record<string, unknown>) : {};
  const processedKeys = new Set<string>(["items"]);

  // 1. Invoice Details
  const invObj = (raw.invoiceDetails && typeof raw.invoiceDetails === "object") ? (raw.invoiceDetails as Record<string, unknown>) : {};
  const invFields = extractFieldsFromObj(invObj);

  if (invFields.length > 0) {
    processedKeys.add("invoiceDetails");
    if (!invFields.some((f) => f.label === "Invoice Number")) invFields.unshift({ label: "Invoice Number", value: invoice.invoiceNumber });
    if (!invFields.some((f) => f.label === "Invoice Date") && invoice.invoiceDate) invFields.splice(1, 0, { label: "Invoice Date", value: fmtDateShort(invoice.invoiceDate) });
    sections.push({ title: "Invoice Details", fields: invFields });
  } else {
    const flatInv = extractFieldsFromObj({
      accountName: raw.accountName || raw.customerName || poRaw.accountName,
      subAccount: raw.subAccount || poRaw.subAccount,
      storeName: raw.storeName || poRaw.storeName,
      storeCode: raw.storeCode || poRaw.storeCode,
      storeGST: raw.storeGST || raw.customerGST || poRaw.storeGST,
      invoiceNumber: invoice.invoiceNumber,
      dueDate: fmtDateShort(raw.dueDate as string),
      invoiceDate: fmtDateShort(invoice.invoiceDate || (raw.invoiceDate as string)),
      netAmount: raw.netAmount,
      outstandingAmount: raw.outstandingAmount,
      paidAmount: raw.paidAmount,
    });
    if (flatInv.length > 0) sections.push({ title: "Invoice Details", fields: flatInv });
  }

  // 2. PO Details (from invoice rawParsed or linked PO)
  const poObj = (raw.poDetails && typeof raw.poDetails === "object") ? (raw.poDetails as Record<string, unknown>) : {};
  const poFields = extractFieldsFromObj(poObj);
  if (poFields.length > 0) {
    processedKeys.add("poDetails");
    sections.push({ title: "PO Details", fields: poFields });
  } else if (po || invoice.poNumber || raw.poNumber) {
    const flatPo = extractFieldsFromObj({
      poNumber: invoice.poNumber || po?.poNumber || (raw.poNumber as string),
      poDate: fmtDateShort(po?.poDate || (raw.poDate as string)),
      expiryDate: fmtDateShort(raw.expiryDate as string || poRaw.expiryDate as string),
      deliveryDate: fmtDateShort(raw.deliveryDate as string || poRaw.deliveryDate as string),
      totalSKUs: raw.totalSKUs || (po?.items ? po.items.length : undefined),
      netAmount: raw.poNetAmount || raw.netAmount || poRaw.poNetAmount,
    });
    if (flatPo.length > 0) sections.push({ title: "PO Details", fields: flatPo });
  }

  // 3. Depot Details (from invoice or linked PO)
  const depotObj = (raw.depotDetails && typeof raw.depotDetails === "object")
    ? (raw.depotDetails as Record<string, unknown>)
    : (poRaw.depotDetails && typeof poRaw.depotDetails === "object")
    ? (poRaw.depotDetails as Record<string, unknown>)
    : {};
  const depotFields = extractFieldsFromObj(depotObj);
  if (depotFields.length > 0) {
    processedKeys.add("depotDetails");
    sections.push({ title: "Depot Details", fields: depotFields });
  } else {
    const flatDepot = extractFieldsFromObj({
      depotName: raw.depotName || poRaw.depotName,
      depotGST: raw.depotGST || poRaw.depotGST,
      depotAddress: raw.depotAddress || poRaw.depotAddress,
      depotPincode: raw.depotPincode || poRaw.depotPincode,
    });
    if (flatDepot.length > 0) sections.push({ title: "Depot Details", fields: flatDepot });
  }

  // 4. Delivery Config
  const delConfigObj = (raw.deliveryConfig && typeof raw.deliveryConfig === "object") ? (raw.deliveryConfig as Record<string, unknown>) : {};
  const delConfigFields = extractFieldsFromObj(delConfigObj);
  if (delConfigFields.length > 0) {
    processedKeys.add("deliveryConfig");
    sections.push({ title: "Delivery Config", fields: delConfigFields });
  }

  // 5. Remaining extracted attributes from Invoice rawParsed
  processedKeys.add("invoiceNumber");
  processedKeys.add("invoiceDate");
  processedKeys.add("poNumber");
  const otherFields = extractFieldsFromObj(raw, processedKeys);
  if (otherFields.length > 0) {
    sections.push({ title: "Other Details", fields: otherFields });
  }

  return sections;
}

/* ------------------------------------------------------------------ */
/*  Delivery (GRN) Tab Sections                                       */
/* ------------------------------------------------------------------ */

export function buildDeliveryTabSections(
  grn: DocumentRecord,
  po?: DocumentRecord | null,
  invoice?: DocumentRecord | null
): DocumentSection[] {
  const sections: DocumentSection[] = [];
  const raw = (grn.rawParsed && typeof grn.rawParsed === "object") ? (grn.rawParsed as Record<string, unknown>) : {};
  const poRaw = (po?.rawParsed && typeof po.rawParsed === "object") ? (po.rawParsed as Record<string, unknown>) : {};
  const invRaw = (invoice?.rawParsed && typeof invoice.rawParsed === "object") ? (invoice.rawParsed as Record<string, unknown>) : {};
  const processedKeys = new Set<string>(["items"]);

  // 1. GRN Details
  const grnObj = (raw.grnDetails && typeof raw.grnDetails === "object") ? (raw.grnDetails as Record<string, unknown>) : {};
  const grnFields = extractFieldsFromObj(grnObj);

  if (grnFields.length > 0) {
    processedKeys.add("grnDetails");
    if (!grnFields.some((f) => f.label === "GRN Number")) grnFields.unshift({ label: "GRN Number", value: grn.grnNumber });
    if (!grnFields.some((f) => f.label === "GRN Date") && grn.grnDate) grnFields.splice(1, 0, { label: "GRN Date", value: fmtDateShort(grn.grnDate) });
    sections.push({ title: "GRN Details", fields: grnFields });
  } else {
    const flatGrn = extractFieldsFromObj({
      grnNumber: grn.grnNumber,
      grnDate: fmtDateShort(grn.grnDate || (raw.grnDate as string)),
      challanNumber: raw.challanNumber || raw.deliveryChallanNo,
      challanDate: fmtDateShort(raw.challanDate as string),
    });
    if (flatGrn.length > 0) sections.push({ title: "GRN Details", fields: flatGrn });
  }

  // 2. Invoice Details (from GRN rawParsed or linked Invoice)
  const invObj = (raw.invoiceDetails && typeof raw.invoiceDetails === "object")
    ? (raw.invoiceDetails as Record<string, unknown>)
    : (invRaw.invoiceDetails && typeof invRaw.invoiceDetails === "object")
    ? (invRaw.invoiceDetails as Record<string, unknown>)
    : {};
  const invFields = extractFieldsFromObj(invObj);

  if (invFields.length > 0) {
    processedKeys.add("invoiceDetails");
    sections.push({ title: "Invoice Details", fields: invFields });
  } else if (invoice || raw.invoiceNumber) {
    const flatInv = extractFieldsFromObj({
      invoiceNumber: invoice?.invoiceNumber || (raw.invoiceNumber as string),
      dueDate: fmtDateShort(raw.dueDate as string || invRaw.dueDate as string),
      invoiceDate: fmtDateShort(invoice?.invoiceDate || (raw.invoiceDate as string)),
      netAmount: raw.netAmount || invRaw.netAmount,
      outstandingAmount: raw.outstandingAmount || invRaw.outstandingAmount,
      paidAmount: raw.paidAmount || invRaw.paidAmount,
    });
    if (flatInv.length > 0) sections.push({ title: "Invoice Details", fields: flatInv });
  }

  // 3. PO Details (from GRN rawParsed or linked PO)
  const poObj = (raw.poDetails && typeof raw.poDetails === "object")
    ? (raw.poDetails as Record<string, unknown>)
    : (poRaw.poDetails && typeof poRaw.poDetails === "object")
    ? (poRaw.poDetails as Record<string, unknown>)
    : {};
  const poFields = extractFieldsFromObj(poObj);

  if (poFields.length > 0) {
    processedKeys.add("poDetails");
    sections.push({ title: "PO Details", fields: poFields });
  } else if (po || grn.poNumber || raw.poNumber) {
    const flatPo = extractFieldsFromObj({
      poNumber: grn.poNumber || po?.poNumber || (raw.poNumber as string),
      poDate: fmtDateShort(po?.poDate || (raw.poDate as string)),
      expiryDate: fmtDateShort(raw.expiryDate as string || poRaw.expiryDate as string),
      deliveryDate: fmtDateShort(raw.deliveryDate as string || poRaw.deliveryDate as string),
      totalSKUs: raw.totalSKUs || (po?.items ? po.items.length : undefined),
      netAmount: raw.poNetAmount || raw.netAmount || poRaw.poNetAmount,
    });
    if (flatPo.length > 0) sections.push({ title: "PO Details", fields: flatPo });
  }

  // 4. Depot Details (from GRN, PO, or Invoice)
  const depotObj = (raw.depotDetails && typeof raw.depotDetails === "object")
    ? (raw.depotDetails as Record<string, unknown>)
    : (poRaw.depotDetails && typeof poRaw.depotDetails === "object")
    ? (poRaw.depotDetails as Record<string, unknown>)
    : {};
  const depotFields = extractFieldsFromObj(depotObj);
  if (depotFields.length > 0) {
    processedKeys.add("depotDetails");
    sections.push({ title: "Depot Details", fields: depotFields });
  }

  // 5. Remaining extracted attributes from GRN rawParsed
  processedKeys.add("grnNumber");
  processedKeys.add("grnDate");
  processedKeys.add("poNumber");
  const otherFields = extractFieldsFromObj(raw, processedKeys);
  if (otherFields.length > 0) {
    sections.push({ title: "Other Details", fields: otherFields });
  }

  return sections;
}
