-- Phase 2 validation queries for Titanic import
-- Run these after CSV import into public.titanic_passengers.

-- 1) Row count should be exactly 891
select count(*) as total_rows
from public.titanic_passengers;

-- 2) Survival distribution should be 549 (0) and 342 (1)
select survived, count(*) as passenger_count
from public.titanic_passengers
group by survived
order by survived;

-- 3) Sex distribution should be 577 male and 314 female
select sex, count(*) as passenger_count
from public.titanic_passengers
group by sex
order by sex;

-- 4) Embarked distribution should be S=644, C=168, Q=77, NULL=2
select coalesce(embarked, 'NULL') as embarked_port, count(*) as passenger_count
from public.titanic_passengers
group by coalesce(embarked, 'NULL')
order by embarked_port;

-- 5) Sanity checks: no null age, min/max and mean values aligned with cleaned CSV
select
  count(*) filter (where age is null) as null_age_count,
  min(age) as min_age,
  max(age) as max_age,
  round(avg(age), 4) as avg_age,
  round(avg(fare), 4) as avg_fare
from public.titanic_passengers;

-- 6) Example analytics query: survival rate by class
select
  pclass,
  count(*) as total_passengers,
  sum(survived) as survivors,
  round(100.0 * avg(survived), 2) as survival_rate_pct
from public.titanic_passengers
group by pclass
order by pclass;

