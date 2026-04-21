const { callFirebase, sendError, sendJson, corsHeaders } = require('./_helpers');

module.exports = async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders);
    return res.end();
  }

  Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));

  if (req.method !== 'POST') {
    return sendError(res, 405, 'Method not allowed');
  }

  try {
    const { email, password } = req.body;
    const data = await callFirebase('signInWithPassword', { email, password, returnSecureToken: true });
    return sendJson(res, 200, data);
  } catch (err) {
    return sendError(res, err.status || 500, err.message);
  }
};
