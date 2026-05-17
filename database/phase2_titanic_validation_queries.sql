-- Phase 2 validation and sample analytical queries
-- Run these after importing dataset/cleaned/titanic_train_cleaned_db.csv.

-- 1) Row count check (expected: 891)
select count(*) as total_rows
from public.titanic_passengers;

-- 2) Null checks on key columns
select
  count(*) filter (where passenger_id is null) as null_passenger_id,
  count(*) filter (where survived is null) as null_survived,
  count(*) filter (where pclass is null) as null_pclass,
  count(*) filter (where sex is null) as null_sex,
  count(*) filter (where fare is null) as null_fare
from public.titanic_passengers;

-- 3) Distribution by class
select
  pclass,
  count(*) as passenger_count
from public.titanic_passengers
group by pclass
order by pclass;

-- 4) Survival rate by sex
select
  sex,
  round(avg(survived::numeric) * 100, 2) as survival_rate_pct,
  count(*) as passenger_count
from public.titanic_passengers
group by sex
order by survival_rate_pct desc;

-- 5) Survival rate by embarkation port
select
  coalesce(embarked, 'Unknown') as embarked,
  round(avg(survived::numeric) * 100, 2) as survival_rate_pct,
  count(*) as passenger_count
from public.titanic_passengers
group by coalesce(embarked, 'Unknown')
order by survival_rate_pct desc;
