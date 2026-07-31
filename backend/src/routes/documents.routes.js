const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { upload } = require("../middleware/upload");
const {
  uploadDocument,
  getDocumentById,
  getDocumentFile,
  listDocuments,
  deleteByPoNumber,
} = require("../controllers/documents.controller");

const router = express.Router();

router.use(requireAuth);
router.post("/upload", upload.single("file"), uploadDocument);
router.get("/", listDocuments);
router.delete("/po/:poNumber", deleteByPoNumber);
router.get("/:id", getDocumentById);
router.get("/:id/file", getDocumentFile);

module.exports = router;
