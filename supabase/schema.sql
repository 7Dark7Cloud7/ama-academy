-- CEU Academy / AMA — Production MVP Database Schema (Supabase / PostgreSQL)
-- Run in Supabase SQL Editor to activate persistent cloud sync for /api/mvp.

create table if not exists public.mvp_decks (
  id text primary key,
  title text not null default '',
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.mvp_profiles (
  id text primary key,
  title text not null default '',
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.mvp_classes (
  id text primary key,
  title text not null default '',
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.mvp_student_cards (
  id text primary key,
  title text not null default '',
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.mvp_quiz_attempts (
  id text primary key,
  title text not null default '',
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Indexes for fast recent lookups
create index if not exists idx_mvp_decks_updated on public.mvp_decks (updated_at desc);
create index if not exists idx_mvp_classes_updated on public.mvp_classes (updated_at desc);
create index if not exists idx_mvp_quiz_updated on public.mvp_quiz_attempts (updated_at desc);

-- Row Level Security (enable and tailor policies to your auth setup)
alter table public.mvp_decks enable row level security;
alter table public.mvp_profiles enable row level security;
alter table public.mvp_classes enable row level security;
alter table public.mvp_student_cards enable row level security;
alter table public.mvp_quiz_attempts enable row level security;

-- Authenticated / MVP public-beta policies (replace with auth.uid() checks in production)
do $$
declare tbl text;
begin
  foreach tbl in array array['mvp_decks','mvp_profiles','mvp_classes','mvp_student_cards','mvp_quiz_attempts'] loop
    execute format('drop policy if exists "mvp_read" on public.%I', tbl);
    execute format('drop policy if exists "mvp_write" on public.%I', tbl);
    execute format('create policy "mvp_read" on public.%I for select using (true)', tbl);
    execute format('create policy "mvp_write" on public.%I for all using (true) with check (true)', tbl);
  end loop;
end $$;
