const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const authRoutes = require("./routes/auth.routes");
const documentsRoutes = require("./routes/documents.routes");
const matchRoutes = require("./routes/match.routes");
const summaryRoutes = require("./routes/summary.routes");
const mastersRoutes = require("./routes/masters.routes");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = [
        process.env.FRONTEND_ORIGIN,
        "https://three-way-match-engine-alpha.vercel.app",
        "http://localhost:3000",
      ].filter(Boolean);
      if (!origin || allowed.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"), false);
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.get("/health", (req, res) => res.json({ ok: true, service: "three-way-match-backend" }));

app.use("/auth", authRoutes);
app.use("/documents", documentsRoutes);
app.use("/match", matchRoutes);
app.use("/summary", summaryRoutes);
app.use("/masters/sku", mastersRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
