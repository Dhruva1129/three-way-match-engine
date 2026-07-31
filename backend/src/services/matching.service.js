const PurchaseOrder = require("../models/PurchaseOrder");
const Grn = require("../models/Grn");
const Invoice = require("../models/Invoice");
const SkuMaster = require("../models/SkuMaster");
const { toNumber } = require("../utils/normalize");

const HARD_REASONS = new Set([
  "grn_qty_exceeds_po_qty",
  "invoice_qty_exceeds_grn_qty",
  "invoice_qty_exceeds_po_qty",
  "invoice_date_after_po_date",
  "duplicate_po",
  "duplicate_document",
  "item_missing_in_po",
]);
const SOFT_REASONS = new Set(["price_mismatch", "mrp_mismatch", "unmapped_master_sku"]);

const MRP_TOLERANCE = 0.01; // ~1%

/**
 * The matching key for an item: the resolved SkuMaster._id when available,
 * otherwise the normalised raw itemCode (see README "Matching key" section
 * for the rationale). This lets an unresolved item still be compared
 * across documents by its own code instead of being invisible to matching.
 */
function itemKey(item) {
  return item.skuMaster ? `sku:${item.skuMaster.toString()}` : `code:${item.normalizedCode}`;
}

/**
 * Aggregates a list of items into a Map<key, { qty, ...meta }>, summing
 * quantities when the same SKU/code appears on multiple lines of the same
 * document (or across multiple documents of the same type, e.g. two GRNs).
 */
function aggregateItems(docs, qtyField) {
  const map = new Map();
  for (const doc of docs) {
    for (const item of doc.items || []) {
      const key = itemKey(item);
      const existing = map.get(key) || {
        key,
        description: item.description,
        itemCode: item.itemCode,
        skuMaster: item.skuMaster || null,
        unmappedMasterSku: !!item.unmappedMasterSku,
        qty: 0,
        lines: [],
      };
      existing.qty += toNumber(item[qtyField]);
      existing.unmappedMasterSku = existing.unmappedMasterSku || !!item.unmappedMasterSku;
      existing.lines.push({ docId: doc._id, item });
      if (!existing.description && item.description) existing.description = item.description;
      map.set(key, existing);
    }
  }
  return map;
}

/**
 * Recomputes the full three-way match for a poNumber from whatever is
 * currently in the database. Never reads from a cache — called fresh on
 * every GET /match/:poNumber per the spec.
 */
async function computeMatch(poNumber) {
  const [pos, grns, invoices, skuMasters] = await Promise.all([
    PurchaseOrder.find({ poNumber }).sort({ createdAt: 1 }).lean(),
    Grn.find({ poNumber }).sort({ createdAt: 1 }).lean(),
    Invoice.find({ poNumber }).sort({ createdAt: 1 }).lean(),
    SkuMaster.find({}).lean(),
  ]);

  const skuById = new Map(skuMasters.map((s) => [s._id.toString(), s]));

  const hasPO = pos.length > 0;
  const hasGRN = grns.length > 0;
  const hasInvoice = invoices.length > 0;

  const documentReasons = new Set();

  // Duplicate PO: more than one PO document stored for this poNumber.
  if (pos.length > 1) documentReasons.add("duplicate_po");

  // Duplicate GRN/Invoice: same grnNumber/invoiceNumber reused under this poNumber.
  const grnNumberCounts = countBy(grns, "grnNumber");
  const invoiceNumberCounts = countBy(invoices, "invoiceNumber");
  if ([...grnNumberCounts.values()].some((c) => c > 1)) documentReasons.add("duplicate_document");
  if ([...invoiceNumberCounts.values()].some((c) => c > 1)) documentReasons.add("duplicate_document");

  if (!hasPO || !hasGRN || !hasInvoice) {
    return {
      poNumber,
      status: "insufficient_documents",
      reasons: [...documentReasons],
      missing: {
        po: !hasPO,
        grn: !hasGRN,
        invoice: !hasInvoice,
      },
      documents: summarizeDocuments(pos, grns, invoices),
      items: [],
    };
  }

  // Canonical PO for quantity/date baselines = the earliest one uploaded.
  // Any additional PO for the same poNumber is stored (never overwritten)
  // but only flags duplicate_po — it doesn't get summed into the baseline,
  // since two POs can't both be "the" order quantity.
  const canonicalPO = pos[0];

  // Invoice date must never be after the canonical PO's date.
  const poDate = new Date(canonicalPO.poDate);
  for (const inv of invoices) {
    if (new Date(inv.invoiceDate) > poDate) {
      documentReasons.add("invoice_date_after_po_date");
      break;
    }
  }

  const poAgg = aggregateItems([canonicalPO], "quantity");
  const grnAgg = aggregateItems(grns, "receivedQuantity");
  const invAgg = aggregateItems(invoices, "quantity");

  const allKeys = new Set([...poAgg.keys(), ...grnAgg.keys(), ...invAgg.keys()]);

  const items = [];
  const allReasons = new Set(documentReasons);

  for (const key of allKeys) {
    const poEntry = poAgg.get(key);
    const grnEntry = grnAgg.get(key);
    const invEntry = invAgg.get(key);

    const onPO = !!poEntry;
    const onGRN = !!grnEntry;
    const onInvoice = !!invEntry;

    const poQty = poEntry ? poEntry.qty : 0;
    const grnQty = grnEntry ? grnEntry.qty : 0;
    const invQty = invEntry ? invEntry.qty : 0;

    const reasons = [];

    if ((onGRN || onInvoice) && !onPO) {
      reasons.push("item_missing_in_po");
    }
    if (onPO && grnQty > poQty) {
      reasons.push("grn_qty_exceeds_po_qty");
    }
    if (onGRN && invQty > grnQty) {
      reasons.push("invoice_qty_exceeds_grn_qty");
    } else if (!onGRN && onInvoice) {
      // Invoiced with nothing received at all — also exceeds (0) GRN qty.
      reasons.push("invoice_qty_exceeds_grn_qty");
    }
    if (onPO && invQty > poQty) {
      reasons.push("invoice_qty_exceeds_po_qty");
    }

    const skuMasterId = poEntry?.skuMaster || grnEntry?.skuMaster || invEntry?.skuMaster || null;
    const sku = skuMasterId ? skuById.get(skuMasterId.toString()) : null;
    const unmappedMasterSku = (poEntry?.unmappedMasterSku || grnEntry?.unmappedMasterSku || invEntry?.unmappedMasterSku) && !sku;
    if (unmappedMasterSku) reasons.push("unmapped_master_sku");

    // Representative unit rate / mrp for display + comparison: most recent invoice line for this key.
    const invLine = invEntry?.lines?.[invEntry.lines.length - 1]?.item;
    const grnLine = grnEntry?.lines?.[grnEntry.lines.length - 1]?.item;

    let priceMismatch = false;
    if (sku && invLine && toNumber(invLine.unitRate) > 0 && toNumber(sku.agreedRate) > 0) {
      const diff = Math.abs(toNumber(invLine.unitRate) - toNumber(sku.agreedRate));
      if (diff / toNumber(sku.agreedRate) > toNumber(sku.priceTolerance || 0.05)) {
        priceMismatch = true;
        reasons.push("price_mismatch");
      }
    }

    let mrpMismatch = false;
    const observedMrp = toNumber(invLine?.mrp) > 0 ? toNumber(invLine.mrp) : toNumber(grnLine?.mrp) > 0 ? toNumber(grnLine.mrp) : 0;
    if (sku && observedMrp > 0 && toNumber(sku.mrp) > 0) {
      const diff = Math.abs(observedMrp - toNumber(sku.mrp));
      if (diff / toNumber(sku.mrp) > MRP_TOLERANCE) {
        mrpMismatch = true;
        reasons.push("mrp_mismatch");
      }
    }

    reasons.forEach((r) => allReasons.add(r));

    const description = poEntry?.description || grnEntry?.description || invEntry?.description || "";
    const itemCode = poEntry?.itemCode || grnEntry?.itemCode || invEntry?.itemCode || "";
    const unitRate = toNumber(invLine?.unitRate) || 0;
    const mrp = observedMrp || toNumber(sku?.mrp) || 0;

    items.push({
      key,
      itemCode,
      description,
      skuMaster: sku
        ? {
            id: sku._id,
            skuErpCode: sku.skuErpCode,
            name: sku.name,
            eanCode: sku.eanCode,
            hsnCode: sku.hsnCode,
            uom: sku.uom,
            agreedRate: sku.agreedRate,
            mrp: sku.mrp,
          }
        : null,
      unmappedMasterSku,
      onPO,
      onGRN,
      onInvoice,
      poQuantity: poQty,
      grnQuantity: grnQty,
      invoiceQuantity: invQty,
      unitRate,
      mrp,
      grossAmount: Number((unitRate * invQty).toFixed(2)),
      priceMismatch,
      mrpMismatch,
      reasons,
    });
  }

  const hasHardViolation = [...allReasons].some((r) => HARD_REASONS.has(r));
  const hasSoftWarning = [...allReasons].some((r) => SOFT_REASONS.has(r));
  const fullyReconciled = items.every((it) => it.poQuantity === it.grnQuantity && it.grnQuantity === it.invoiceQuantity);

  let status;
  if (hasHardViolation) {
    status = "mismatch";
  } else if (hasSoftWarning || !fullyReconciled) {
    status = "partially_matched";
  } else {
    status = "matched";
  }

  return {
    poNumber,
    status,
    reasons: [...allReasons],
    missing: { po: false, grn: false, invoice: false },
    documents: summarizeDocuments(pos, grns, invoices),
    items: items.sort((a, b) => a.description.localeCompare(b.description)),
  };
}

function countBy(docs, field) {
  const counts = new Map();
  for (const d of docs) {
    counts.set(d[field], (counts.get(d[field]) || 0) + 1);
  }
  return counts;
}

function summarizeDocuments(pos, grns, invoices) {
  return {
    po: pos.map((p) => ({ id: p._id, poNumber: p.poNumber, poDate: p.poDate, vendorName: p.vendorName, createdAt: p.createdAt })),
    grn: grns.map((g) => ({ id: g._id, grnNumber: g.grnNumber, grnDate: g.grnDate, createdAt: g.createdAt })),
    invoice: invoices.map((i) => ({ id: i._id, invoiceNumber: i.invoiceNumber, invoiceDate: i.invoiceDate, createdAt: i.createdAt })),
  };
}

module.exports = { computeMatch };
