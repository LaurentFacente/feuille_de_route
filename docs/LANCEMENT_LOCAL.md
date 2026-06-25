# Guide de lancement local

## Prérequis

- Node 20 (`nvm use 20`)
- npm
- (Option A) Docker Desktop pour Supabase en local
- La CLI Supabase est utilisée via `npx supabase` (aucune install globale requise)

## Option A — Tout en local (Docker)

```bash
nvm use 20
npm install
cp .env.example .env
```

Renseigner `.env` avec les valeurs locales affichées par `db:start` :

```bash
npm run db:start
# La commande affiche : API URL, anon key, service_role key.
```

`.env` local typique :

```env
VITE_SUPABASE_URL="http://127.0.0.1:54321"
VITE_SUPABASE_ANON_KEY="<anon key affichée>"
VITE_PROJECT_ID="tehazed"
SUPABASE_URL="http://127.0.0.1:54321"
SUPABASE_SERVICE_ROLE_KEY="<service_role key affichée>"
```

Puis :

```bash
npm run db:reset     # applique les migrations sur la base locale
npm run db:seed      # importe les données de mockData.ts
npm run dev          # http://localhost:5173
```

Studio (inspection de la base) : http://127.0.0.1:54323

## Option B — Projet Supabase cloud (sans Docker)

1. Créer un projet sur https://supabase.com.
2. Récupérer dans **Project Settings → API** : Project URL, `anon`, `service_role`.
3. Lier et pousser le schéma :

```bash
npx supabase login
npx supabase link --project-ref <ref-du-projet>
npm run db:push
```

4. Remplir `.env` (URL + clés du projet cloud), puis :

```bash
npm run db:seed
npm run dev
```

## Test du temps réel

Ouvrir l'app dans **deux navigateurs** (ou deux onglets). Cocher un item de
checklist ou déplacer une heure dans l'un : la modification apparaît
**instantanément** dans l'autre, sans rafraîchir et sans connexion.

## Dépannage

| Symptôme | Cause probable | Solution |
| -------- | -------------- | -------- |
| Écran « Variable d'environnement manquante » | `.env` incomplet | Vérifier `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` |
| Lecture/écriture refusée | RLS non appliqué | Rejouer `0002_rls_realtime.sql` (`db:reset` / `db:push`) |
| Pas de temps réel | Tables hors publication | Rejouer `0002_rls_realtime.sql` (`db:reset` / `db:push`) |
| `db:seed` échoue | `service_role` manquante | Renseigner `SUPABASE_SERVICE_ROLE_KEY` dans `.env` |
