# DataInsights Analytics Dashboard

Full-stack Titanic analytics dashboard with:
- Express + TypeScript analytics APIs
- React + Vite + TypeScript dashboard UI
- AI insight generation (Gemini/Groq with automatic local fallback)
- Supabase production data access with local CSV fallback in development
- Client-side import/export workflow (CSV/XLSX import, PDF/CSV/XLSX export)

## Current System State

- Monorepo workspaces: `backend/` and `frontend/`
- Local dev entrypoint: `npm run dev` (runs backend + frontend concurrently)
- Backend API (local): `http://localhost:5000/api`
- Frontend app (local): `http://localhost:5173`
- Backend deployment config: [`render.yaml`](render.yaml)
- Frontend deployment config: root [`vercel.json`](vercel.json) and workspace [`frontend/vercel.json`](frontend/vercel.json)

Progress tracking: [`docs/IMPLEMENTATION_TRACKER.md`](docs/IMPLEMENTATION_TRACKER.md)

## What Is Implemented

### Backend (`backend/`)
- Express 5 API with Zod validation and centralized error handling
- CORS allowlist from `FRONTEND_URL` (supports comma-separated values and `*` wildcard patterns)
- Supabase analytics queries against `titanic_passengers`
- Non-production fallback to local CSV dataset when Supabase config is missing/placeholder
- AI route with provider failover (`AI_PROVIDER` preferred, then alternate provider) and local deterministic insight fallback
- AI rate limit: `10` requests per IP per `60` seconds

### Frontend (`frontend/`)
- KPI cards, filters, charts (bar, pie, line), and top-categories table
- AI insight panel with structured sections:
  - Summary
  - Insights
  - Recommendations
  - Reasoning (risk areas + confidence notes)
- Import/Export menu:
  - Import: `.csv` / `.xlsx`
  - Export: `.pdf` / `.csv` / `.xlsx`
  - Download import templates: CSV + XLSX
- Dual timezone clock (Philippines + configurable US timezone)
- Average fare display converted from USD to PHP (configurable exchange rate)

### Data and Supporting Assets
- Raw/cleaned datasets: `dataset/`
- SQL schema and validation queries: `database/`
- Python helpers for dataset cleaning/validation: `python-scripts/src/`

## Repository Layout

```text
.
|- backend/
|- frontend/
|- dataset/
|- database/
|- python-scripts/
|- docs/
|- render.yaml
`- vercel.json
```

## Prerequisites

- Node.js `20.x`
- npm `10+`

## Local Setup

1. Install dependencies from repo root:

```bash
npm ci
```

2. Configure environment variables:
- Local dev uses root `.env.local` (template already included in this repo).
- Replace placeholder values if you want live Supabase and/or external AI providers.

3. Start backend + frontend:

```bash
npm run dev
```

4. Open:
- Frontend: `http://localhost:5173`
- Backend health: `http://localhost:5000/api/health`

## Environment Variables

Root `.env.local` is shared by backend and frontend in local development.

### Backend
- `PORT` (default: `5000`)
- `NODE_ENV` (`development` | `test` | `production`)
- `FRONTEND_URL` (CORS allowlist, comma-separated)
- `SUPABASE_URL` (full URL or Supabase project ID)
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (preferred server key)
- `AI_PROVIDER` (`gemini` | `groq`)
- `GEMINI_API_KEY`
- `GEMINI_MODEL` (default: `gemini-2.0-flash`)
- `GROQ_API_KEY`
- `GROQ_MODEL` (default: `llama3-8b-8192`)

### Frontend (`VITE_*`)
- `VITE_API_BASE_URL` (optional; defaults to local API on localhost, Render backend on non-local hostnames)
- `VITE_APP_TITLE`
- `VITE_US_TIMEZONE` (optional; default fallback: `America/New_York`)
- `VITE_USD_TO_PHP_RATE` (optional; default fallback: `56.5`)

## Data Source Behavior

- Production backend: requires valid Supabase credentials and queries `titanic_passengers`.
- Non-production backend: if Supabase is not configured, API analytics are served from `dataset/cleaned/titanic_train_cleaned_db.csv`.
- Frontend import mode: when a user imports a CSV/XLSX file, analytics are computed client-side from imported rows until refreshed/replaced.

## API Endpoints

Base path: `/api`

- `GET /health`
- `GET /analytics/kpis`
- `GET /analytics/top-categories?limit=5`
  - `limit`: integer `1..20` (default `5`)
- `GET /analytics/regional-distribution`
- `GET /analytics/trend?bucketSize=10`
  - `bucketSize`: integer `5..30` (default `10`)
  - optional `from` / `to` (`YYYY-MM-DD`) are accepted; trend still uses age bands
- `POST /ai/insight`
  - body: `{ summary?: object, maxWords: number }`
  - `maxWords`: integer `60..220` (default `150`)
  - response includes: `insight`, `fallbackUsed`, `structuredInsights[]`, `recommendations[]`, `report`

## Scripts

### Root
- `npm run dev` - run backend + frontend concurrently
- `npm run build` - build all workspaces
- `npm run typecheck` - typecheck all workspaces (if script exists)

### Backend
- `npm run dev -w backend`
- `npm run build -w backend`
- `npm run start -w backend`
- `npm run typecheck -w backend`

### Frontend
- `npm run dev -w frontend`
- `npm run build -w frontend`
- `npm run preview -w frontend`
- `npm run validate:responsive -w frontend`

## Deployment

- Backend: Render blueprint in [`render.yaml`](render.yaml)
- Frontend: Vercel config in root [`vercel.json`](vercel.json) (workspace-level alternative: [`frontend/vercel.json`](frontend/vercel.json))
- Full runbook: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)

## Related Docs

1. [`docs/SOP_AI_Powered_Big_Data_Cloud_Analytics_Dashboard.md`](docs/SOP_AI_Powered_Big_Data_Cloud_Analytics_Dashboard.md)
2. [`docs/IMPLEMENTATION_TRACKER.md`](docs/IMPLEMENTATION_TRACKER.md)
3. [`docs/README_TEMPLATE.md`](docs/README_TEMPLATE.md)
4. [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)
