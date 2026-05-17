# Supabase Setup Guide (Phase 2 - Database Only)

This guide covers only Phase 2:
1. Create Supabase project
2. Run SQL schema
3. Import cleaned CSV
4. Validate row counts and sample queries

## Files used in this phase
- Schema SQL: `database/phase2_titanic_schema.sql`
- Validation SQL: `database/phase2_titanic_validation_queries.sql`
- CSV to import: `dataset/cleaned/titanic_train_cleaned_db.csv`

## Step-by-step in Supabase website

1. Open `https://database.new` and sign in to Supabase.
2. Create a new project:
- Choose your organization.
- Enter a project name (example: `finals-titanic-db`).
- Set a strong database password and store it safely.
- Select a region closest to your backend deployment/users.
- Click `Create new project`.
3. Wait until project status is ready, then open the project dashboard.
4. In the left sidebar, open **SQL Editor**.
5. Click **New query**.
6. Copy all SQL from `database/phase2_titanic_schema.sql` and paste it into SQL Editor.
7. Click **Run** and confirm there are no errors.
8. In the left sidebar, open **Table Editor**.
9. Open table `titanic_passengers` (created by the schema script).
10. Click **Insert** and select **Import data from CSV**.
11. Upload `dataset/cleaned/titanic_train_cleaned_db.csv`.
12. Confirm the column mapping matches:
- `passenger_id`
- `survived`
- `pclass`
- `name`
- `sex`
- `age`
- `sibsp`
- `parch`
- `ticket`
- `fare`
- `cabin`
- `embarked`
13. Start import and wait for completion.
14. Return to **SQL Editor** and open a new query.
15. Copy SQL from `database/phase2_titanic_validation_queries.sql`.
16. Run each query and verify:
- Row count is `891`.
- Null checks are acceptable.
- Class and survival distributions return non-empty results.

## Evidence screenshots to capture
Save these to `docs/evidence/`:
1. Supabase project dashboard (project created)
2. SQL Editor success after schema execution
3. CSV import success screen for `titanic_passengers`
4. Query result showing `total_rows = 891`

## Notes
- CSV dashboard import is suitable here because dataset size is small (<100MB).
- This guide intentionally stops at Phase 2 and does not include backend or frontend setup.
