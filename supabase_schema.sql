-- Rouuuuue — Schéma Supabase
-- À exécuter dans l'éditeur SQL de ton projet Supabase

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  break_name text not null,
  give_players text[] not null default '{}',
  paid_spots jsonb not null default '[]'
);

create table if not exists draws (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete set null,
  created_at timestamptz default now(),
  spot_name text not null,
  draw_count integer not null,
  results jsonb not null default '[]'
);

-- Indexes
create index if not exists draws_session_id_idx on draws(session_id);
create index if not exists draws_created_at_idx on draws(created_at desc);
create index if not exists sessions_created_at_idx on sessions(created_at desc);

-- RLS (Row Level Security) — accès public pour cette app sans auth
alter table sessions enable row level security;
alter table draws enable row level security;

create policy "allow all sessions" on sessions for all using (true) with check (true);
create policy "allow all draws" on draws for all using (true) with check (true);
