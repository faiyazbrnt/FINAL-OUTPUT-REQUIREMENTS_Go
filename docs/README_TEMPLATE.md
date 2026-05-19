# AI-Powered Big Data Cloud Analytics Dashboard

## Course Details
- Course: `ICS-IT`
- Term: `3rd Year 2nd Sem`
- Section: `CEIT-37-601A`

## Group Members
1. `Brent Liam Emmanuel, L. Go - Main Developer`
2. `Edison Lloyd B. Balatbat - Full Stack Developer`
3. `John Patrick Cabilan - Full Stack Developer`

## Project Overview
Short description of the analytics problem, target users, and expected value for DataInsights Corp.

## Tech Stack
- Frontend: React + Vite + TypeScript + Tailwind + Recharts
- Backend: Node.js + Express + TypeScript
- Database: Supabase PostgreSQL
- Data Processing: Python + pandas + numpy
- AI: Gemini 1.5 Flash (or Groq LLaMA 3)
- Deployment: Vercel (frontend), Render (backend)

## Dataset Description
- Source URL:
- Download Date:
- Row Count:
- Column Count:
- Key Fields:

## Architecture
Attach architecture diagram and explain frontend, backend, database, and AI data flow.

## Database Design
- ERD screenshot
- SQL schema summary
- Relationships and indexing notes

## Data Pipeline
- Cleaning steps (missing values, outliers, normalization)
- Script location: `python-scripts/src/`
- Output file: `dataset/cleaned/cleaned_dataset.csv`

## API Documentation
### Base URL
`https://<render-service>.onrender.com/api`

### Endpoints
1. `GET /health`
2. `GET /analytics/kpis`
3. `GET /analytics/top-categories`
4. `GET /analytics/regional-distribution`
5. `GET /analytics/trend`
6. `POST /ai/insight`

## Dashboard Features
- KPI cards
- Interactive filters
- 3+ charts
- AI insights panel
- Responsive design

## AI Integration
- Provider:
- Prompt strategy:
- Sample AI output:
- Error and fallback handling:

## Deployment Links
- Frontend (Vercel):
- Backend (Render):
- Repository:

## Challenges Encountered
1. Setting up a stable data flow between Supabase and local development was challenging because missing or placeholder environment variables caused API failures, so we implemented clearer env validation and a CSV fallback strategy.
2. Integrating AI insights was difficult due to inconsistent provider responses and occasional timeouts/rate limits, so we added provider failover (Gemini to Groq), retries, and a local deterministic fallback to keep the feature reliable.
3. Maintaining consistent analytics output across backend API data and frontend imported CSV/XLSX files was challenging, so we built strict file validation, normalization rules, and shared metric computation logic.

## Key Learnings
1. We learned that strong input validation (query params, request body, and imported files) is critical in full-stack apps to prevent silent errors and improve user trust.
2. We learned to design resilient systems by planning fallback behavior early, especially for cloud services like Supabase and external AI APIs that can fail or be misconfigured.
3. We improved our teamwork in a monorepo setup by separating backend/frontend responsibilities, documenting scripts and deployment steps, and testing changes end-to-end before release.

## Local Setup
```bash
# frontend
cd frontend
npm install
npm run dev

# backend
cd backend
npm install
npm run dev
```
