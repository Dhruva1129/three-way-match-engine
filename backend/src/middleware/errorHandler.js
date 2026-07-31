/**
 * Central error handler — never leaks stack traces or API keys to the client.
 * Route handlers should throw or call next(err); anything unhandled lands here.
 */
class AppError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

function notFoundHandler(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = err.message || "Internal server error";

  if (status >= 500) {
    console.error("[error]", err);
  }

  const body = { error: message };
  if (err.details) body.details = err.details;

  res.status(status).json(body);
}

module.exports = { AppError, notFoundHandler, errorHandler };
