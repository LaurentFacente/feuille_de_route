-- Véhicules assignés à une étape (noms, même modèle que participants / equipment).
alter table public.steps
  add column if not exists vehicles text[] not null default '{}';
