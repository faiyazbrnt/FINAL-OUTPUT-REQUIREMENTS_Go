-- Titanic analytics table for Supabase PostgreSQL
-- Source CSV: dataset/cleaned/titanic_train_cleaned.csv

create table if not exists public.titanic_passengers (
  passenger_id integer primary key,
  survived smallint not null check (survived in (0, 1)),
  pclass smallint not null check (pclass in (1, 2, 3)),
  name text not null,
  sex text not null check (sex in ('male', 'female')),
  age numeric(5, 2) not null check (age >= 0),
  sibsp smallint not null check (sibsp >= 0),
  parch smallint not null check (parch >= 0),
  ticket text not null,
  fare numeric(10, 4) not null check (fare >= 0),
  cabin text,
  embarked text check (embarked in ('C', 'Q', 'S') or embarked is null),
  created_at timestamptz not null default now()
);

create index if not exists idx_titanic_survived on public.titanic_passengers (survived);
create index if not exists idx_titanic_pclass on public.titanic_passengers (pclass);
create index if not exists idx_titanic_sex on public.titanic_passengers (sex);
create index if not exists idx_titanic_embarked on public.titanic_passengers (embarked);
create index if not exists idx_titanic_age on public.titanic_passengers (age);
create index if not exists idx_titanic_fare on public.titanic_passengers (fare);

