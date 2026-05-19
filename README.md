# DataInsights Analytics Dashboard

Full-stack analytics dashboard for the Titanic dataset with:
- KPI and chart APIs (Express + TypeScript)
- Interactive dashboard UI (React + Vite + TypeScript + Tailwind)
- AI-generated insight summaries (Gemini/Groq with local fallback)
- Supabase-backed production data with local CSV fallback for development

## Current System State

- Monorepo workspaces: `backend/` and `frontend/`
- Local dev entrypoint: `npm run dev` (runs backend + frontend concurrently)
- Backend API base: `http://localhost:5000/api`
- Frontend dev app: `http://localhost:5173`
- Production deployment targets:
  - Backend: Render (`render.yaml`)
  - Frontend: Vercel (`frontend/vercel.json`)

Implementation progress is tracked in [`docs/IMPLEMENTATION_TRACKER.md`](docs/IMPLEMENTATION_TRACKER.md).

## Architecture

### Backend (`backend/`)
- Express 5 + TypeScript API
- Zod request validation
- CORS allowlist with wildcard support via `FRONTEND_URL`
- Supabase client configuration + diagnostics
- Fallback to local CSV dataset in non-production when Supabase is not configured

### Frontend (`frontend/`)
- React 18 + Vite 5 + TypeScript
- Tailwind CSS v4 styling
- Recharts visualizations
- Filter-driven analytics calls
- AI insight panel with structured cards and recommendations

### Data + Utilities
- Dataset: `dataset/raw/` and `dataset/cleaned/`
- SQL schema/validation: `database/`
- Python helpers: `python-scripts/src/`

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

- Node.js `20.x` (recommended)
- npm `10+`

## Local Setup

1. Install dependencies at repo root:

```bash
npm ci
```

2. Configure environment variables:
   - Use root `.env.local` for local development.
   - The repo already includes a template-style `.env.local` with placeholder values.
   - Update placeholders before using Supabase/AI providers.

3. Start both apps:

```bash
npm run dev
```

4. Open:
   - Frontend: `http://localhost:5173`
   - Backend health: `http://localhost:5000/api/health`

## Environment Variables

Root `.env.local` supports both backend and frontend local dev.

### Required for backend runtime
- `PORT` (default `5000`)
- `NODE_ENV` (`development` locally, `production` in Render)
- `FRONTEND_URL` (CORS allowlist; comma-separated, wildcard supported)

### Supabase
- `SUPABASE_URL` (full URL or Supabase project ID)
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (preferred for backend)

### AI provider
- `AI_PROVIDER` (`gemini` or `groq`)
- `GEMINI_API_KEY`, `GEMINI_MODEL`
- `GROQ_API_KEY`, `GROQ_MODEL`

### Frontend (Vite)
- `VITE_API_BASE_URL` (defaults to local API in local hostname contexts)
- `VITE_APP_TITLE`
- Optional: `VITE_US_TIMEZONE`
- Optional: `VITE_USD_TO_PHP_RATE`

## Data Source Behavior

- `production`: backend expects valid Supabase config and queries `public.titanic_passengers`.
- `development`: if Supabase is missing/placeholder, backend falls back to `dataset/cleaned/titanic_train_cleaned_db.csv`.

## API Endpoints

Base path: `/api`

- `GET /health`
- `GET /analytics/kpis`
- `GET /analytics/top-categories?limit=5`
  - `limit`: integer `1..20`
- `GET /analytics/regional-distribution`
- `GET /analytics/trend?bucketSize=10`
  - `bucketSize`: integer `5..30`
  - Optional `from`/`to` are accepted but trend is computed from age bands (dataset has no date column)
- `POST /ai/insight`
  - body: `{ summary?: object, maxWords: number }`
  - `maxWords`: integer `60..220`
  - includes IP rate limit: `10 requests / minute`

## Available Scripts

### Root
- `npm run dev` - run backend + frontend concurrently
- `npm run typecheck` - workspace typecheck (where script exists)
- `npm run build` - workspace production build

### Backend
- `npm run dev -w backend`
- `npm run build -w backend`
- `npm run start -w backend`

### Frontend
- `npm run dev -w frontend`
- `npm run build -w frontend`
- `npm run preview -w frontend`
- `npm run validate:responsive -w frontend`

## Deployment

- Backend deployment is defined in `render.yaml`
- Frontend deployment is defined in `frontend/vercel.json`
- Full deployment runbook: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)

## Related Project Docs

1. SOP: [`docs/SOP_AI_Powered_Big_Data_Cloud_Analytics_Dashboard.md`](docs/SOP_AI_Powered_Big_Data_Cloud_Analytics_Dashboard.md)
2. Implementation tracker: [`docs/IMPLEMENTATION_TRACKER.md`](docs/IMPLEMENTATION_TRACKER.md)
3. Report template: [`docs/README_TEMPLATE.md`](docs/README_TEMPLATE.md)
4. Deployment guide: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)