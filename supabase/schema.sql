-- CEU Academy / AMA — Sistema Completo para Escolas & Universidades (Supabase / PostgreSQL)
-- Execute no Supabase SQL Editor para ativar sincronização multi-turmas em nuvem (Realtime + REST).

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

-- Multi-turmas (Escolas, Institutos Médios, Universidades e Cursos Livres)
create table if not exists public.mvp_classes (
  id text primary key,
  title text not null default '',
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Cartões Digitais de Estudante (CEU)
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

-- Publicação de Aulas (Slides IA/3D, PDFs, resumos e tarefas por turma)
create table if not exists public.mvp_lessons (
  id text primary key,
  title text not null default '',
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Mentorias Académicas & Profissionais (mentores e marcações)
create table if not exists public.mvp_mentorships (
  id text primary key,
  title text not null default '',
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Estágios & Candidaturas em Angola
create table if not exists public.mvp_internships (
  id text primary key,
  title text not null default '',
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Presidentes de Associações de Estudantes (AE), Delegados de Turma e Comunicados
create table if not exists public.mvp_delegates (
  id text primary key,
  title text not null default '',
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Universidades, Grandes Faculdades & Escolas Parceiras de Angola
create table if not exists public.mvp_universities (
  id text primary key,
  title text not null default '',
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Aulas Online Ao Vivo & Inscrições de Estudantes
create table if not exists public.mvp_online_classes (
  id text primary key,
  title text not null default '',
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Índices para consultas rápidas ordenadas por atualização
create index if not exists idx_mvp_decks_updated on public.mvp_decks (updated_at desc);
create index if not exists idx_mvp_classes_updated on public.mvp_classes (updated_at desc);
create index if not exists idx_mvp_lessons_updated on public.mvp_lessons (updated_at desc);
create index if not exists idx_mvp_mentorships_updated on public.mvp_mentorships (updated_at desc);
create index if not exists idx_mvp_internships_updated on public.mvp_internships (updated_at desc);
create index if not exists idx_mvp_delegates_updated on public.mvp_delegates (updated_at desc);
create index if not exists idx_mvp_universities_updated on public.mvp_universities (updated_at desc);
create index if not exists idx_mvp_quiz_updated on public.mvp_quiz_attempts (updated_at desc);

-- Row Level Security (RLS) + Políticas MVP prontas (aperte com auth.uid() em produção fechada)
do $$
declare tbl text;
begin
  foreach tbl in array array[
    'mvp_decks','mvp_profiles','mvp_classes','mvp_student_cards','mvp_quiz_attempts',
    'mvp_lessons','mvp_mentorships','mvp_internships','mvp_delegates','mvp_universities','mvp_online_classes'
  ] loop
    execute format('alter table public.%I enable row level security', tbl);
    execute format('drop policy if exists "mvp_read" on public.%I', tbl);
    execute format('drop policy if exists "mvp_write" on public.%I', tbl);
    execute format('create policy "mvp_read" on public.%I for select using (true)', tbl);
    execute format('create policy "mvp_write" on public.%I for all using (true) with check (true)', tbl);
  end loop;
end $$;

-- Publicação Realtime (opcional — ignora se já existir)
do $$
declare tbl text;
begin
  foreach tbl in array array['mvp_classes','mvp_lessons','mvp_delegates','mvp_mentorships','mvp_internships'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', tbl);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;
