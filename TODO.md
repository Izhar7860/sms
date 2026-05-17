# TODO - Society Management System (Resident Portal React + Firebase)

## Step 1: Scaffold React Resident Portal
- Create `react-resident-portal/src` structure
- Add React Router + protected routes (resident/admin)
- Implement shared layout/components (reuse existing CSS where possible)

## Step 2: Firebase (React module)
- Add `react-resident-portal/.env.example`
- Add Firebase initialization (Auth + Firestore + Storage)
- Add hooks: `useAuthUser`, `useUserRole`, `useFirestoreCollection`/`useFirestoreDoc`

## Step 3: Resident Portal Pages
- Resident dashboard
- Resident profile page (view/edit + profile photo upload/change)
- Change password page
- Visitor history page (resident-scoped query; admin full view; realtime updates)
- Wire visitor approval/rejection for admin only
- Add pages for notices/complaints/maintenance/services/service bookings as Firestore-backed read-only (where schema exists)

## Step 4: Firestore Security Rules
- Update `firestore.rules.json` to include:
  - visitors collection: resident read-only own `residentId`; admin full access
  - residents collection: resident read own; admin full access; allow limited profile writes if required
  - other collections (complaints/notices/vehicles/maintenancePayments/serviceBookings) with admin full access and resident read constraints

## Step 5: Integrate with existing server
- Update `server.js` to serve React build output at a new route
- Ensure no existing routes/pages/auth break

## Step 6: Build & Test
- Install React module deps
- Build React bundle
- Run server and verify:
  - existing admin pages still work
  - existing resident pages still work
  - new React resident portal works with protected routing
  - resident can only see own visitors
  - realtime visitor updates work

