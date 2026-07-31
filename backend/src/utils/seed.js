require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const SkuMaster = require("../models/SkuMaster");

/**
 * Seeds a handful of sample SKU Master records so the matching pipeline
 * has something to resolve against out of the box. Run with `npm run seed`.
 * Safe to re-run — upserts by skuErpCode.
 */
const SAMPLE_SKUS = [
  { skuErpCode: "BIK-BIKANERI-200G", eanCode: "8901234567890", name: "Bikaji Bikaneri Bhujia 200 G Pp", hsnCode: "21069099", uom: "EA", agreedRate: 45, mrp: 50, priceTolerance: 0.05 },
  { skuErpCode: "HALDIRAM-AALOO-150G", eanCode: "8901234567891", name: "Haldiram's Aloo Bhujia 150 G", hsnCode: "21069099", uom: "EA", agreedRate: 32, mrp: 35, priceTolerance: 0.05 },
  { skuErpCode: "LAYS-CLASSIC-52G", eanCode: "8901234567892", name: "Lay's Classic Salted 52 G", hsnCode: "19059090", uom: "EA", agreedRate: 20, mrp: 22, priceTolerance: 0.05 },
  { skuErpCode: "PARLE-G-100G", eanCode: "8901234567893", name: "Parle-G Original Biscuit 100 G", hsnCode: "19053100", uom: "EA", agreedRate: 12, mrp: 14, priceTolerance: 0.05 },
  { skuErpCode: "TATA-SALT-1KG", eanCode: "8901234567894", name: "Tata Salt Iodized 1 Kg", hsnCode: "25010020", uom: "EA", agreedRate: 24, mrp: 28, priceTolerance: 0.05 },
];

async function seed() {
  await connectDB();
  for (const sku of SAMPLE_SKUS) {
    await SkuMaster.findOneAndUpdate({ skuErpCode: sku.skuErpCode }, sku, { upsert: true, new: true });
  }
  console.log(`[seed] upserted ${SAMPLE_SKUS.length} SKU Master records`);
  await mongoose.connection.close();
}

seed().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});
