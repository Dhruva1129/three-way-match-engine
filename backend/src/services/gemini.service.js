const fs = require("fs");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const PROMPTS = {
  po: `You are a document extraction engine for a procurement system.
Extract data from this Purchase Order (PO) document image/PDF and return ONLY valid JSON
(no markdown fences, no commentary) matching exactly this shape:

{
  "poNumber": string,
  "poDate": string (ISO 8601, e.g. "2024-05-01"),
  "vendorName": string,
  "items": [
    { "itemCode": string, "description": string, "quantity": number }
  ]
}

Rules:
- itemCode is the vendor/ERP item code printed on the line (not a row number).
- If a field is not visible on the document, use an empty string ("") for strings or 0 for numbers — never omit the key.
- quantity must be numeric (no units or commas).
- Return every line item found on the PO, including ones that may look duplicated.`,

  grn: `You are a document extraction engine for a procurement system.
Extract data from this Goods Receipt Note (GRN) document image/PDF and return ONLY valid JSON
(no markdown fences, no commentary) matching exactly this shape:

{
  "grnNumber": string,
  "poNumber": string,
  "grnDate": string (ISO 8601, e.g. "2024-05-01"),
  "items": [
    { "itemCode": string, "description": string, "receivedQuantity": number, "mrp": number }
  ]
}

Rules:
- itemCode is the vendor/ERP item code printed on the line (not a row number).
- poNumber is the purchase order this GRN fulfils — read it off the document even if the PO hasn't been uploaded yet.
- If mrp is not printed on the document, use 0.
- If a field is not visible, use "" for strings or 0 for numbers — never omit the key.`,

  invoice: `You are a document extraction engine for a procurement system.
Extract data from this Invoice document image/PDF and return ONLY valid JSON
(no markdown fences, no commentary) matching exactly this shape:

{
  "invoiceNumber": string,
  "poNumber": string,
  "invoiceDate": string (ISO 8601, e.g. "2024-05-01"),
  "items": [
    { "itemCode": string, "description": string, "quantity": number, "unitRate": number, "mrp": number }
  ]
}

Rules:
- itemCode is the vendor/ERP item code printed on the line (not a row number).
- unitRate is the per-unit billed price; mrp is the printed MRP if visible, else 0.
- If a field is not visible, use "" for strings or 0 for numbers — never omit the key.`,
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
