const SkuMaster = require("../models/SkuMaster");
const { normalizeCode } = require("../utils/normalize");

/**
 * Resolves each item's itemCode against the SKU Master catalogue:
 *   1. skuErpCode == itemCode (normalised, case-insensitive)
 *   2. fallback: eanCode == itemCode (normalised, case-insensitive)
 *   3. otherwise: leave skuMaster unset and flag unmappedMasterSku — the
 *      item stays visible with a warning, it is never dropped.
 *
 * Runs after parsing, before persistence, so every stored item already
 * carries its resolution result (and can be re-resolved later by simply
 * re-running this function once the missing SkuMaster record is created).
 */
async function resolveItems(items) {
  if (!Array.isArray(items) || items.length === 0) return [];

  // Pull the whole master catalogue once — assignments of this size make a
  // per-item query unnecessary and this keeps the resolution O(1) per item.
  const allMasters = await SkuMaster.find({}).lean();
  const byErpCode = new Map();
  const byEanCode = new Map();
  for (const m of allMasters) {
    if (m.skuErpCode) byErpCode.set(normalizeCode(m.skuErpCode), m);
    if (m.eanCode) byEanCode.set(normalizeCode(m.eanCode), m);
  }

  return items.map((item) => {
    const normalizedCode = normalizeCode(item.itemCode);
    const match = byErpCode.get(normalizedCode) || byEanCode.get(normalizedCode) || null;

    return {
      ...item,
      normalizedCode,
      skuMaster: match ? match._id : null,
      unmappedMasterSku: !match,
    };
  });
}

module.exports = { resolveItems };
