const fs = require("fs");
const path = require("path");
const multer = require("multer");

const uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR || "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40);
    cb(null, `${Date.now()}-${safeBase}${ext}`);
  },
});

const ALLOWED_MIME = new Set(["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/webp"]);

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    return cb(new Error(`Unsupported file type: ${file.mimetype}. Upload a PDF or image.`));
  }
  cb(null, true);
}

const maxSizeBytes = (Number(process.env.MAX_UPLOAD_MB) || 15) * 1024 * 1024;

const upload = multer({ storage, fileFilter, limits: { fileSize: maxSizeBytes } });

module.exports = { upload, uploadDir };
