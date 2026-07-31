const mongoose = require("mongoose");

const SkuMasterSchema = new mongoose.Schema(
  {
    skuErpCode: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    eanCode: { type: String, trim: true, default: null }, // alternate lookup key
    hsnCode: { type: String, trim: true, default: null },
    uom: { type: String, trim: true, default: "EA" },
    agreedRate: { type: Number, default: 0 }, // contracted unit price
    mrp: { type: Number, default: 0 },
    priceTolerance: { type: Number, default: 0.05 }, // fraction, e.g. 0.05 = 5%
  },
  { timestamps: true }
);

SkuMasterSchema.index({ eanCode: 1 });

module.exports = mongoose.model("SkuMaster", SkuMasterSchema);
