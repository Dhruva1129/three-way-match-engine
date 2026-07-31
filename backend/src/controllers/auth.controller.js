const jwt = require("jsonwebtoken");
const { AppError } = require("../middleware/errorHandler");

/**
 * POST /auth/login
 * No real identity provider — validates against the single static
 * credential pair in env vars and returns a signed Bearer token.
 */
async function login(req, res, next) {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      throw new AppError(400, "username and password are required");
    }

    const validUsername = process.env.AUTH_USERNAME || "admin";
    const validPassword = process.env.AUTH_PASSWORD || "admin123";

    if (username !== validUsername || password !== validPassword) {
      throw new AppError(401, "Invalid credentials");
    }

    const token = jwt.sign({ sub: username, role: "admin" }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "12h",
    });

    res.json({ token, user: { username } });
  } catch (err) {
    next(err);
  }
}

module.exports = { login };
