export type DayId = 'vendredi' | 'samedi' | 'dimanche'

export type StepStatusOverride = 'auto' | 'done' | 'skipped' | 'ignored'

/** Effective, computed status used for display. */
export type StepStatus = 'done' | 'in-progress' | 'upcoming' | 'late'

export interface Comment {
  id: string
  author: string
  text: string
  /** ISO timestamp */
  createdAt: string
}

export interface Step {
  id: string
  /** Short, scannable title e.g. "SOUS DROP — VISUEL 1" */
  title: string
  /** Phase used by the timeline chips e.g. "Tournage", "Trajet" */
  phase: string
  /** ISO datetime */
  start: string
  /** ISO datetime */
  end: string
  location?: string
  /** Free-form participant names (kept flexible, matched to team by name) */
  participants: string[]
  equipment: string[]
  /** Vehicle names assigned to this step */
  vehicles: string[]
  /** Detail bullet points (plans, sub-steps, objectives) */
  details: string[]
  /** Manual control over the auto status (delay management) */
  override: StepStatusOverride
  /** Minutes the step has been shifted by (delay management) */
  shiftMinutes: number
  comments: Comment[]
}

export interface Day {
  id: DayId
  label: string
  /** ISO date (yyyy-mm-dd) */
  date: string
  subtitle?: string
  steps: Step[]
}

export interface Person {
  id: string
  name: string
  role: string
  phone?: string
  availability?: string
  vehicle?: string
}

export interface Vehicle {
  id: string
  name: string
  driver?: string
  passengers: string[]
  cargo: string[]
}

export interface ChecklistItem {
  id: string
  label: string
  checked: boolean
}

export interface ChecklistCategory {
  id: string
  name: string
  items: ChecklistItem[]
}

export interface Roadmap {
  projectName: string
  subtitle: string
  days: Day[]
  team: Person[]
  vehicles: Vehicle[]
  checklists: ChecklistCategory[]
  /** Schema version for import/export safety */
  version: number
}
