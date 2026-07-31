const { AppError } = require("../middleware/errorHandler");

const REQUIRED_FIELDS = {
  po: ["poNumber", "poDate", "vendorName", "items"],
  grn: ["grnNumber", "poNumber", "grnDate", "items"],
  invoice: ["invoiceNumber", "poNumber", "invoiceDate", "items"],
};

const REQUIRED_ITEM_FIELDS = {
  po: ["itemCode", "description", "quantity"],
  grn: ["itemCode", "description", "receivedQuantity"],
  invoice: ["itemCode", "description", "quantity"],
};

/**
 * Validates that Gemini's returned JSON has the minimum required shape for
 * the given documentType. Treats Gemini output as untrusted input: this is
 * the gate that stops partial/malformed documents from being persisted.
 * Throws AppError(422, ...) with a clear, specific message on failure.
 */
function validateExtractedDocument(documentType, parsed) {
  if (!parsed || typeof parsed !== "object") {
    throw new AppError(422, "Extraction did not return a JSON object");
  }

  const requiredFields = REQUIRED_FIELDS[documentType];
  const missingTopLevel = requiredFields.filter((f) => parsed[f] === undefined || parsed[f] === null || parsed[f] === "");
  // poDate/grnDate/invoiceDate and identifiers must be non-empty; items array is checked separately below.
  const missingRequired = missingTopLevel.filter((f) => f !== "items");
  if (missingRequired.length > 0) {
    throw new AppError(422, `Extraction is missing required field(s): ${missingRequired.join(", ")}`);
  }

  if (!Array.isArray(parsed.items) || parsed.items.length === 0) {
    throw new AppError(422, "Extraction returned no line items");
  }

  const requiredItemFields = REQUIRED_ITEM_FIELDS[documentType];
  parsed.items.forEach((item, idx) => {
    const missing = requiredItemFields.filter((f) => item[f] === undefined || item[f] === null || item[f] === "");
    if (missing.length > 0) {
      throw new AppError(422, `Line item ${idx + 1} is missing required field(s): ${missing.join(", ")}`);
    }
  });

  const dateField = { po: "poDate", grn: "grnDate", invoice: "invoiceDate" }[documentType];
  const date = new Date(parsed[dateField]);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(422, `Field "${dateField}" is not a valid date: ${parsed[dateField]}`);
  }

  return true;
}

module.exports = { validateExtractedDocument };
