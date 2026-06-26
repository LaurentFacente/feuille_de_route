-- Plans de la Shot List liés à une étape (ids de plans, même modèle que vehicles).
alter table public.steps
  add column if not exists shots text[] not null default '{}';
