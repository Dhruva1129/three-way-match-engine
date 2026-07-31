const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { getSummary } = require("../controllers/summary.controller");

const router = express.Router();
router.use(requireAuth);
router.get("/:poNumber", getSummary);

module.exports = router;
