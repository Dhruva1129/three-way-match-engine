const mongoose = require("mongoose");

const InvoiceItemSchema = new mongoose.Schema(
  {
    itemCode: { type: String, required: true },
    normalizedCode: { type: String, required: true },
    description: { type: String, default: "" },
    quantity: { type: Number, default: 0 },
    unitRate: { type: Number, default: null },
    mrp: { type: Number, default: null },
    skuMaster: { type: mongoose.Schema.Types.ObjectId, ref: "SkuMaster", default: null },
    unmappedMasterSku: { type: Boolean, default: false },
  },
  { _id: false }
);

const InvoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, trim: true, index: true }, // unique per poNumber (business rule)
    poNumber: { type: String, required: true, trim: true, index: true },
    invoiceDate: { type: Date, required: true },
    items: { type: [InvoiceItemSchema], default: [] },
    rawParsed: { type: mongoose.Schema.Types.Mixed },
    sourceFile: {
      filename: String,
      originalName: String,
      mimeType: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invoice", InvoiceSchema);
