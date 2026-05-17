# TODO_marketplace.md

## Worker Profiles rewrite + Firestore booking integration

- [ ] Step 1: Rewrite `pages/worker-profiles.html` markup for structure/semantic/a11y while preserving all existing IDs/classes used by `public/js/services-marketplace.js`.
- [ ] Step 2: Add Firestore compat script include to `pages/worker-profiles.html` (no breaking changes).
- [ ] Step 3: Add page-local auth verification (resident-only) + safe logout affordance without changing the global auth system.
- [x] Step 4: Improve worker card/modal UX: loading state, empty state, profile image fallback, safer image handling.

- [x] Step 5: Update `public/js/services-marketplace.js` to best-effort write booking requests to Firestore (`workerBookings`) with:

  - [ ] `residentId` from current user UID
  - [ ] `requestedAt`
  - [ ] `bookingStatus`: Pending/Accepted/Completed/Cancelled
  - [ ] fallback to existing API/local booking flow if Firestore fails.
- [x] Step 6: Add Firestore initialization and authentication state checking in `public/js/services-marketplace.js` (no console errors).


- [x] Step 7: Add/adjust Firestore rules (only if safe for repo); otherwise provide best-effort and avoid breaking existing realtime rules.

- [ ] Step 8: Quick manual QA checklist:
  - [ ] Worker list/search/filter works without reload
  - [ ] Modal opens correctly
  - [ ] Booking submission works and creates Firestore doc best-effort
  - [ ] Unauthenticated redirects to login
  - [ ] Logout works

