# TODO - Visitors Section

- [x] Update `pages/parking.html` with a new Visitors section (form + table).
- [x] Update `public/js/main.js`:
  - [x] Add `visitorParking: []` to `defaultSMSData`.
  - [x] Extend DOM-based collection detection (`getPageDataCollections`).
  - [x] Subscribe to `visitorParking` in `hydrateAppData`.
  - [x] Render Visitors table (`renderVisitorParkingTable`).
  - [x] Add form init (`initVisitorForm`) and persistence (`saveVisitorParkingEntry`).
  - [x] If allocate-slot toggle is enabled, create parking allocation via existing `saveParkingAllocation()`.

- [x] Update Firebase rules for `visitorParking` reads/writes.
- [x] Optional: update `public/css/style.css` if special styling is needed. No special styling needed; existing card/table/form styles cover the section.
- [ ] Manual test: run `node server.js`, open `/pages/parking.html`, verify visitors CRUD + slot updates. Not run yet; local server smoke test was blocked.

