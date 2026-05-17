# Deployment Guide (Render + Vercel)

## 1) Backend on Render

This repo includes a Blueprint file at `render.yaml`.

1. In Render, create a new **Blueprint** service from this repository.
2. Confirm it picks the `datainsights-backend` web service.
3. Set required environment variables in Render:
   - `FRONTEND_URL` (comma-separated list supported)
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Optional AI vars:
   - `AI_PROVIDER` (`gemini` or `groq`)
   - `GEMINI_API_KEY`, `GEMINI_MODEL`
   - `GROQ_API_KEY`, `GROQ_MODEL`
5. Deploy and verify:
   - `GET /api/health` returns HTTP `200`.

Notes:
- In production, backend reads Render env vars only (local `.env*` files are ignored).
- `FRONTEND_URL` supports wildcard patterns like `https://*.vercel.app`.

## 2) Frontend on Vercel

This repo includes `vercel.json` for monorepo-safe Vite builds.

1. Import this repository into Vercel as a project.
2. Keep default root (repo root) so `vercel.json` is used.
3. Set `VITE_API_BASE_URL` in Vercel:
   - Recommended: `https://<your-render-service>.onrender.com/api`
4. Deploy.

## 3) CORS Setup

Set Render `FRONTEND_URL` to include both production and previews, for example:

```text
https://your-frontend.vercel.app,https://*.vercel.app,http://localhost:5173
```

## 4) Pre-Push Safety Check

From repo root:

```bash
npm install
npm run typecheck
npm run build
```

