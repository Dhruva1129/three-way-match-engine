const MatchAudit = require("../models/MatchAudit");

/**
 * Appends one audit entry per upload-pipeline step. One MatchAudit document
 * per poNumber accumulates a running steps[] log — created lazily on first
 * upload for that poNumber.
 */
async function logStep(poNumber, step, status, message) {
  await MatchAudit.findOneAndUpdate(
    { poNumber },
    { $push: { steps: { step, status, message, at: new Date() } } },
    { upsert: true, new: true }
  );
}

async function getAudit(poNumber) {
  return MatchAudit.findOne({ poNumber }).lean();
}

module.exports = { logStep, getAudit };
