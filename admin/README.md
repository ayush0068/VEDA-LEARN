# VedaLearn Admin Panel (placeholder)

This folder is reserved for the future Admin Panel. **Nothing is built here yet.**

Planned scope (same backend + same MongoDB as the public app):
- Courses, pricing
- Students, enrollments, payments
- Live classes

Architecture notes so this slots in cleanly later:
- `server/` already allows CORS from `http://localhost:5174` (admin dev port) via `CLIENT_URLS`.
- Admin will be a separate Vite + React + TS app (`admin/`) with its own `.env` (`VITE_API_URL`).
- Admin endpoints will live under `server/src/routes/admin/` and be mounted at `/api/admin/*`.
