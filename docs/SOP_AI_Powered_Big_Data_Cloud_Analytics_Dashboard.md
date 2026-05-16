# Standard Operating Procedure (SOP)
## Project Title
AI-Powered Big Data Cloud Analytics Dashboard (DataInsights Corp Simulation)

## 1. Project Overview
### 1.1 Objective
Build a cloud-based analytics platform that ingests a real-world dataset, stores it in Supabase PostgreSQL, performs data processing and analytical querying, visualizes KPIs/charts in a responsive React dashboard, and generates AI-driven business insights using a free-tier LLM API.

### 1.2 Business Context
DataInsights Corp needs a lightweight enterprise analytics dashboard for decision-makers to monitor trends, compare categories/regions, and receive automated insight summaries.

### 1.3 Scope
1. Dataset ingestion (500-1000 rows, 5+ meaningful columns)
2. Cloud database setup (Supabase PostgreSQL)
3. Python ETL/cleaning pipeline (pandas + numpy)
4. Backend APIs (Node.js + Express + TypeScript)
5. Frontend dashboard (React + Vite + TypeScript + Tailwind + Recharts)
6. AI insight generation (Gemini 1.5 Flash preferred, Groq fallback)
7. Public deployment (Vercel frontend, Render backend)

### 1.4 Success Criteria
1. Publicly accessible frontend and backend URLs
2. Real dataset processed and queryable from Supabase
3. At least 3 KPI cards, 3 chart types, 1 interactive filter
4. Working "Generate Insight" button powered by AI API
5. Complete documentation and reproducible workflow

---

## 2. Team Roles and Responsibilities
1. Project Manager
- Sprint planning, task assignment, deadline monitoring
- Submission checklist ownership

2. Data Engineer
- Dataset selection/validation
- Python data cleaning and export
- Data dictionary documentation

3. Backend Engineer
- API architecture and implementation
- Supabase integration and query optimization
- AI service orchestration

4. Frontend Engineer
- Dashboard UI, responsive layout, chart integrations
- API integration and filter behavior

5. Cloud/DevOps Engineer
- Vercel, Render, Supabase configuration
- Environment variables, CORS, release checks

6. QA/Documentation Lead
- Test checklist execution
- Final report, evidence screenshots, README quality

---

## 3. Enterprise Folder Structure
```text
root/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── charts/
│   │   └── styles/
│   ├── .env.example
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── config/
│   │   └── utils/
│   ├── .env.example
│   └── package.json
├── python-scripts/
│   ├── src/
│   │   ├── clean_data.py
│   │   └── validate_dataset.py
│   └── output/
├── dataset/
│   ├── raw/
│   ├── cleaned/
│   └── data_dictionary.md
├── docs/
│   ├── SOP_AI_Powered_Big_Data_Cloud_Analytics_Dashboard.md
│   ├── README_TEMPLATE.md
│   ├── IMPLEMENTATION_TRACKER.md
│   └── evidence/
└── README.md
```

---

## 4. Development Workflow SOP
1. Create GitHub repository and protect `main` branch.
2. Create project board (`Backlog`, `In Progress`, `Review`, `Done`).
3. Initialize monorepo folders (`frontend`, `backend`, `python-scripts`, `docs`, `dataset`).
4. Select and validate dataset size and fields.
5. Build data cleaning pipeline and export cleaned CSV.
6. Create Supabase schema and import cleaned dataset.
7. Build backend analytical APIs and AI route.
8. Build frontend dashboard UI and charts.
9. Connect frontend to backend and verify full workflow.
10. Deploy backend to Render and frontend to Vercel.
11. Run complete testing checklist.
12. Finalize documentation and submission assets.

---

## 5. Backend SOP (Node.js + Express + TypeScript)
### 5.1 Setup
```bash
cd backend
npm init -y
npm install express cors dotenv @supabase/supabase-js axios
npm install -D typescript ts-node-dev @types/node @types/express @types/cors
npx tsc --init
```

### 5.2 Minimal API Structure
1. `src/server.ts`: app bootstrap
2. `src/routes/analytics.routes.ts`: KPI/chart endpoints
3. `src/routes/ai.routes.ts`: AI insight endpoint
4. `src/services/supabase.service.ts`: DB query wrappers
5. `src/services/ai.service.ts`: Gemini/Groq wrapper
6. `src/middleware/error.middleware.ts`: unified error responses

### 5.3 Example API Route
```ts
// backend/src/routes/analytics.routes.ts
import { Router } from "express";
import { getKpis, getRegionalDistribution } from "../controllers/analytics.controller";

const router = Router();
router.get("/kpis", getKpis);
router.get("/regional-distribution", getRegionalDistribution);

export default router;
```

### 5.4 Error Handling Standard
1. Return JSON format:
```json
{
  "success": false,
  "message": "Human readable error",
  "errorCode": "INTERNAL_SERVER_ERROR"
}
```
2. Log server errors in backend logs only.
3. Never expose secrets in API responses.

---

## 6. Frontend SOP (React + Vite + TS + Tailwind + Recharts)
### 6.1 CSS Choice Recommendation
Best for this project: **Tailwind CSS + small custom CSS file for design tokens**.  
Reason: fast responsive layout, reusable utility classes, and clean component styling for beginners.

### 6.2 Setup
```bash
cd frontend
npm create vite@latest . -- --template react-ts
npm install
npm install tailwindcss @tailwindcss/vite recharts axios
```

### 6.3 Component Layout
1. `DashboardPage.tsx`
2. `KpiCards.tsx`
3. `FiltersPanel.tsx`
4. `charts/RevenueBarChart.tsx`
5. `charts/CategoryPieChart.tsx`
6. `charts/TrendLineChart.tsx`
7. `AiInsightsPanel.tsx`
8. `DataTable.tsx`

### 6.4 UI Responsiveness Standard
1. Mobile-first breakpoints (`sm`, `md`, `lg`)
2. KPI cards: 1 column mobile, 2 tablet, 3 desktop
3. Charts stack vertically on mobile, grid on desktop
4. Buttons and filters must be accessible with keyboard navigation

---

## 7. Database SOP (Supabase PostgreSQL)
### 7.1 ERD Process
1. Identify entities from dataset (example: `sales_records`, `regions`, `categories`)
2. Normalize where useful (dimension tables for category/region)
3. Map primary and foreign keys
4. Draw ERD using dbdiagram.io or Draw.io
5. Save ERD screenshot in `docs/evidence/`

### 7.2 Example SQL Schema
```sql
create table if not exists categories (
  id serial primary key,
  category_name text not null unique
);

create table if not exists regions (
  id serial primary key,
  region_name text not null unique
);

create table if not exists sales_records (
  id bigserial primary key,
  record_date date not null,
  category_id int references categories(id),
  region_id int references regions(id),
  units_sold int not null check (units_sold >= 0),
  revenue numeric(12,2) not null check (revenue >= 0),
  profit_margin numeric(5,2)
);
```

### 7.3 CSV Import SOP
1. Open Supabase project -> Table Editor
2. Create tables manually or run SQL script in SQL Editor
3. Import dimension tables first (`categories`, `regions`)
4. Import fact table (`sales_records`) with FK IDs
5. Validate row count:
```sql
select count(*) from sales_records;
```

### 7.4 Query Optimization Basics
1. Add indexes for filter-heavy fields (`record_date`, `category_id`, `region_id`)
2. Avoid `select *` in production endpoints
3. Use aggregate pre-grouping queries for chart datasets

---

## 8. Data Processing SOP (Python + pandas + numpy)
### 8.1 Setup
```bash
cd python-scripts
python -m venv .venv
.venv\Scripts\activate
pip install pandas numpy
```

### 8.2 Cleaning Workflow
1. Load raw CSV from `dataset/raw/`
2. Validate row count (500-1000)
3. Handle missing values
4. Detect outliers (IQR or Z-score)
5. Normalize selected numeric columns using Min-Max
6. Export cleaned CSV to `dataset/cleaned/`
7. Generate cleaning log (rows before/after, columns cleaned)

### 8.3 Example Cleaning Script
```python
import pandas as pd
import numpy as np

df = pd.read_csv("../dataset/raw/source.csv")

# Missing values
for col in df.select_dtypes(include=[np.number]).columns:
    df[col] = df[col].fillna(df[col].median())

# IQR outlier capping
for col in ["revenue", "units_sold"]:
    q1, q3 = df[col].quantile([0.25, 0.75])
    iqr = q3 - q1
    lower, upper = q1 - 1.5 * iqr, q3 + 1.5 * iqr
    df[col] = df[col].clip(lower=lower, upper=upper)

# Min-Max scaling
for col in ["revenue", "units_sold"]:
    min_v, max_v = df[col].min(), df[col].max()
    if max_v != min_v:
        df[f"{col}_scaled"] = (df[col] - min_v) / (max_v - min_v)

df.to_csv("../dataset/cleaned/cleaned_dataset.csv", index=False)
print({"rows": len(df), "cols": len(df.columns)})
```

---

## 9. AI Integration SOP (Gemini Preferred)
### 9.1 Provider Choice
1. Primary: Google Gemini `gemini-1.5-flash`
2. Fallback: Groq with LLaMA 3

### 9.2 Prompt Engineering Workflow
1. Backend collects KPI and chart summary JSON
2. Backend sends structured prompt with business context
3. AI returns concise insight with:
- trend summary
- top driver
- anomaly warning
- 2 recommendations

### 9.3 Example Prompt
```text
You are a business analyst for DataInsights Corp.
Analyze this analytics summary:
{kpi_summary_json}
Return:
1) Key trend
2) Top category/region driver
3) Potential anomaly
4) Two actionable recommendations
Keep response under 150 words.
```

### 9.4 Example Route
```ts
router.post("/insight", generateInsight);
```

### 9.5 AI Error/Rate Limit SOP
1. Timeout after 15s
2. If rate limited, retry once with exponential backoff
3. On failure, return fallback text:
   `"AI insight temporarily unavailable. Please retry."`

---

## 10. Deployment SOP
### 10.1 Backend on Render
1. Push repository to GitHub
2. Create Render Web Service for `backend`
3. Build command: `npm install && npm run build`
4. Start command: `npm run start`
5. Add environment variables from `backend/.env.example`
6. Enable CORS for Vercel frontend URL

### 10.2 Frontend on Vercel
1. Import GitHub repo to Vercel
2. Root directory: `frontend`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add `VITE_API_BASE_URL` and deploy

### 10.3 Production Validation
1. Open deployed frontend URL
2. Verify KPIs/charts load
3. Verify filters update results
4. Verify AI insight button works
5. Capture screenshots and include in `docs/evidence/`

---

## 11. GitHub Workflow SOP
### 11.1 Branch Naming
`feature/<scope>-<short-desc>`  
Examples:
- `feature/backend-analytics-routes`
- `feature/frontend-kpi-cards`
- `fix/ai-timeout-handling`

### 11.2 Commit Convention
`type(scope): short message`
Examples:
- `feat(api): add kpi aggregation endpoint`
- `fix(ui): correct mobile chart overflow`
- `docs(sop): add deployment checklist`

### 11.3 PR Process
1. Create PR to `develop` or `main` (team policy)
2. Link issue in PR description
3. Add screenshots for UI changes
4. Require at least 1 reviewer approval
5. Merge only after checks pass

---

## 12. Testing SOP
### 12.1 Frontend Checklist
1. KPI cards display accurate values
2. All charts render without console errors
3. Filter updates all dependent components
4. Mobile/tablet/desktop responsiveness confirmed
5. Loading and empty states display correctly

### 12.2 Backend Checklist
1. Health endpoint returns 200
2. KPI endpoint returns expected schema
3. Chart endpoints return grouped data
4. AI endpoint handles success/failure properly
5. CORS only allows trusted origins

### 12.3 AI Feature Checklist
1. Prompt includes latest dashboard summary
2. Output is concise and relevant
3. Rate-limit handling tested
4. Fallback message tested

### 12.4 Deployment Checklist
1. Render service running
2. Vercel build succeeded
3. Frontend can reach backend API
4. Supabase credentials loaded securely

---

## 13. Documentation SOP
Use this report structure:
1. Project title and team details
2. Problem statement and objectives
3. Dataset source and description
4. ERD and architecture diagram
5. Data pipeline and cleaning decisions
6. API design and sample responses
7. Dashboard UI screenshots
8. AI feature explanation with sample outputs
9. Deployment links
10. Challenges and lessons learned

---

## 14. Submission Checklist
1. Public GitHub repository link
2. Deployed frontend URL (Vercel)
3. Deployed backend URL (Render)
4. Supabase schema SQL file
5. Raw and cleaned dataset files
6. Evidence screenshots (import, dashboard, AI output)
7. Final report PDF/Doc
8. README with setup + architecture + API docs

---

## 15. Timeline / Sprint Plan (2 Weeks)
1. Sprint 1 (Days 1-3): dataset selection, validation, ERD, schema
2. Sprint 2 (Days 4-6): Python cleaning pipeline, CSV import, SQL queries
3. Sprint 3 (Days 7-10): backend APIs and AI endpoint
4. Sprint 4 (Days 11-13): frontend dashboard and API integration
5. Sprint 5 (Day 14): deployment, testing, final documentation

---

## 16. Coding Standards
1. TypeScript strict mode for frontend and backend
2. ESLint + Prettier formatting policy
3. Use async/await; avoid nested callbacks
4. Keep controllers thin; business logic in services
5. Use clear naming (`getKpiMetrics`, `buildInsightPrompt`)
6. No hard-coded secrets in source code

---

## 17. Environment Variable Setup
### 17.1 Backend `.env`
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key

AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-1.5-flash

GROQ_API_KEY=your_groq_key
GROQ_MODEL=llama3-8b-8192
```

### 17.2 Frontend `.env`
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_TITLE=DataInsights Analytics Dashboard
```

---

## 18. Security Best Practices
1. Keep service role key only in backend environment
2. Restrict CORS to Vercel production and local dev origins
3. Validate request payloads with schema validation
4. Sanitize query parameters
5. Use HTTPS-only deployed endpoints
6. Add basic API rate limiting on AI route
7. Avoid exposing stack traces to frontend

---

## 19. API Structure
### 19.1 Base URL
`/api`

### 19.2 Endpoints
1. `GET /api/health`
2. `GET /api/analytics/kpis`
3. `GET /api/analytics/top-categories?limit=5`
4. `GET /api/analytics/regional-distribution`
5. `GET /api/analytics/trend?from=YYYY-MM-DD&to=YYYY-MM-DD`
6. `POST /api/ai/insight`

### 19.3 Example Response
```json
{
  "success": true,
  "data": {
    "totalRevenue": 1250000.5,
    "avgProfitMargin": 17.2,
    "topCategory": "Electronics"
  }
}
```

---

## 20. Dashboard UI Requirements
1. Header with app title, date range, refresh button
2. 3 KPI cards minimum:
- Total Revenue
- Average Profit Margin
- Top Category
3. Filter panel:
- Region dropdown
- Date range picker
4. Minimum 3 charts:
- Bar chart (top categories)
- Pie chart (regional distribution)
- Line chart (monthly trend)
5. AI Insights panel:
- "Generate Insight" button
- response area with trend + recommendations
6. Data table with pagination/search (optional basic)
7. Fully responsive layout

---

## Dataset Ingestion SOP (Detailed)
1. Select source from Kaggle, data.gov.ph, UCI, Google Dataset Search, or OWID.
2. Confirm licensing allows educational use.
3. Validate:
- row count between 500 and 1000
- at least 5 business-meaningful columns
4. Save raw file to `dataset/raw/`.
5. Record metadata in `dataset/data_dictionary.md`:
- source URL
- download date
- column definitions
- assumptions
6. Upload raw dataset for traceability:
- Supabase Storage or
- GitHub repository or
- Google Drive
7. Capture evidence screenshots:
- source page
- row count preview
- upload confirmation

---

## Required Analytical Queries (Examples)
1. Top 5 categories by total revenue
```sql
select c.category_name, sum(s.revenue) as total_revenue
from sales_records s
join categories c on s.category_id = c.id
group by c.category_name
order by total_revenue desc
limit 5;
```

2. Average profit margin by region
```sql
select r.region_name, round(avg(s.profit_margin), 2) as avg_profit_margin
from sales_records s
join regions r on s.region_id = r.id
group by r.region_name
order by avg_profit_margin desc;
```

3. Monthly revenue trend
```sql
select date_trunc('month', record_date) as month, sum(revenue) as monthly_revenue
from sales_records
group by month
order by month asc;
```

Business insight documentation format:
1. Query objective
2. Metric definition
3. Result summary
4. Business implication
5. Recommended action

---

## Suggested Architecture
```text
[User Browser]
    |
    v
[Vercel React Frontend]
    |
    v
[Render Node/Express API]
   |                 \
   v                  v
[Supabase PostgreSQL] [Gemini API / Groq API]
    ^
    |
[Python ETL Pipeline]
```

---

## Bonus Features SOP (Optional)
1. Real-time API integration
- Use polling every 60 seconds or Supabase realtime channels

2. CSV export
- Add backend endpoint generating filtered CSV
- Frontend adds `Export CSV` button

3. Download chart as PNG
- Use `html2canvas` or chart library export plugin

4. Multi-turn AI conversations
- Add `conversationId` in backend memory store (Redis optional)
- Send previous prompts/responses for continuity

---

## Best Practices Checklist
1. Keep raw data immutable; clean data in separate folder.
2. Version SQL scripts and migration steps.
3. Validate API response contracts before frontend integration.
4. Use strongly typed DTOs/interfaces in TypeScript.
5. Add loading/error UI states for all async calls.
6. Use meaningful commit history and PR descriptions.
7. Capture proof screenshots after each milestone.

---

## Deployment Checklist
1. Supabase schema and data imported correctly
2. Backend env vars set in Render
3. Frontend env vars set in Vercel
4. CORS includes deployed frontend domain
5. Health endpoint responds in production
6. AI endpoint tested in production
7. Mobile responsiveness confirmed on deployed URL

