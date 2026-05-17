# Phase 2 Supabase Runbook

This runbook executes Phase 2 for the Titanic cleaned dataset.

## 1) Create Supabase Project
1. Go to Supabase dashboard.
2. Create a new project.
3. Save these values for backend env setup:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

## 2) Run SQL Schema
1. Open `SQL Editor` in your Supabase project.
2. Paste and run the SQL from `database/schema.sql`.
3. Confirm table exists:
```sql
select table_name
from information_schema.tables
where table_schema = 'public' and table_name = 'titanic_passengers';
```

## 3) Import Cleaned CSV
1. Open `Table Editor` -> `titanic_passengers`.
2. Click `Import data` and upload:
   - `dataset/cleaned/titanic_train_cleaned.csv`
3. Ensure column mapping matches:
   - `PassengerId -> passenger_id`
   - `Survived -> survived`
   - `Pclass -> pclass`
   - `Name -> name`
   - `Sex -> sex`
   - `Age -> age`
   - `SibSp -> sibsp`
   - `Parch -> parch`
   - `Ticket -> ticket`
   - `Fare -> fare`
   - `Cabin -> cabin`
   - `Embarked -> embarked`
4. Keep blank values as `NULL` for `cabin` and `embarked`.

## 4) Validate Import
1. Run `database/validation_queries.sql` in Supabase `SQL Editor`.
2. Expected key checks:
   - `total_rows = 891`
   - `survived`: `0=549`, `1=342`
   - `sex`: `male=577`, `female=314`
   - `embarked`: `S=644`, `C=168`, `Q=77`, `NULL=2`
   - `null_age_count = 0`

## 5) Capture Evidence
Save screenshots in `docs/evidence/`:
1. Table created (`titanic_passengers`)
2. CSV import success
3. Validation query results

