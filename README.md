# VedaLearn

Premium Vedic online learning platform — MERN + TypeScript.

**Milestone 1 (this zip):** Navbar + Hero banner + minimal Express/MongoDB backend with `GET /api/health`, connected to the client through a reusable Axios client.

```
vedalearn/
├── client/   React + Vite + TS + Tailwind   (http://localhost:5173)
├── server/   Express + TS + Mongoose        (http://localhost:5000)
└── admin/    reserved for the future Admin Panel (http://localhost:5174)
```

## Requirements
- Node.js 18+ (20/22 recommended)
- MongoDB running locally **or** a MongoDB Atlas URI (server still starts without it; `/api/health` shows `database: "disconnected"`)

## Install (Windows PowerShell)

```powershell
cd vedalearn

cd server
npm install
cd ..

cd client
npm install
cd ..
```

## Run (two PowerShell windows)

```powershell
# Window 1 - API
cd vedalearn\server
npm run dev
```

```powershell
# Window 2 - Website
cd vedalearn\client
npm run dev
```

Open http://localhost:5173 — a small "API online · DB connected" badge (dev only) bottom-left confirms the connection.
Health check: http://localhost:5000/api/health

If PowerShell blocks npm scripts: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

## Environment variables

`.env` files are already included with local defaults; `.env.example` shows every variable. `.env` is git-ignored.

| File | Variable | Purpose |
|---|---|---|
| server/.env | `PORT` | API port (default 5000) |
| server/.env | `MONGODB_URI` | Local or Atlas connection string |
| server/.env | `MONGODB_REQUIRED` | `true` = exit if DB is down |
| server/.env | `CLIENT_URLS` | CORS whitelist (client 5173 + future admin 5174) |
| client/.env | `VITE_API_URL` | API base URL incl. `/api` |
| client/.env | `VITE_INTRO_VIDEO_URL` | Optional embed URL for "Watch Intro" |
| client/.env | `VITE_SHOW_API_STATUS` | Show/hide dev API badge |

Restart the dev server after editing any `.env`.

## Production build

```powershell
cd server; npm run build; npm start
cd ..\client; npm run build
```

## Future Admin Panel
`admin/` is empty on purpose (see `admin/README.md`). The server already allows CORS for port 5174 and routes are modular (`server/src/routes/index.ts`) so `/api/admin/*` can be mounted later against the same MongoDB.
