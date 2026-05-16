# Implementation Tracker

## Phase 0 - Setup
1. [x] Create monorepo folder structure
2. [ ] Initialize git repository
3. [ ] Push initial scaffold to GitHub

## Phase 1 - Data
1. [ ] Select approved public dataset (500-1000 rows)
2. [ ] Save raw CSV to `dataset/raw/`
3. [ ] Document metadata in `dataset/data_dictionary.md`
4. [ ] Run Python cleaning script
5. [ ] Save cleaned CSV to `dataset/cleaned/`

## Phase 2 - Database
1. [ ] Create Supabase project
2. [ ] Run SQL schema
3. [ ] Import cleaned CSV
4. [ ] Validate counts and sample queries

## Phase 3 - Backend
1. [ ] Scaffold Express + TS app
2. [ ] Add analytics routes
3. [ ] Add AI insight route
4. [ ] Add validation, error handling, CORS
5. [ ] Test endpoints locally

## Phase 4 - Frontend
1. [ ] Scaffold React + Vite + TS + Tailwind
2. [ ] Build KPI cards + filters + charts
3. [ ] Connect backend APIs
4. [ ] Add AI insight panel
5. [ ] Validate responsive behavior

## Phase 5 - Deployment
1. [ ] Deploy backend to Render
2. [ ] Deploy frontend to Vercel
3. [ ] Configure production env vars
4. [ ] Run production smoke tests

## Phase 6 - Final Submission
1. [ ] Finalize README and report
2. [ ] Collect screenshots
3. [ ] Verify submission checklist
