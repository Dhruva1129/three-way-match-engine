const PurchaseOrder = require("../models/PurchaseOrder");
const Grn = require("../models/Grn");
const Invoice = require("../models/Invoice");

/**
 * Runs right after persistence of a new document. Never blocks storage —
 * the document being checked has already been saved. This only surfaces
 * the conflict back to the uploader / audit log. The match engine
 * independently recomputes duplicate status from stored documents on every
 * read (see services/matching.service.js), so this is purely informational.
 */
async function checkDuplication(documentType, savedDoc) {
  if (documentType === "po") {
    const count = await PurchaseOrder.countDocuments({ poNumber: savedDoc.poNumber });
    if (count > 1) {
      return { duplicate: true, code: "duplicate_po", message: `A PO for poNumber "${savedDoc.poNumber}" already existed; this one was stored alongside it, not overwritten.` };
    }
    return { duplicate: false };
  }

  if (documentType === "grn") {
    const count = await Grn.countDocuments({ poNumber: savedDoc.poNumber, grnNumber: savedDoc.grnNumber });
    if (count > 1) {
      return { duplicate: true, code: "duplicate_document", message: `A GRN "${savedDoc.grnNumber}" already existed for poNumber "${savedDoc.poNumber}".` };
    }
    return { duplicate: false };
  }

  if (documentType === "invoice") {
    const count = await Invoice.countDocuments({ poNumber: savedDoc.poNumber, invoiceNumber: savedDoc.invoiceNumber });
    if (count > 1) {
      return { duplicate: true, code: "duplicate_document", message: `An Invoice "${savedDoc.invoiceNumber}" already existed for poNumber "${savedDoc.poNumber}".` };
    }
    return { duplicate: false };
  }

  return { duplicate: false };
}

module.exports = { checkDuplication };
