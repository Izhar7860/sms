function authGuard(req, res, next) {
  // Placeholder auth guard for incremental integration.
  // Existing app uses Firebase Auth on the client; token verification can be added later.
  // For now: allow through.
  next();
}

module.exports = { authGuard };

