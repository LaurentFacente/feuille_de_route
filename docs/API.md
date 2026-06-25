# Schéma de base de données & API

## Schéma relationnel

```
projects (1) ──< days (1) ──< steps (1) ──< sub_steps
                                  │  └──< comments
                                  │
                  step_people >──┤──< people  (N-N)
               step_vehicles >───┤──< vehicles (N-N)
              step_materials >───┘──< materials (N-N)

projects (1) ──< people
projects (1) ──< vehicles
projects (1) ──< materials
projects (1) ──< locations
projects (1) ──< checklist_categories (1) ──< checklist_items
```

### Tables

| Table | Entité (spec) | Champs notables |
| ----- | ------------- | --------------- |
| `projects` | Projet | `name`, `subtitle`, `description`, `date_debut`, `date_fin`, `statut`, `version` |
| `days` | Journée | `project_id`, `label`, `date`, `ordre` |
| `steps` | Étape | `day_id`, `title`, `phase`, `start_at`, `end_at`, `location`, `participants[]`, `equipment[]`, `details[]`, `status`, `couleur`, `priorite`, `override`, `shift_minutes` |
| `sub_steps` | Sous-étape | `step_id`, `titre`, `heure_debut`, `heure_fin`, `statut` |
| `people` | Personne | `name`, `role`, `phone`, `availability`, `vehicle`, `notes` |
| `vehicles` | Véhicule | `name`, `driver`, `type`, `passengers[]`, `cargo[]`, `notes` |
| `materials` | Matériel | `name`, `categorie`, `quantite`, `statut`, `notes` |
| `checklist_categories` / `checklist_items` | Checklist | `name` / `label`, `checked` |
| `comments` | Commentaire | `step_id`, `author`, `text`, `entite_associee`, `created_at` |
| `locations` | Lieu | `name`, `adresse`, `gps`, `notes` |
| `step_people` / `step_vehicles` / `step_materials` | Relations N-N | clés étrangères |

### Conventions

- **Clés primaires `text`** : les identifiants existants des JSON sont préservés
  (migration sans perte).
- **Heures en `text` ISO** (`start_at`, `end_at`, `heure_debut`, `heure_fin`) :
  horodatages « wall-clock » du tournage conservés exactement, sans conversion
  de fuseau. Le tri lexicographique reste correct (format fixe).
- **`updated_at`** maintenu par trigger sur toutes les tables.
- **Statuts d'étape** : `A venir`, `En cours`, `Terminé`, `Retard`, `Annulé`.

## API REST (PostgREST, auto-générée)

Base : `https://<projet>.supabase.co/rest/v1`. En-têtes : `apikey` + `Authorization: Bearer <jwt>`.

Exemples :

```bash
# Lire les étapes d'une journée
GET /rest/v1/steps?day_id=eq.fri-setup&select=*

# Mettre à jour l'heure d'une étape (18h00 → 18h30)
PATCH /rest/v1/steps?id=eq.fri-setup
{ "start_at": "2026-06-26T18:30:00" }

# Cocher un item de checklist
PATCH /rest/v1/checklist_items?id=eq.cl-camera-0
{ "checked": true }

# Pagination (offset/limit via Range)
GET /rest/v1/materials?select=*&order=ordre
Range: 0-49
```

## Couche d'accès typée (`src/api`)

Le frontend ne tape pas l'API brute : il passe par une couche typée qui ajoute
**validation, gestion d'erreurs, logs et pagination**.

### `roadmap.api.ts`

| Fonction | Rôle |
| -------- | ---- |
| `fetchRoadmap(projectId)` | Assemble l'objet `Roadmap` complet |
| `updateProjectRow` / `updateStepRow` / `bulkSetStepShift` | Mutations étapes/projet |
| `insertComment` | Ajout de commentaire |
| `insertPerson` / `updatePersonRow` / `deletePerson` | CRUD personnes |
| `insertVehicle` / `updateVehicleRow` / `deleteVehicle` | CRUD véhicules |
| `setChecklistItemChecked` / `insertChecklistItem` / `deleteChecklistItem` / `insertChecklistCategory` | Checklists |
| `replaceRoadmap(projectId, roadmap)` | Import JSON / reset (remplacement complet) |

### `entities.api.ts` — CRUD générique

Pour **Matériel**, **Lieu**, **Sous-étape** : `list` (paginé), `getById`,
`create`, `update`, `remove`. Chaque entrée est validée par zod (`schemas.ts`).

```ts
import { materialsApi } from '@/api/entities.api'

const page = await materialsApi.list({ page: 1, pageSize: 50 })
//    page.items, page.total, page.totalPages, page.hasNext
await materialsApi.create({ name: 'DZO 50', categorie: 'Optique', quantite: 1 })
await materialsApi.update(id, { statut: 'Sorti' })
await materialsApi.remove(id)
```

### Validation (`schemas.ts`)

Schémas zod par entité (`stepInputSchema`, `personInputSchema`,
`materialInputSchema`, …). Toute création/mise à jour est parsée avant écriture ;
en cas d'invalidité, une erreur explicite est levée.

### Gestion d'erreurs (`errors.ts`)

`ApiError` normalise toutes les erreurs. `unwrap()` lève une `ApiError`
lisible (FR) à partir des codes PostgREST (`23505` doublon, `23503` référence
invalide, `42501` droits, …).

### Logs (`logger.ts`)

Logger structuré `createLogger(scope)` : `debug/info/warn/error`. En production,
seuls `warn`/`error` sont émis.

### Pagination (`pagination.ts`)

Pagination par offset : `normalizePage({ page, pageSize })` (max 200) →
`buildPage(items, total, page, pageSize)` renvoyant
`{ items, page, pageSize, total, totalPages, hasNext }`.

## Temps réel (`realtime.ts`)

`subscribeToRoadmap(onChange)` abonne le client aux changements
(`INSERT/UPDATE/DELETE`) de toutes les tables et déclenche `onChange` (débauncé).
Retourne une fonction de désabonnement.
