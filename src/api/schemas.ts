import { z } from 'zod'

/**
 * Schémas de validation des entrées d'API. Toute écriture passe par ces schémas
 * pour garantir l'intégrité avant d'atteindre la base.
 */

const STEP_STATUS = ['A venir', 'En cours', 'Terminé', 'Retard', 'Annulé'] as const
const OVERRIDE = ['auto', 'done', 'skipped', 'ignored'] as const

export const projectPatchSchema = z.object({
  name: z.string().min(1).optional(),
  subtitle: z.string().optional(),
  description: z.string().nullable().optional(),
  date_debut: z.string().nullable().optional(),
  date_fin: z.string().nullable().optional(),
  statut: z.string().optional(),
})

export const stepInputSchema = z.object({
  day_id: z.string().min(1),
  title: z.string().min(1, 'Le titre est requis.'),
  phase: z.string().default(''),
  start_at: z.string().nullable().optional(),
  end_at: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  participants: z.array(z.string()).default([]),
  equipment: z.array(z.string()).default([]),
  details: z.array(z.string()).default([]),
  override: z.enum(OVERRIDE).default('auto'),
  shift_minutes: z.number().int().default(0),
  status: z.enum(STEP_STATUS).default('A venir'),
  couleur: z.string().nullable().optional(),
  priorite: z.string().nullable().optional(),
})

export const commentInputSchema = z.object({
  step_id: z.string().nullable().optional(),
  author: z.string().min(1).default('Anonyme'),
  text: z.string().min(1, 'Le commentaire ne peut pas être vide.'),
  entite_associee: z.string().nullable().optional(),
})

export const personInputSchema = z.object({
  name: z.string().min(1, 'Le nom est requis.'),
  role: z.string().default(''),
  phone: z.string().nullable().optional(),
  availability: z.string().nullable().optional(),
  vehicle: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

export const vehicleInputSchema = z.object({
  name: z.string().min(1, 'Le nom est requis.'),
  driver: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  passengers: z.array(z.string()).default([]),
  cargo: z.array(z.string()).default([]),
  notes: z.string().nullable().optional(),
})

export const materialInputSchema = z.object({
  name: z.string().min(1, 'Le nom est requis.'),
  categorie: z.string().nullable().optional(),
  quantite: z.number().int().min(0).default(1),
  statut: z.string().default('Disponible'),
  notes: z.string().nullable().optional(),
})

export const locationInputSchema = z.object({
  name: z.string().min(1, 'Le nom est requis.'),
  adresse: z.string().nullable().optional(),
  gps: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

export const subStepInputSchema = z.object({
  step_id: z.string().min(1),
  titre: z.string().min(1, 'Le titre est requis.'),
  heure_debut: z.string().nullable().optional(),
  heure_fin: z.string().nullable().optional(),
  statut: z.enum(STEP_STATUS).default('A venir'),
})

export const checklistItemInputSchema = z.object({
  category_id: z.string().min(1),
  label: z.string().min(1, "L'intitulé est requis."),
  checked: z.boolean().default(false),
})

export type StepInput = z.infer<typeof stepInputSchema>
export type CommentInput = z.infer<typeof commentInputSchema>
export type PersonInput = z.infer<typeof personInputSchema>
export type VehicleInput = z.infer<typeof vehicleInputSchema>
export type MaterialInput = z.infer<typeof materialInputSchema>
export type LocationInput = z.infer<typeof locationInputSchema>
export type SubStepInput = z.infer<typeof subStepInputSchema>
export type ChecklistItemInput = z.infer<typeof checklistItemInputSchema>
