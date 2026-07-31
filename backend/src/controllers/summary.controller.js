const PurchaseOrder = require("../models/PurchaseOrder");
const Grn = require("../models/Grn");
const Invoice = require("../models/Invoice");
const { computeMatch } = require("../services/matching.service");
const { toNumber } = require("../utils/normalize");
const { AppError } = require("../middleware/errorHandler");

/**
 * GET /summary/:poNumber
 *
 * Returns the three stat cards (PO Amount, Total Invoiced, Total Received)
 * and the "Associated Invoice & GRN" table the frontend renders directly.
 *
 * Assumption (documented in README): PO Amount and Total Received are
 * valued at each item's SkuMaster.agreedRate (POs/GRNs don't carry a price
 * field in the data model); Total Invoiced uses each invoice line's own
 * unitRate, falling back to agreedRate when the invoice line omitted it.
 */
async function getSummary(req, res, next) {
  try {
    const { poNumber } = req.params;
    const match = await computeMatch(poNumber);

    if (match.status === "insufficient_documents" && match.documents.po.length === 0) {
      throw new AppError(404, `No PO found for poNumber "${poNumber}"`);
    }

    let poAmount = 0;
    let totalInvoiced = 0;
    let totalReceived = 0;

    for (const item of match.items) {
      const rate = item.skuMaster?.agreedRate ? toNumber(item.skuMaster.agreedRate) : 0;
      poAmount += item.poQuantity * rate;
      totalReceived += item.grnQuantity * rate;
      const invoiceRate = item.unitRate > 0 ? item.unitRate : rate;
      totalInvoiced += item.invoiceQuantity * invoiceRate;
    }

    const [pos, grns, invoices] = await Promise.all([
      PurchaseOrder.find({ poNumber }).sort({ createdAt: 1 }).lean(),
      Grn.find({ poNumber }).sort({ createdAt: 1 }).lean(),
      Invoice.find({ poNumber }).sort({ createdAt: 1 }).lean(),
    ]);

    const rows = [
      ...pos.map((p) => ({
        documentType: "PO",
        documentNumber: p.poNumber,
        date: p.poDate,
        itemCount: p.items.length,
        quantity: sumField(p.items, "quantity"),
        status: "Raised",
      })),
      ...grns.map((g) => ({
        documentType: "GRN",
        documentNumber: g.grnNumber,
        date: g.grnDate,
        itemCount: g.items.length,
        quantity: sumField(g.items, "receivedQuantity"),
        status: "Received",
      })),
      ...invoices.map((i) => ({
        documentType: "Invoice",
        documentNumber: i.invoiceNumber,
        date: i.invoiceDate,
        itemCount: i.items.length,
        quantity: sumField(i.items, "quantity"),
        status: "Invoiced",
      })),
    ].sort((a, b) => new Date(a.date) - new Date(b.date));

    const totalPOQty = match.items.reduce((s, i) => s + i.poQuantity, 0);
    const totalReceivedQty = match.items.reduce((s, i) => s + i.grnQuantity, 0);
    const totalInvoicedQty = match.items.reduce((s, i) => s + i.invoiceQuantity, 0);
    const pendingDelivery = Math.max(totalPOQty - totalReceivedQty, 0);

    rows.push({
      documentType: "Current Status",
      documentNumber: "—",
      date: null,
      itemCount: match.items.length,
      quantity: null,
      poQuantity: totalPOQty,
      receivedQuantity: totalReceivedQty,
      invoicedQuantity: totalInvoicedQty,
      pendingDelivery,
      status: match.status,
    });

    res.json({
      poNumber,
      status: match.status,
      stats: {
        poAmount: round2(poAmount),
        totalInvoiced: round2(totalInvoiced),
        totalReceived: round2(totalReceived),
      },
      rows,
    });
  } catch (err) {
    next(err);
  }
}

function sumField(items, field) {
  return (items || []).reduce((s, it) => s + toNumber(it[field]), 0);
}

function round2(n) {
  return Number(n.toFixed(2));
}

module.exports = { getSummary };
