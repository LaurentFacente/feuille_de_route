# Architecture

## Vue d'ensemble

```
┌──────────────────────────────────────────────────────────────┐
│                        Navigateurs (5-20)                       │
│   Régie · Chef op · Assistant cam · BTS · Artistes · Prod       │
└───────────────┬───────────────────────────┬───────────────────┘
                │ HTTPS (REST PostgREST)     │ WebSocket (Realtime)
                ▼                            ▼
┌──────────────────────────────────────────────────────────────┐
│                         SUPABASE                                │
│  ┌────────────┐   ┌──────────────┐                              │
│  │ PostgREST  │   │  Realtime     │   (accès direct via clé anon)│
│  │ (API CRUD) │   │  (Postgres CDC)│   (aucune connexion)        │
│  └─────┬──────┘   └──────┬────────┘                              │
│        │                 │                                       │
│        ▼                 ▼                                       │
│  ┌──────────────────────────────────────────────────────┐     │
│  │            PostgreSQL  +  Row Level Security           │     │
│  └──────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────┘
```

## Flux temps réel

1. Un utilisateur coche « FX6 récupérée ».
2. Le store applique une **mise à jour optimiste** locale (UI instantanée pour
   l'acteur) puis envoie l'écriture à Supabase (`src/api`).
3. PostgreSQL émet un événement de changement (CDC) sur la table concernée.
4. Supabase Realtime diffuse l'événement à **tous les clients abonnés** via
   WebSocket.
5. Chaque client recharge la roadmap (`fetchRoadmap`, débauncé 150 ms) → l'état
   converge vers la base. Simple et robuste pour ce volume.

> Recharger l'objet complet à chaque changement est volontaire : les données
> sont petites (un week-end), et cela élimine toute logique de merge partiel
> source de bugs. Robustesse > micro-optimisation.

## Arborescence (partie backend / données)

```
supabase/
├── config.toml                 # Config CLI (realtime, ports)
└── migrations/
    ├── 0001_init.sql           # Schéma : tables, index, triggers updated_at
    └── 0002_rls_realtime.sql   # RLS (accès équipe) + publication temps réel

scripts/
└── seed.ts                     # Import mockData.ts → base (idempotent)

src/
├── lib/
│   ├── env.ts                  # Validation des variables d'environnement
│   └── supabase.ts             # Client Supabase typé (singleton)
├── api/                        # ← « Backend » côté client : accès données
│   ├── database.types.ts       # Types DB (Row/Insert/Update) typés de bout en bout
│   ├── errors.ts               # ApiError + traduction PostgREST → FR
│   ├── logger.ts               # Logger structuré (debug/info/warn/error)
│   ├── pagination.ts           # Helpers de pagination par offset
│   ├── schemas.ts              # Schémas de validation zod (entrées d'API)
│   ├── mappers.ts              # Row (snake_case) ↔ domaine (camelCase)
│   ├── roadmap.api.ts          # Assemblage Roadmap + mutations + import/reset
│   ├── entities.api.ts         # CRUD générique (matériel, lieux, sous-étapes)
│   └── realtime.ts             # Abonnement aux changements Postgres
└── features/
    └── roadmap/
        ├── types.ts            # Modèle de domaine (inchangé)
        ├── mockData.ts         # Données initiales (source du seed)
        ├── store.ts            # Store DB-backed (interface publique INCHANGÉE)
        └── RoadmapProvider.tsx # Bootstrap + synchro temps réel
```

## Principe clé : interface du store préservée

Le store `useRoadmapStore` conserve **exactement** la même interface publique
qu'avant (mêmes signatures d'actions, même forme `Roadmap`). Seul son moteur a
changé : `localStorage` → Supabase + temps réel. Conséquence : les **13
composants consommateurs n'ont pas été modifiés**, ce qui maximise la vitesse de
livraison et minimise le risque de régression.

## Séparation des responsabilités

- **UI pure** (`components`, `features/**/*.tsx`) : présentation uniquement.
- **Logique métier / accès données** : `src/api/*.api.ts`, `*.utils.ts`.
- **État** : zustand (`store.ts`), réconcilié par le temps réel.

## Sécurité

- **Aucun écran de connexion** : l'app accède à la base via la clé `anon`
  publique. C'est un choix assumé pour un outil interne éphémère.
- RLS activé sur toutes les tables, avec une policy « accès complet équipe »
  pour les rôles `anon` et `authenticated` (lecture + écriture).
- Le secret d'accès est de fait **l'URL de déploiement** (à ne pas diffuser
  publiquement).
- La clé `service_role` est **strictement serveur** (seed, CI) et jamais commitée.
- Pour durcir l'accès plus tard sans réintroduire de login : restreindre par
  réseau (Vercel password protection) ou ajouter une auth Supabase et resserrer
  les policies sur `authenticated`.
