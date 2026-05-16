# Marketplace Backend (Services Marketplace)

Base mounted in server.js at: `/api/marketplace`

Routes:
- Workers: `/api/marketplace/workers/*`
- Bookings: `/api/marketplace/bookings/*`
- Admin bookings: `/api/marketplace/admin/bookings`
- Admin workers: `/api/marketplace/admin/workers/*`

Current state:
- Scaffolding only (in-memory Map stores).
- Real persistence should be swapped with Supabase later.

