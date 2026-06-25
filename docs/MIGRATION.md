# Plan de migration JSON → Base de données

## Situation de départ

Les données vivaient dans `src/features/roadmap/mockData.ts` (objet `Roadmap`
typé) et étaient persistées par utilisateur dans `localStorage` via Zustand.
Aucune source partagée, aucun temps réel.

## Cible

Une base PostgreSQL (Supabase) comme **source de vérité unique**, alimentée
automatiquement depuis les données existantes — **sans aucune perte**.

## Stratégie « zéro perte, zéro duplication »

Le seed (`scripts/seed.ts`) **importe directement `mockData.ts`** plutôt que de
recopier les données en SQL. Avantages :

- La source reste unique : pas de divergence entre JSON et SQL.
- Tout champ existant est transféré tel quel (titres, heures, participants,
  équipements, détails, checklists, véhicules, équipe…).
- Idempotent : le seed purge le projet puis réinsère, donc rejouable sans risque.

### Correspondance des modèles

| JSON (`Roadmap`) | Table(s) |
| ---------------- | -------- |
| `projectName`, `subtitle`, `version` | `projects` (1 ligne) |
| `days[]` | `days` (`ordre` = position) |
| `days[].steps[]` | `steps` (`start`→`start_at`, `end`→`end_at`, arrays conservés) |
| `steps[].comments[]` | `comments` (`text`, `createdAt`→`created_at`) |
| `team[]` | `people` |
| `vehicles[]` | `vehicles` |
| `checklists[]` / `.items[]` | `checklist_categories` / `checklist_items` |

### Relations dérivées

Le seed remplit aussi `step_people` par **correspondance de prénom** entre
`steps[].participants` et `team[].name` (best-effort), pour matérialiser la
relation N-N « une étape ↔ plusieurs personnes » tout en conservant les valeurs
free-form d'origine dans `steps.participants[]`.

## Procédure

```bash
# 1. Schéma
npm run db:push        # (ou db:reset en local)

# 2. Import des données existantes
npm run db:seed

# 3. Vérifier dans Supabase Studio (table editor) que tout est présent.
```

## Réversibilité / sauvegarde

- L'export JSON reste disponible dans l'app (Réglages → Exporter le JSON), ce qui
  permet une sauvegarde à tout moment.
- L'import JSON (Réglages → Importer) appelle `replaceRoadmap` : il remplace le
  contenu du projet par le fichier fourni (utile pour restaurer une sauvegarde).
- Re-seed : `npm run db:seed` réimporte l'état initial de `mockData.ts`.
