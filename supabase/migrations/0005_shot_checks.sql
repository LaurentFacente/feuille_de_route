-- =============================================================================
-- Shot List : état coché PARTAGÉ par toute l'équipe (un plan tourné = tourné
-- pour tout le monde). Le catalogue des plans est statique côté client ; seule
-- la coche (plan_id → checked) est persistée et diffusée en temps réel.
-- =============================================================================
create table if not exists public.shot_checks (
  project_id text not null references public.projects(id) on delete cascade,
  plan_id    text not null,
  checked    boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (project_id, plan_id)
);

create index if not exists shot_checks_project_id_idx on public.shot_checks(project_id);

-- RLS : accès complet pour anon + authenticated (même modèle que les autres tables).
alter table public.shot_checks enable row level security;
drop policy if exists "team_full_access" on public.shot_checks;
create policy "team_full_access" on public.shot_checks
  for all
  to anon, authenticated
  using (true)
  with check (true);

-- Temps réel : diffuser les changements via WebSocket.
alter table public.shot_checks replica identity full;
do $$
begin
  alter publication supabase_realtime add table public.shot_checks;
exception
  when duplicate_object then null;
end$$;
