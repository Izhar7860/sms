# TODO: Notices auto-expire system

- [x] Add `expiresAt` field to admin notice creation UI (`pages/notices.html`).
- [x] Save `expiresAt` (ISO) + `createdAt` to Firebase on notice publish (`public/js/main.js`).
- [x] Client-side hide expired notices and update “Active” count accordingly (`public/js/main.js`).
- [x] Add backend script to delete expired notices (`backend/notice-expire.js`).
- [ ] (Optional) Wire backend script to run periodically (cron / hosting scheduler / PM2) so expiry happens without manual runs.

## How to run manually
- Set env vars:
  - `FIREBASE_DATABASE_URL`
  - One of:
    - `FIREBASE_SERVICE_ACCOUNT_KEY` (path to service account json), OR
    - `GOOGLE_APPLICATION_CREDENTIALS` (path to service account json)
- Command:
  - `node backend/notice-expire.js`

## Expected behavior
- Notices with `expiresAt <= now` are deleted from `/notices`.
- UI will stop showing them after realtime updates.

