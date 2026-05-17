const admin = require('firebase-admin');

// Usage:
//   node backend/notice-expire.js
// Environment:
//   - Uses Firebase service account credentials from GOOGLE_APPLICATION_CREDENTIALS
//     OR from a local file path in FIREBASE_SERVICE_ACCOUNT_KEY
//   - Expects Firebase Realtime Database URL in FIREBASE_DATABASE_URL

function getRequiredEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

async function initFirebaseAdmin() {
  if (admin.apps.length) return;

  let serviceAccount;
  const explicitPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (explicitPath) {
    // eslint-disable-next-line import/no-dynamic-require
    serviceAccount = require(explicitPath);
  } else {
    // Uses GOOGLE_APPLICATION_CREDENTIALS
    serviceAccount = undefined;
  }

  const databaseURL = getRequiredEnv('FIREBASE_DATABASE_URL');

  admin.initializeApp({
    credential: serviceAccount
      ? admin.credential.cert(serviceAccount)
      : admin.credential.applicationDefault(),
    databaseURL
  });
}

function buildNoticeDeleteUpdates(notices, nowTs) {
  // Delete nodes that are expired (expiresAt <= now)
  const updates = {};
  for (const [key, notice] of Object.entries(notices || {})) {
    if (!notice) continue;
    if (!notice.expiresAt) continue;

    const expTs = new Date(notice.expiresAt).getTime();
    if (!Number.isFinite(expTs)) continue;

    if (expTs <= nowTs) {
      updates[`notices/${key}`] = null;
    }
  }
  return updates;
}

async function run() {
  await initFirebaseAdmin();

  const nowTs = Date.now();

  const db = admin.database();
  const snap = await db.ref('notices').once('value');
  const notices = snap.val() || {};

  const updates = buildNoticeDeleteUpdates(notices, nowTs);
  const keysToDelete = Object.keys(updates);

  if (!keysToDelete.length) {
    console.log(`[notice-expire] No expired notices found at ${new Date(nowTs).toISOString()}`);
    return { deleted: 0 };
  }

  await db.ref().update(updates);

  console.log(`[notice-expire] Deleted ${keysToDelete.length} expired notices.`);
  return { deleted: keysToDelete.length };
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[notice-expire] Failed:', err);
    process.exit(1);
  });

