const { computeMatch } = require("../services/matching.service");
const { getAudit } = require("../services/audit.service");
const { AppError } = require("../middleware/errorHandler");

/**
 * GET /match/:poNumber
 * Always recomputes from currently stored documents — never cached.
 */
async function getMatch(req, res, next) {
  try {
    const { poNumber } = req.params;
    if (!poNumber) throw new AppError(400, "poNumber is required");

    const result = await computeMatch(poNumber);
    const audit = await getAudit(poNumber);

    res.json({ ...result, audit: audit?.steps || [] });
  } catch (err) {
    next(err);
  }
}

module.exports = { getMatch };
