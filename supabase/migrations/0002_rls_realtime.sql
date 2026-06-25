-- =============================================================================
-- RLS + Temps réel
--
-- Modèle de sécurité : outil interne privé d'une équipe de tournage (5-20 pers.)
-- partageant UNE source de vérité, SANS écran de connexion. L'accès se fait via
-- la clé publique `anon` (rôle `anon`). RLS est activé sur toutes les tables et
-- autorise lecture + écriture pour les rôles `anon` et `authenticated`.
--
-- Compromis assumé : toute personne disposant de l'URL + clé anon (publique par
-- nature) accède au projet. C'est acceptable pour un outil interne éphémère ;
-- l'URL de déploiement joue le rôle de secret partagé.
-- =============================================================================

do $$
declare
  t text;
  tables text[] := array[
    'projects','days','steps','sub_steps','people','vehicles','materials',
    'checklist_categories','checklist_items','comments','locations',
    'step_people','step_vehicles','step_materials'
  ];
begin
  foreach t in array tables loop
    execute format('alter table public.%I enable row level security;', t);

    -- Idempotent : on (re)crée la policy d'accès complet.
    execute format('drop policy if exists "team_full_access" on public.%I;', t);
    execute format($f$
      create policy "team_full_access" on public.%I
        for all
        to anon, authenticated
        using (true)
        with check (true);
    $f$, t);
  end loop;
end$$;

-- Publication temps réel : Supabase diffuse les changements (INSERT/UPDATE/DELETE)
-- des tables ci-dessous via WebSocket (Postgres CDC).
do $$
declare
  t text;
  tables text[] := array[
    'projects','days','steps','sub_steps','people','vehicles','materials',
    'checklist_categories','checklist_items','comments','locations',
    'step_people','step_vehicles','step_materials'
  ];
begin
  foreach t in array tables loop
    -- REPLICA IDENTITY FULL pour recevoir les anciennes valeurs sur DELETE/UPDATE.
    execute format('alter table public.%I replica identity full;', t);
    begin
      execute format('alter publication supabase_realtime add table public.%I;', t);
    exception
      when duplicate_object then null; -- déjà dans la publication
    end;
  end loop;
end$$;
