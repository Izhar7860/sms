function roleGuard(allowedRoles = []) {
  return (req, res, next) => {
    // Placeholder role guard.
    // Attach `req.user` in token middleware when wired.
    const role = req.user?.role;
    if (!role) return next();
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

module.exports = { roleGuard };

