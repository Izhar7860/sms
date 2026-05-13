const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;
const FIREBASE_BASE_URL = 'https://identitytoolkit.googleapis.com/v1/accounts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function firebaseUrl(action) {
  return `${FIREBASE_BASE_URL}:${action}?key=${FIREBASE_API_KEY}`;
}

async function callFirebase(action, payload) {
  if (!FIREBASE_API_KEY) {
    const error = new Error('Missing FIREBASE_API_KEY environment variable.');
    error.status = 500;
    throw error;
  }

  const response = await fetch(firebaseUrl(action), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await readJsonResponse(response);
  if (!response.ok) {
    const error = new Error(data.error?.message || 'Firebase Auth request failed');
    error.status = response.status;
    throw error;
  }

  return data;
}

async function readJsonResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  const body = await response.text();

  if (!body.trim()) {
    return {};
  }

  if (!contentType.includes('application/json')) {
    const error = new Error(`Firebase Auth returned a non-JSON response: ${body.slice(0, 120)}`);
    error.status = response.status;
    throw error;
  }

  try {
    return JSON.parse(body);
  } catch (parseError) {
    const error = new Error('Firebase Auth returned invalid JSON.');
    error.status = response.status;
    throw error;
  }
}

function sendJson(res, status, data) {
  res.status(status).json(data);
}

function sendError(res, status, message) {
  res.status(status).json({ error: message || 'Internal Server Error' });
}

module.exports = { callFirebase, sendJson, sendError, corsHeaders };
