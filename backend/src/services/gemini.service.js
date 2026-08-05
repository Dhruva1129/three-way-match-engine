const fs = require("fs");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const PROMPTS = {
  po: `You are a document extraction engine for a procurement system.
Extract data from this Purchase Order (PO) document image/PDF and return ONLY valid JSON
(no markdown fences, no commentary) matching exactly this shape:

{
  "poNumber": string,
  "poDate": string (ISO 8601, e.g. "2024-05-01"),
  "expiryDate": string (ISO 8601 or ""),
  "deliveryDate": string (ISO 8601 or ""),
  "vendorName": string,
  "vendorGST": string,
  "vendorAddress": string,
  "customerName": string,
  "customerGST": string,
  "billingAddress": string,
  "shippingAddress": string,
  "totalSKUs": number,
  "totalQuantity": number,
  "netAmount": number,
  "grossAmount": number,
  "items": [
    { "itemCode": string, "description": string, "quantity": number, "unitRate": number, "mrp": number }
  ]
}

Rules:
- itemCode is the vendor/ERP item code printed on the line.
- Extract only values clearly present on the PO document. Omit keys or use "" / 0 if not present on the document.
- quantity, unitRate, mrp, netAmount must be numeric.
- Return every line item found on the PO.`,

  grn: `You are a document extraction engine for a procurement system.
Extract data from this Goods Receipt Note (GRN) document image/PDF and return ONLY valid JSON
(no markdown fences, no commentary) matching exactly this shape:

{
  "grnNumber": string,
  "poNumber": string,
  "grnDate": string (ISO 8601, e.g. "2024-05-01"),
  "vendorName": string,
  "vendorGST": string,
  "challanNumber": string,
  "challanDate": string (ISO 8601 or ""),
  "totalReceivedQuantity": number,
  "items": [
    { "itemCode": string, "description": string, "receivedQuantity": number, "mrp": number }
  ]
}

Rules:
- itemCode is the vendor/ERP item code printed on the line.
- poNumber is the purchase order reference on the GRN document.
- Extract only values clearly present on the GRN document. Omit keys or use "" / 0 if not present.`,

  invoice: `You are a document extraction engine for a procurement system.
Extract data from this Invoice document image/PDF and return ONLY valid JSON
(no markdown fences, no commentary) matching exactly this shape:

{
  "invoiceNumber": string,
  "poNumber": string,
  "invoiceDate": string (ISO 8601, e.g. "2024-05-01"),
  "dueDate": string (ISO 8601 or ""),
  "customerName": string,
  "customerGST": string,
  "billingAddress": string,
  "shippingAddress": string,
  "totalSKUs": number,
  "netAmount": number,
  "taxAmount": number,
  "grossAmount": number,
  "items": [
    { "itemCode": string, "description": string, "quantity": number, "unitRate": number, "mrp": number }
  ]
}

Rules:
- itemCode is the vendor/ERP item code printed on the line.
- poNumber is the purchase order reference on the invoice.
- Extract only values clearly present on the Invoice document. Omit keys or use "" / 0 if not present.`
};

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your-gemini-api-key-here") {
    throw new Error("GEMINI_API_KEY is not configured on the server");
  }
  return new GoogleGenerativeAI(apiKey);
}

function fileToGenerativePart(filePath, mimeType) {
  const data = fs.readFileSync(filePath).toString("base64");
  return { inlineData: { data, mimeType } };
}

function stripJsonFences(text) {
  return text
    .trim()
    .replace(/^```json/i, "")
    .replace(/^```/, "")
    .replace(/```$/, "")
    .trim();
}

/**
 * Calls Gemini with a document-type-specific prompt and returns the raw
 * parsed JSON object (untrusted — validated by the caller before persisting).
 * Retries once on malformed (non-JSON) output.
 */
async function extractDocument({ documentType, filePath, mimeType }) {
  const prompt = PROMPTS[documentType];
  if (!prompt) throw new Error(`Unsupported documentType: ${documentType}`);

  const genAI = getClient();
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" },
  });

  const filePart = fileToGenerativePart(filePath, mimeType);

  let lastError;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const result = await model.generateContent([prompt, filePart]);
      const text = result.response.text();
      const cleaned = stripJsonFences(text);
      return JSON.parse(cleaned);
    } catch (err) {
      lastError = err;
      console.warn(`[gemini] extraction attempt ${attempt} failed: ${err.message}`);
    }
  }
  throw new Error(`Gemini extraction failed after retry: ${lastError?.message || "unknown error"}`);
}

module.exports = { extractDocument };
