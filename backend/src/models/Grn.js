const mongoose = require("mongoose");

const GrnItemSchema = new mongoose.Schema(
  {
    itemCode: { type: String, required: true },
    normalizedCode: { type: String, required: true },
    description: { type: String, default: "" },
    receivedQuantity: { type: Number, default: 0 },
    mrp: { type: Number, default: null },
    skuMaster: { type: mongoose.Schema.Types.ObjectId, ref: "SkuMaster", default: null },
    unmappedMasterSku: { type: Boolean, default: false },
  },
  { _id: false }
);

const GrnSchema = new mongoose.Schema(
  {
    grnNumber: { type: String, required: true, trim: true, index: true }, // unique per poNumber (business rule, not DB constraint — see duplication check)
    poNumber: { type: String, required: true, trim: true, index: true }, // link key — PO need not exist yet
    grnDate: { type: Date, required: true },
    items: { type: [GrnItemSchema], default: [] },
    rawParsed: { type: mongoose.Schema.Types.Mixed },
    sourceFile: {
      filename: String,
      originalName: String,
      mimeType: String,
      fileData: { type: Buffer, default: null },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Grn", GrnSchema);
