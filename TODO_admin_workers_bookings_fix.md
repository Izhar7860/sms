# TODO - admin-workers-bookings.html localhost fix

- [x] Inspect admin-workers-bookings.html and shared JS (public/js/main.js + services-marketplace.js).
- [x] Identify why page could render blank (runtime errors) and why static assets might be missing (wrong relative paths).
- [x] Patch admin-workers-bookings.html: correct CSS relative paths to ../public/css/*
- [x] Patch admin-workers-bookings.html: ensure main.js and services-marketplace.js load reliably using `defer` and add runtime error banner fallback.
- [ ] Verify with local browser:
  - [ ] /admin-workers-bookings.html loads with no white screen
  - [ ] /pages/admin-workers-bookings.html loads with no white screen
  - [ ] navbar/sidebar links work
  - [ ] marketplace JS initializes (workers list + bookings table)
- [ ] Check browser console for errors.

