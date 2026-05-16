function validate(requiredKeys = [], body = {}) {
  const missing = requiredKeys.filter((k) => body[k] === undefined || body[k] === null || body[k] === '');
  return {
    ok: missing.length === 0,
    missing
  };
}

module.exports = { validate };

