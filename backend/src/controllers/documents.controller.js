const path = require("path");
const fs = require("fs");
const PurchaseOrder = require("../models/PurchaseOrder");
const Grn = require("../models/Grn");
const Invoice = require("../models/Invoice");
const { extractDocument } = require("../services/gemini.service");
const { validateExtractedDocument } = require("../services/parsing.service");
const { resolveItems } = require("../services/masterResolution.service");
const { checkDuplication } = require("../services/duplication.service");
const { logStep } = require("../services/audit.service");
const { AppError } = require("../middleware/errorHandler");
const { uploadDir } = require("../middleware/upload");

const MODEL_BY_TYPE = { po: PurchaseOrder, grn: Grn, invoice: Invoice };
const QTY_FIELD_BY_TYPE = { po: "quantity", grn: "receivedQuantity", invoice: "quantity" };

/**
 * POST /documents/upload
 * multipart: file, documentType
 *
 * Pipeline (plain functions called in sequence, per spec — no
 * engine/plugin abstraction for a task this size):
 *   1. store raw file (multer already did this)
 *   2. call Gemini with a document-type-specific prompt
 *   3. validate minimum required fields (retry-once already handled inside gemini.service)
 *   4. resolve each item against the SKU Master catalogue
 *   5. persist independently of whether a PO already exists for that poNumber
 *   6. run the duplication check (never blocks storage, only flags)
 */
async function uploadDocument(req, res, next) {
  let poNumberForAudit = null;
  try {
    const { documentType } = req.body;
    if (!["po", "grn", "invoice"].includes(documentType)) {
      throw new AppError(400, 'documentType must be one of "po", "grn", "invoice"');
    }
    if (!req.file) {
      throw new AppError(400, "file is required");
    }

    // Step 1: extraction
    let parsed;
    try {
      parsed = await extractDocument({
        documentType,
        filePath: req.file.path,
        mimeType: req.file.mimetype,
      });
    } catch (err) {
      await logStep(poNumberForAudit || "UNKNOWN", "parse", "error", err.message);
      throw new AppError(502, `Gemini extraction failed: ${err.message}`);
    }

    // Step 2: validation
    try {
      validateExtractedDocument(documentType, parsed);
    } catch (err) {
      await logStep(parsed?.poNumber || "UNKNOWN", "validate", "error", err.message);
      throw err;
    }

    poNumberForAudit = parsed.poNumber;
    await logStep(poNumberForAudit, "parse", "success", `Extracted ${documentType.toUpperCase()} via Gemini`);

    // Step 3: master resolution
    const resolvedItems = await resolveItems(parsed.items);
    const unmappedCount = resolvedItems.filter((i) => i.unmappedMasterSku).length;
    await logStep(
      poNumberForAudit,
      "master_resolution",
      unmappedCount > 0 ? "warning" : "success",
      unmappedCount > 0 ? `${unmappedCount} item(s) could not be resolved to a SKU Master record` : "All items resolved"
    );

    // Step 4: persist (independent of whether a PO exists yet for this poNumber)
    const Model = MODEL_BY_TYPE[documentType];
    const doc = new Model({
      ...buildDocFields(documentType, parsed),
      items: resolvedItems,
      rawParsed: parsed,
      sourceFile: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
      },
    });
    await doc.save();
    await logStep(poNumberForAudit, "persist", "success", `${documentType.toUpperCase()} stored (id ${doc._id})`);

    // Step 5: duplication check (informational — document is already saved)
    const dup = await checkDuplication(documentType, doc);
    if (dup.duplicate) {
      await logStep(poNumberForAudit, "duplication_check", "warning", dup.message);
    } else {
      await logStep(poNumberForAudit, "duplication_check", "success", "No duplicates found");
    }

    res.status(201).json({
      document: doc,
      documentType,
      duplication: dup,
      unmappedItemCount: unmappedCount,
    });
  } catch (err) {
    // Clean up the uploaded file if we failed before persisting anything useful,
    // so a rejected upload doesn't leave orphaned files on disk.
    if (req.file && !res.headersSent) {
      fs.unlink(req.file.path, () => {});
    }
    next(err);
  }
}

function buildDocFields(documentType, parsed) {
  if (documentType === "po") {
    return { poNumber: parsed.poNumber, poDate: parsed.poDate, vendorName: parsed.vendorName };
  }
  if (documentType === "grn") {
    return { grnNumber: parsed.grnNumber, poNumber: parsed.poNumber, grnDate: parsed.grnDate };
  }
  return { invoiceNumber: parsed.invoiceNumber, poNumber: parsed.poNumber, invoiceDate: parsed.invoiceDate };
}

/** GET /documents/:id — searches across PO/GRN/Invoice collections by _id. */
async function getDocumentById(req, res, next) {
  try {
    const { id } = req.params;
    for (const [type, Model] of Object.entries(MODEL_BY_TYPE)) {
      const doc = await Model.findById(id).populate("items.skuMaster");
      if (doc) return res.json({ documentType: type, document: doc });
    }
    throw new AppError(404, `No document found with id ${id}`);
  } catch (err) {
    next(err);
  }
}

/** GET /documents/:id/file — streams the original uploaded file for preview. */
async function getDocumentFile(req, res, next) {
  try {
    const { id } = req.params;
    let found = null;
    for (const Model of Object.values(MODEL_BY_TYPE)) {
      const doc = await Model.findById(id).lean();
      if (doc) {
        found = doc;
        break;
      }
    }
    if (!found) throw new AppError(404, `No document found with id ${id}`);
    if (!found.sourceFile?.filename) throw new AppError(404, "No source file stored for this document");

    const filePath = path.join(uploadDir, found.sourceFile.filename);
    if (!fs.existsSync(filePath)) throw new AppError(404, "Source file is missing from disk");

    res.setHeader("Content-Type", found.sourceFile.mimeType || "application/octet-stream");
    res.sendFile(filePath);
  } catch (err) {
    next(err);
  }
}

/** GET /documents?type=&poNumber= */
async function listDocuments(req, res, next) {
  try {
    const { type, poNumber } = req.query;
    const types = type ? [type] : Object.keys(MODEL_BY_TYPE);
    for (const t of types) {
      if (!MODEL_BY_TYPE[t]) throw new AppError(400, `Invalid type: ${t}`);
    }

    const filter = {};
    if (poNumber) filter.poNumber = poNumber;

    const results = {};
    for (const t of types) {
      results[t] = await MODEL_BY_TYPE[t].find(filter).sort({ createdAt: -1 }).select("-rawParsed");
    }

    res.json(type ? results[type] : results);
  } catch (err) {
    next(err);
  }
}

async function deleteByPoNumber(req, res, next) {
  try {
    const { poNumber } = req.params;
    if (!poNumber) throw new AppError(400, "poNumber is required");

    const poResult = await PurchaseOrder.deleteMany({ poNumber });
    const grnResult = await Grn.deleteMany({ poNumber });
    const invoiceResult = await Invoice.deleteMany({ poNumber });

    res.json({
      deleted: true,
      poNumber,
      counts: {
        po: poResult.deletedCount,
        grn: grnResult.deletedCount,
        invoice: invoiceResult.deletedCount,
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadDocument, getDocumentById, getDocumentFile, listDocuments, deleteByPoNumber };
