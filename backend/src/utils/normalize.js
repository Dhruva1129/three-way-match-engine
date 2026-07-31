/**
 * Normalises a raw item/ERP/EAN code for comparison:
 * trims whitespace, collapses internal whitespace, upper-cases.
 * Used both for SKU Master lookups and as the fallback matching key
 * when an item cannot be resolved to a SkuMaster record.
 */
function normalizeCode(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim().replace(/\s+/g, " ").toUpperCase();
}

/**
 * Numeric coercion that never throws and never produces NaN silently —
 * unparsable values become 0 so downstream arithmetic (sums, tolerance
 * checks) stays safe without crashing the pipeline.
 */
function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

module.exports = { normalizeCode, toNumber };
