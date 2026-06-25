/**
 * Conversions entre les lignes de la base (snake_case, table-centric) et le
 * modèle de domaine consommé par le frontend (camelCase, défini dans
 * features/roadmap/types.ts). Centralisé ici pour que l'UI reste inchangée.
 */
import type {
  Comment,
  ChecklistCategory,
  ChecklistItem,
  Day,
  Person,
  Step,
  StepStatusOverride,
  Vehicle,
} from '@/features/roadmap/types'
import type {
  ChecklistCategoryRow,
  ChecklistItemRow,
  CommentRow,
  DayRow,
  PersonRow,
  StepRow,
  VehicleRow,
} from './database.types'

const OVERRIDES: StepStatusOverride[] = ['auto', 'done', 'skipped', 'ignored']
function toOverride(value: string): StepStatusOverride {
  return (OVERRIDES as string[]).includes(value) ? (value as StepStatusOverride) : 'auto'
}

// --- Lecture : Row → domaine -------------------------------------------------

export function commentFromRow(row: CommentRow): Comment {
  return { id: row.id, author: row.author, text: row.text, createdAt: row.created_at }
}

export function stepFromRow(row: StepRow, comments: Comment[]): Step {
  return {
    id: row.id,
    title: row.title,
    phase: row.phase,
    start: row.start_at ?? '',
    end: row.end_at ?? '',
    location: row.location ?? undefined,
    participants: row.participants ?? [],
    equipment: row.equipment ?? [],
    details: row.details ?? [],
    override: toOverride(row.override),
    shiftMinutes: row.shift_minutes,
    comments,
  }
}

export function dayFromRow(row: DayRow, steps: Step[]): Day {
  return {
    id: row.id as Day['id'],
    label: row.label,
    date: row.date ?? '',
    subtitle: row.subtitle ?? undefined,
    steps,
  }
}

export function personFromRow(row: PersonRow): Person {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    phone: row.phone ?? undefined,
    availability: row.availability ?? undefined,
    vehicle: row.vehicle ?? undefined,
  }
}

export function vehicleFromRow(row: VehicleRow): Vehicle {
  return {
    id: row.id,
    name: row.name,
    driver: row.driver ?? undefined,
    passengers: row.passengers ?? [],
    cargo: row.cargo ?? [],
  }
}

export function checklistItemFromRow(row: ChecklistItemRow): ChecklistItem {
  return { id: row.id, label: row.label, checked: row.checked }
}

export function checklistCategoryFromRow(
  row: ChecklistCategoryRow,
  items: ChecklistItem[],
): ChecklistCategory {
  return { id: row.id, name: row.name, items }
}

// --- Écriture : patch domaine → colonnes (Update partiel) --------------------

export function stepPatchToRow(patch: Partial<Step>): Partial<StepRow> {
  const row: Partial<StepRow> = {}
  if (patch.title !== undefined) row.title = patch.title
  if (patch.phase !== undefined) row.phase = patch.phase
  if (patch.start !== undefined) row.start_at = patch.start
  if (patch.end !== undefined) row.end_at = patch.end
  if (patch.location !== undefined) row.location = patch.location ?? null
  if (patch.participants !== undefined) row.participants = patch.participants
  if (patch.equipment !== undefined) row.equipment = patch.equipment
  if (patch.details !== undefined) row.details = patch.details
  if (patch.override !== undefined) row.override = patch.override
  if (patch.shiftMinutes !== undefined) row.shift_minutes = patch.shiftMinutes
  return row
}

export function personPatchToRow(patch: Partial<Person>): Partial<PersonRow> {
  const row: Partial<PersonRow> = {}
  if (patch.name !== undefined) row.name = patch.name
  if (patch.role !== undefined) row.role = patch.role
  if (patch.phone !== undefined) row.phone = patch.phone ?? null
  if (patch.availability !== undefined) row.availability = patch.availability ?? null
  if (patch.vehicle !== undefined) row.vehicle = patch.vehicle ?? null
  return row
}

export function vehiclePatchToRow(patch: Partial<Vehicle>): Partial<VehicleRow> {
  const row: Partial<VehicleRow> = {}
  if (patch.name !== undefined) row.name = patch.name
  if (patch.driver !== undefined) row.driver = patch.driver ?? null
  if (patch.passengers !== undefined) row.passengers = patch.passengers
  if (patch.cargo !== undefined) row.cargo = patch.cargo
  return row
}
