// App-level error handler wiring helper for marketplace.
// Not mounted directly; server.js will mount routes.

function errorHandler(err, req, res, next) {
  const status = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ error: message });
}

module.exports = { errorHandler };

