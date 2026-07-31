const mongoose = require("mongoose");

const AuditStepSchema = new mongoose.Schema(
  {
    step: { type: String, required: true }, // e.g. "parse", "master_resolution", "duplication_check", "persist"
    status: { type: String, enum: ["success", "warning", "error"], required: true },
    message: { type: String, default: "" },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const MatchAuditSchema = new mongoose.Schema(
  {
    poNumber: { type: String, required: true, index: true },
    steps: { type: [AuditStepSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MatchAudit", MatchAuditSchema);
