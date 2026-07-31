const mongoose = require("mongoose");
const dns = require("dns");

// Fix for Node.js DNS SRV query timeout on Windows / certain ISPs
dns.setServers(["8.8.8.8"]);

async function connectDB() {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/three_way_match";
  try {
    await mongoose.connect(uri);
    console.log(`[db] connected -> ${uri}`);
  } catch (err) {
    console.error("[db] connection failed:", err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
