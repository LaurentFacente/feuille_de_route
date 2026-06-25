/**
 * Types de la base de données Supabase (schéma `public`).
 *
 * Maintenu à la main pour rester lisible et aligné avec les migrations SQL.
 * NB : on utilise `type` (et non `interface`) pour que les `Row` soient
 * assignables à `Record<string, unknown>`, contrainte du client typé Supabase.
 *
 * Régénérable au besoin via :
 *   npx supabase gen types typescript --linked > src/api/database.types.ts
 */

type Timestamp = string

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row
  Insert: Insert
  Update: Update
  Relationships: []
}

export type ProjectRow = {
  id: string
  name: string
  subtitle: string
  description: string | null
  date_debut: string | null
  date_fin: string | null
  statut: string
  version: number
  created_at: Timestamp
  updated_at: Timestamp
}

export type DayRow = {
  id: string
  project_id: string
  label: string
  date: string | null
  subtitle: string | null
  ordre: number
  created_at: Timestamp
  updated_at: Timestamp
}

export type StepRow = {
  id: string
  day_id: string
  title: string
  phase: string
  start_at: string | null
  end_at: string | null
  location: string | null
  participants: string[]
  equipment: string[]
  vehicles: string[]
  details: string[]
  override: string
  shift_minutes: number
  status: string
  couleur: string | null
  priorite: string | null
  ordre: number
  created_at: Timestamp
  updated_at: Timestamp
}

export type SubStepRow = {
  id: string
  step_id: string
  titre: string
  heure_debut: string | null
  heure_fin: string | null
  statut: string
  ordre: number
  created_at: Timestamp
  updated_at: Timestamp
}

export type PersonRow = {
  id: string
  project_id: string
  name: string
  role: string
  phone: string | null
  availability: string | null
  vehicle: string | null
  notes: string | null
  ordre: number
  created_at: Timestamp
  updated_at: Timestamp
}

export type VehicleRow = {
  id: string
  project_id: string
  name: string
  driver: string | null
  type: string | null
  passengers: string[]
  cargo: string[]
  notes: string | null
  ordre: number
  created_at: Timestamp
  updated_at: Timestamp
}

export type MaterialRow = {
  id: string
  project_id: string
  name: string
  categorie: string | null
  quantite: number
  statut: string
  notes: string | null
  ordre: number
  created_at: Timestamp
  updated_at: Timestamp
}

export type ChecklistCategoryRow = {
  id: string
  project_id: string
  name: string
  ordre: number
  created_at: Timestamp
  updated_at: Timestamp
}

export type ChecklistItemRow = {
  id: string
  category_id: string
  label: string
  checked: boolean
  ordre: number
  created_at: Timestamp
  updated_at: Timestamp
}

export type CommentRow = {
  id: string
  step_id: string | null
  author: string
  text: string
  entite_associee: string | null
  created_at: Timestamp
}

export type LocationRow = {
  id: string
  project_id: string
  name: string
  adresse: string | null
  gps: string | null
  notes: string | null
  ordre: number
  created_at: Timestamp
  updated_at: Timestamp
}

export type StepPersonRow = { step_id: string; person_id: string }
export type StepVehicleRow = { step_id: string; vehicle_id: string }
export type StepMaterialRow = { step_id: string; material_id: string }

export type Database = {
  public: {
    Tables: {
      projects: Table<ProjectRow>
      days: Table<DayRow>
      steps: Table<StepRow>
      sub_steps: Table<SubStepRow>
      people: Table<PersonRow>
      vehicles: Table<VehicleRow>
      materials: Table<MaterialRow>
      checklist_categories: Table<ChecklistCategoryRow>
      checklist_items: Table<ChecklistItemRow>
      comments: Table<CommentRow>
      locations: Table<LocationRow>
      step_people: Table<StepPersonRow>
      step_vehicles: Table<StepVehicleRow>
      step_materials: Table<StepMaterialRow>
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

/** Noms de tables temps réel surveillées. */
export const REALTIME_TABLES = [
  'projects',
  'days',
  'steps',
  'sub_steps',
  'people',
  'vehicles',
  'materials',
  'comments',
  'locations',
  'step_people',
  'step_vehicles',
  'step_materials',
] as const
