const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { getMatch } = require("../controllers/match.controller");

const router = express.Router();
router.use(requireAuth);
router.get("/:poNumber", getMatch);

module.exports = router;
