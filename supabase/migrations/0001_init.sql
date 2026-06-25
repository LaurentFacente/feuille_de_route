-- =============================================================================
-- Feuille de route — Schéma initial
--
-- Conventions :
--   * Clés primaires en TEXT : on préserve les identifiants existants des JSON
--     (ex. "fri-setup", "p-benny", "cl-camera-0") afin de migrer sans perte et
--     de garder le frontend inchangé (les ids sont déjà générés côté client).
--   * updated_at maintenu automatiquement par trigger (concurrence / tri).
--   * Suppressions en cascade depuis le projet → journées → étapes → sous-étapes.
-- =============================================================================

create extension if not exists "pgcrypto";

-- Trigger générique de mise à jour de updated_at -----------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Projet ----------------------------------------------------------------------
create table public.projects (
  id          text primary key,
  name        text not null,
  subtitle    text not null default '',
  description text,
  date_debut  date,
  date_fin    date,
  statut      text not null default 'En cours',
  version     int  not null default 1,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Journée (Vendredi / Samedi / Dimanche) --------------------------------------
create table public.days (
  id         text primary key,
  project_id text not null references public.projects(id) on delete cascade,
  label      text not null,
  date       date,
  subtitle   text,
  ordre      int  not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index days_project_id_idx on public.days(project_id);

-- Étape -----------------------------------------------------------------------
-- start_at / end_at  = heureDebut / heureFin (spec)
-- location           = lieu (spec)
-- status             = A venir | En cours | Terminé | Retard | Annulé (spec)
-- participants/equipment/details : conservés tels quels (free-form, aucune perte)
create table public.steps (
  id            text primary key,
  day_id        text not null references public.days(id) on delete cascade,
  title         text not null,
  phase         text not null default '',
  -- Heures "wall-clock" du tournage stockées en ISO naïf (text) :
  -- préserve exactement la valeur saisie, sans conversion de fuseau.
  start_at      text,
  end_at        text,
  location      text,
  participants  text[] not null default '{}',
  equipment     text[] not null default '{}',
  details       text[] not null default '{}',
  override      text not null default 'auto',     -- auto | done | skipped | ignored
  shift_minutes int  not null default 0,
  status        text not null default 'A venir',  -- A venir | En cours | Terminé | Retard | Annulé
  couleur       text,
  priorite      text,
  ordre         int  not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index steps_day_id_idx on public.steps(day_id);

-- Sous-étape ------------------------------------------------------------------
create table public.sub_steps (
  id          text primary key,
  step_id     text not null references public.steps(id) on delete cascade,
  titre       text not null,
  heure_debut text,
  heure_fin   text,
  statut      text not null default 'A venir',
  ordre       int  not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index sub_steps_step_id_idx on public.sub_steps(step_id);

-- Personne --------------------------------------------------------------------
create table public.people (
  id           text primary key,
  project_id   text not null references public.projects(id) on delete cascade,
  name         text not null,
  role         text not null default '',
  phone        text,
  availability text,
  vehicle      text,
  notes        text,
  ordre        int  not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index people_project_id_idx on public.people(project_id);

-- Véhicule --------------------------------------------------------------------
create table public.vehicles (
  id         text primary key,
  project_id text not null references public.projects(id) on delete cascade,
  name       text not null,
  driver     text,
  type       text,
  passengers text[] not null default '{}',
  cargo      text[] not null default '{}',
  notes      text,
  ordre      int  not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index vehicles_project_id_idx on public.vehicles(project_id);

-- Matériel --------------------------------------------------------------------
create table public.materials (
  id         text primary key,
  project_id text not null references public.projects(id) on delete cascade,
  name       text not null,
  categorie  text,
  quantite   int  not null default 1,
  statut     text not null default 'Disponible',
  notes      text,
  ordre      int  not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index materials_project_id_idx on public.materials(project_id);

-- Checklist : catégorie + items ----------------------------------------------
create table public.checklist_categories (
  id         text primary key,
  project_id text not null references public.projects(id) on delete cascade,
  name       text not null,
  ordre      int  not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index checklist_categories_project_id_idx on public.checklist_categories(project_id);

create table public.checklist_items (
  id          text primary key,
  category_id text not null references public.checklist_categories(id) on delete cascade,
  label       text not null,
  checked     boolean not null default false,
  ordre       int  not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index checklist_items_category_id_idx on public.checklist_items(category_id);

-- Commentaire -----------------------------------------------------------------
-- text = contenu (spec) ; entite_associee = entité générique (spec).
-- step_id permet d'attacher un commentaire à une étape (usage actuel).
create table public.comments (
  id              text primary key,
  step_id         text references public.steps(id) on delete cascade,
  author          text not null default 'Anonyme',
  text            text not null,
  entite_associee text,
  created_at      timestamptz not null default now()
);
create index comments_step_id_idx on public.comments(step_id);

-- Lieu ------------------------------------------------------------------------
create table public.locations (
  id         text primary key,
  project_id text not null references public.projects(id) on delete cascade,
  name       text not null,
  adresse    text,
  gps        text,
  notes      text,
  ordre      int  not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index locations_project_id_idx on public.locations(project_id);

-- Relations N-N entre une étape et personnes / véhicules / matériels ----------
-- (spec : « une étape peut contenir plusieurs personnes/véhicules/matériels »).
create table public.step_people (
  step_id   text not null references public.steps(id) on delete cascade,
  person_id text not null references public.people(id) on delete cascade,
  primary key (step_id, person_id)
);

create table public.step_vehicles (
  step_id    text not null references public.steps(id) on delete cascade,
  vehicle_id text not null references public.vehicles(id) on delete cascade,
  primary key (step_id, vehicle_id)
);

create table public.step_materials (
  step_id     text not null references public.steps(id) on delete cascade,
  material_id text not null references public.materials(id) on delete cascade,
  primary key (step_id, material_id)
);

-- Triggers updated_at ---------------------------------------------------------
create trigger trg_projects_updated   before update on public.projects             for each row execute function public.set_updated_at();
create trigger trg_days_updated        before update on public.days                 for each row execute function public.set_updated_at();
create trigger trg_steps_updated       before update on public.steps                for each row execute function public.set_updated_at();
create trigger trg_sub_steps_updated   before update on public.sub_steps            for each row execute function public.set_updated_at();
create trigger trg_people_updated      before update on public.people               for each row execute function public.set_updated_at();
create trigger trg_vehicles_updated    before update on public.vehicles             for each row execute function public.set_updated_at();
create trigger trg_materials_updated   before update on public.materials            for each row execute function public.set_updated_at();
create trigger trg_cl_cat_updated      before update on public.checklist_categories for each row execute function public.set_updated_at();
create trigger trg_cl_item_updated     before update on public.checklist_items      for each row execute function public.set_updated_at();
create trigger trg_locations_updated   before update on public.locations            for each row execute function public.set_updated_at();
