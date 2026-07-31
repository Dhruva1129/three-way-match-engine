const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { createSku, listSkus, getSku, updateSku, deleteSku } = require("../controllers/masters.controller");

const router = express.Router();
router.use(requireAuth);
router.post("/", createSku);
router.get("/", listSkus);
router.get("/:id", getSku);
router.patch("/:id", updateSku);
router.delete("/:id", deleteSku);

module.exports = router;
