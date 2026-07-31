const mongoose = require("mongoose");

const PoItemSchema = new mongoose.Schema(
  {
    itemCode: { type: String, required: true },
    normalizedCode: { type: String, required: true }, // fallback matching key
    description: { type: String, default: "" },
    quantity: { type: Number, default: 0 },
    skuMaster: { type: mongoose.Schema.Types.ObjectId, ref: "SkuMaster", default: null },
    unmappedMasterSku: { type: Boolean, default: false },
  },
  { _id: false }
);

const PurchaseOrderSchema = new mongoose.Schema(
  {
    // NOTE: intentionally NOT unique at the DB level. A duplicate PO for the
    // same poNumber must still be storable (surfaced as `duplicate_po`),
    // never overwritten or rejected — see services/duplication.service.js
    poNumber: { type: String, required: true, trim: true, index: true },
    poDate: { type: Date, required: true },
    vendorName: { type: String, default: "" },
    items: { type: [PoItemSchema], default: [] },
    rawParsed: { type: mongoose.Schema.Types.Mixed }, // unmodified Gemini output
    sourceFile: {
      filename: String,
      originalName: String,
      mimeType: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PurchaseOrder", PurchaseOrderSchema);
