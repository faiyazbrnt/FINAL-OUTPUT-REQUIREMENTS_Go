-- Phase 2 (Database only): Titanic schema for Supabase PostgreSQL
-- Run this entire script in Supabase SQL Editor.

create table if not exists public.titanic_passengers (
  passenger_id integer primary key,
  survived smallint not null check (survived in (0, 1)),
  pclass smallint not null check (pclass in (1, 2, 3)),
  name text not null,
  sex text not null check (sex in ('male', 'female')),
  age numeric(5,2),
  sibsp integer not null check (sibsp >= 0),
  parch integer not null check (parch >= 0),
  ticket text not null,
  fare numeric(10,4) not null check (fare >= 0),
  cabin text,
  embarked text check (embarked in ('C', 'Q', 'S') or embarked is null)
);

create index if not exists idx_titanic_survived on public.titanic_passengers (survived);
create index if not exists idx_titanic_pclass on public.titanic_passengers (pclass);
create index if not exists idx_titanic_sex on public.titanic_passengers (sex);
create index if not exists idx_titanic_embarked on public.titanic_passengers (embarked);
