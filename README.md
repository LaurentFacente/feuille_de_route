# Feuille de route — Plateforme collaborative temps réel

Application de pilotage d'un week-end de tournage. Toute l'équipe (régie, chef
opérateur, assistants, BTS, artistes, production) partage **une seule source de
vérité**. Chaque modification est synchronisée **en temps réel** sur tous les
écrans, sans rafraîchir la page.

## Stack

| Couche          | Choix                                  | Pourquoi |
| --------------- | -------------------------------------- | -------- |
| Frontend        | React 19 + Vite + TypeScript + Tailwind | Existant, mobile-first |
| État / cache    | Zustand + React Query                  | Existant, mises à jour optimistes |
| Base de données | **PostgreSQL (Supabase)**              | Managé, robuste, free tier |
| API             | **PostgREST** (auto) + couche typée `src/api` | Zéro serveur à maintenir |
| Temps réel      | **Supabase Realtime** (Postgres CDC / WebSocket) | Sync instantanée |
| Accès           | **Sans connexion** — clé `anon` publique + RLS | Zéro friction pour l'équipe |
| Hébergement     | **Vercel** (front) + **Supabase** (back) | Déploiement < 30 min, coût mini |

> Décision : pas de backend Node custom. Les critères (coût, vitesse de
> déploiement, maintenance, temps réel) sont tous mieux servis par une solution
> managée. La logique « backend » vit dans les migrations SQL (schéma + RLS) et
> une couche d'accès typée côté client (`src/api`).

## Démarrage rapide (local)

```bash
nvm use 20
npm install
cp .env.example .env          # puis renseigner les clés Supabase

# Option A — Supabase local (Docker requis)
npm run db:start              # démarre Postgres + Studio + Realtime
npm run db:reset              # applique les migrations
npm run db:seed               # importe les données du JSON existant

# Option B — Projet Supabase cloud
npm run db:push               # applique les migrations sur le projet lié
npm run db:seed

npm run dev                   # http://localhost:5173
```

Voir [docs/LANCEMENT_LOCAL.md](docs/LANCEMENT_LOCAL.md) pour le détail.

## Déploiement production (< 30 min)

Voir [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). En résumé : créer un projet
Supabase, `supabase db push`, `npm run db:seed`, brancher Vercel sur le repo
avec les variables d'environnement, c'est en ligne.

## Documentation

- [Architecture](docs/ARCHITECTURE.md) — vue d'ensemble, arborescence, flux temps réel
- [Schéma & API](docs/API.md) — tables, relations, endpoints, validation, pagination
- [Migration JSON → DB](docs/MIGRATION.md) — plan et stratégie de seed
- [Lancement local](docs/LANCEMENT_LOCAL.md)
- [Déploiement](docs/DEPLOYMENT.md)

## Scripts npm

| Script | Rôle |
| ------ | ---- |
| `npm run dev` | Serveur de dev Vite |
| `npm run build` | Build production (tsc + vite) |
| `npm run typecheck` | Vérification de types |
| `npm run lint` | oxlint |
| `npm run db:start` / `db:stop` | Stack Supabase locale |
| `npm run db:reset` | Recrée la base locale (migrations) |
| `npm run db:push` | Applique les migrations sur le projet lié |
| `npm run db:seed` | Importe `mockData.ts` dans la base |
| `npm run db:setup` | `db:push` + `db:seed` |
| `npm run db:types` | Régénère `src/api/database.types.ts` |
