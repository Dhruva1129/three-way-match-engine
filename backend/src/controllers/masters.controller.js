const SkuMaster = require("../models/SkuMaster");
const { AppError } = require("../middleware/errorHandler");

async function createSku(req, res, next) {
  try {
    const { skuErpCode, name, eanCode, hsnCode, uom, agreedRate, mrp, priceTolerance } = req.body;
    if (!skuErpCode || !name) throw new AppError(400, "skuErpCode and name are required");

    const existing = await SkuMaster.findOne({ skuErpCode: skuErpCode.trim() });
    if (existing) throw new AppError(409, `A SKU Master with skuErpCode "${skuErpCode}" already exists`);

    const sku = await SkuMaster.create({ skuErpCode: skuErpCode.trim(), name, eanCode, hsnCode, uom, agreedRate, mrp, priceTolerance });
    res.status(201).json(sku);
  } catch (err) {
    next(err);
  }
}

async function listSkus(req, res, next) {
  try {
    const { search } = req.query;
    const filter = search
      ? { $or: [{ skuErpCode: new RegExp(search, "i") }, { name: new RegExp(search, "i") }, { eanCode: new RegExp(search, "i") }] }
      : {};
    const skus = await SkuMaster.find(filter).sort({ createdAt: -1 });
    res.json(skus);
  } catch (err) {
    next(err);
  }
}

async function getSku(req, res, next) {
  try {
    const sku = await SkuMaster.findById(req.params.id);
    if (!sku) throw new AppError(404, `SKU Master ${req.params.id} not found`);
    res.json(sku);
  } catch (err) {
    next(err);
  }
}

async function updateSku(req, res, next) {
  try {
    const { skuErpCode, name, eanCode, hsnCode, uom, agreedRate, mrp, priceTolerance } = req.body;

    if (skuErpCode) {
      const clash = await SkuMaster.findOne({ skuErpCode: skuErpCode.trim(), _id: { $ne: req.params.id } });
      if (clash) throw new AppError(409, `Another SKU Master already uses skuErpCode "${skuErpCode}"`);
    }

    const sku = await SkuMaster.findByIdAndUpdate(
      req.params.id,
      { skuErpCode, name, eanCode, hsnCode, uom, agreedRate, mrp, priceTolerance },
      { new: true, runValidators: true }
    );
    if (!sku) throw new AppError(404, `SKU Master ${req.params.id} not found`);
    res.json(sku);
  } catch (err) {
    next(err);
  }
}

async function deleteSku(req, res, next) {
  try {
    const sku = await SkuMaster.findByIdAndDelete(req.params.id);
    if (!sku) throw new AppError(404, `SKU Master ${req.params.id} not found`);
    res.json({ deleted: true, id: req.params.id });
  } catch (err) {
    next(err);
  }
}

module.exports = { createSku, listSkus, getSku, updateSku, deleteSku };
