/**
 * Couche d'accès aux données de la feuille de route.
 *
 * - `fetchRoadmap` assemble l'objet `Roadmap` consommé par le frontend à partir
 *   des tables normalisées.
 * - Les fonctions d'écriture persistent les mutations. Les identifiants sont
 *   fournis par l'appelant (le store), ce qui permet des mises à jour
 *   optimistes cohérentes entre l'état local et la base.
 */
import { supabase } from '@/lib/supabase'
import { ApiError, unwrap } from './errors'
import { createLogger } from './logger'
import {
  checklistCategoryFromRow,
  checklistItemFromRow,
  commentFromRow,
  dayFromRow,
  personFromRow,
  stepFromRow,
  vehicleFromRow,
} from './mappers'
import type { Comment, Roadmap, Step } from '@/features/roadmap/types'
import type { StepRow } from './database.types'

const log = createLogger('roadmap.api')

// =============================================================================
// LECTURE
// =============================================================================

export async function fetchRoadmap(projectId: string): Promise<Roadmap> {
  const [project, days, steps, comments, people, vehicles, categories, items] = await Promise.all([
    supabase.from('projects').select('*').eq('id', projectId).single(),
    supabase.from('days').select('*').eq('project_id', projectId).order('ordre'),
    supabase.from('steps').select('*, day:days!inner(project_id)').order('ordre'),
    supabase.from('comments').select('*').order('created_at'),
    supabase.from('people').select('*').eq('project_id', projectId).order('ordre'),
    supabase.from('vehicles').select('*').eq('project_id', projectId).order('ordre'),
    supabase.from('checklist_categories').select('*').eq('project_id', projectId).order('ordre'),
    supabase.from('checklist_items').select('*').order('ordre'),
  ])

  const projectRow = unwrap(project)
  const dayRows = unwrap(days)
  const stepRows = unwrap(steps) as (StepRow & { day: { project_id: string } })[]
  const commentRows = unwrap(comments)
  const peopleRows = unwrap(people)
  const vehicleRows = unwrap(vehicles)
  const categoryRows = unwrap(categories)
  const itemRows = unwrap(items)

  const dayIds = new Set(dayRows.map((d) => d.id))
  const commentsByStep = new Map<string, Comment[]>()
  for (const c of commentRows) {
    if (!c.step_id) continue
    const list = commentsByStep.get(c.step_id) ?? []
    list.push(commentFromRow(c))
    commentsByStep.set(c.step_id, list)
  }

  const stepsByDay = new Map<string, Step[]>()
  for (const row of stepRows) {
    if (!dayIds.has(row.day_id)) continue // étape d'un autre projet
    const list = stepsByDay.get(row.day_id) ?? []
    list.push(stepFromRow(row, commentsByStep.get(row.id) ?? []))
    stepsByDay.set(row.day_id, list)
  }

  const itemsByCategory = new Map<string, ReturnType<typeof checklistItemFromRow>[]>()
  for (const it of itemRows) {
    const list = itemsByCategory.get(it.category_id) ?? []
    list.push(checklistItemFromRow(it))
    itemsByCategory.set(it.category_id, list)
  }

  return {
    projectName: projectRow.name,
    subtitle: projectRow.subtitle,
    version: projectRow.version,
    days: dayRows.map((d) => dayFromRow(d, stepsByDay.get(d.id) ?? [])),
    team: peopleRows.map(personFromRow),
    vehicles: vehicleRows.map(vehicleFromRow),
    checklists: categoryRows.map((c) =>
      checklistCategoryFromRow(c, itemsByCategory.get(c.id) ?? []),
    ),
  }
}

// =============================================================================
// ÉCRITURE (mutations granulaires)
// =============================================================================

export async function updateProjectRow(
  id: string,
  patch: { name?: string; subtitle?: string },
): Promise<void> {
  unwrap(await supabase.from('projects').update(patch).eq('id', id).select().single())
  log.info('project updated', { id, patch })
}

export async function updateStepRow(id: string, patch: Partial<StepRow>): Promise<void> {
  unwrap(await supabase.from('steps').update(patch).eq('id', id).select().single())
  log.info('step updated', { id })
}

export async function bulkSetStepShift(entries: { id: string; shift_minutes: number }[]): Promise<void> {
  if (entries.length === 0) return
  await Promise.all(
    entries.map((e) =>
      supabase.from('steps').update({ shift_minutes: e.shift_minutes }).eq('id', e.id),
    ),
  )
  log.info('steps shifted', { count: entries.length })
}

export async function insertComment(input: {
  id: string
  step_id: string
  author: string
  text: string
}): Promise<void> {
  if (!input.text.trim()) throw new ApiError('Le commentaire est vide.', { code: 'validation' })
  unwrap(
    await supabase
      .from('comments')
      .insert({ ...input, author: input.author.trim() || 'Anonyme' })
      .select()
      .single(),
  )
  log.info('comment added', { stepId: input.step_id })
}

// --- Personnes ---------------------------------------------------------------
export async function insertPerson(row: {
  id: string
  project_id: string
  name: string
  role: string
  phone?: string | null
  availability?: string | null
  vehicle?: string | null
  ordre?: number
}): Promise<void> {
  unwrap(await supabase.from('people').insert(row).select().single())
}
export async function updatePersonRow(
  id: string,
  patch: Partial<import('./database.types').PersonRow>,
): Promise<void> {
  unwrap(await supabase.from('people').update(patch).eq('id', id).select().single())
}
export async function deletePerson(id: string): Promise<void> {
  unwrap(await supabase.from('people').delete().eq('id', id).select().single())
}

// --- Véhicules ---------------------------------------------------------------
export async function insertVehicle(row: {
  id: string
  project_id: string
  name: string
  driver?: string | null
  passengers: string[]
  cargo: string[]
  ordre?: number
}): Promise<void> {
  unwrap(await supabase.from('vehicles').insert(row).select().single())
}
export async function updateVehicleRow(
  id: string,
  patch: Partial<import('./database.types').VehicleRow>,
): Promise<void> {
  unwrap(await supabase.from('vehicles').update(patch).eq('id', id).select().single())
}
export async function deleteVehicle(id: string): Promise<void> {
  unwrap(await supabase.from('vehicles').delete().eq('id', id).select().single())
}

// --- Checklists --------------------------------------------------------------
export async function setChecklistItemChecked(id: string, checked: boolean): Promise<void> {
  unwrap(await supabase.from('checklist_items').update({ checked }).eq('id', id).select().single())
}
export async function insertChecklistItem(row: {
  id: string
  category_id: string
  label: string
  checked: boolean
  ordre?: number
}): Promise<void> {
  unwrap(await supabase.from('checklist_items').insert(row).select().single())
}
export async function deleteChecklistItem(id: string): Promise<void> {
  unwrap(await supabase.from('checklist_items').delete().eq('id', id).select().single())
}
export async function insertChecklistCategory(row: {
  id: string
  project_id: string
  name: string
  ordre?: number
}): Promise<void> {
  unwrap(await supabase.from('checklist_categories').insert(row).select().single())
}

// =============================================================================
// REMPLACEMENT COMPLET (import JSON / reset)
// =============================================================================

/**
 * Remplace l'intégralité des données d'un projet par la roadmap fournie.
 * Utilisé par l'import JSON et le reset. Les suppressions en cascade nettoient
 * jours/étapes/commentaires liés.
 */
export async function replaceRoadmap(projectId: string, roadmap: Roadmap): Promise<void> {
  log.warn('replaceRoadmap: purge + réimport', { projectId })

  // Purge (cascade depuis project enfants gérée via delete ciblés).
  await supabase.from('days').delete().eq('project_id', projectId)
  await supabase.from('people').delete().eq('project_id', projectId)
  await supabase.from('vehicles').delete().eq('project_id', projectId)
  await supabase.from('checklist_categories').delete().eq('project_id', projectId)

  await supabase
    .from('projects')
    .upsert({
      id: projectId,
      name: roadmap.projectName,
      subtitle: roadmap.subtitle,
      version: roadmap.version,
    })

  // Jours + étapes + commentaires
  for (const [di, day] of roadmap.days.entries()) {
    unwrap(
      await supabase
        .from('days')
        .insert({
          id: day.id,
          project_id: projectId,
          label: day.label,
          date: day.date || null,
          subtitle: day.subtitle ?? null,
          ordre: di,
        })
        .select()
        .single(),
    )

    if (day.steps.length) {
      unwrap(
        await supabase
          .from('steps')
          .insert(
            day.steps.map((s, si) => ({
              id: s.id,
              day_id: day.id,
              title: s.title,
              phase: s.phase,
              start_at: s.start || null,
              end_at: s.end || null,
              location: s.location ?? null,
              participants: s.participants,
              equipment: s.equipment,
              details: s.details,
              override: s.override,
              shift_minutes: s.shiftMinutes,
              ordre: si,
            })),
          )
          .select(),
      )

      const comments = day.steps.flatMap((s) =>
        s.comments.map((c) => ({
          id: c.id,
          step_id: s.id,
          author: c.author,
          text: c.text,
          created_at: c.createdAt,
        })),
      )
      if (comments.length) unwrap(await supabase.from('comments').insert(comments).select())
    }
  }

  // Équipe
  if (roadmap.team.length) {
    unwrap(
      await supabase
        .from('people')
        .insert(
          roadmap.team.map((p, i) => ({
            id: p.id,
            project_id: projectId,
            name: p.name,
            role: p.role,
            phone: p.phone ?? null,
            availability: p.availability ?? null,
            vehicle: p.vehicle ?? null,
            ordre: i,
          })),
        )
        .select(),
    )
  }

  // Véhicules
  if (roadmap.vehicles.length) {
    unwrap(
      await supabase
        .from('vehicles')
        .insert(
          roadmap.vehicles.map((v, i) => ({
            id: v.id,
            project_id: projectId,
            name: v.name,
            driver: v.driver ?? null,
            passengers: v.passengers,
            cargo: v.cargo,
            ordre: i,
          })),
        )
        .select(),
    )
  }

  // Checklists
  for (const [ci, cat] of roadmap.checklists.entries()) {
    unwrap(
      await supabase
        .from('checklist_categories')
        .insert({ id: cat.id, project_id: projectId, name: cat.name, ordre: ci })
        .select()
        .single(),
    )
    if (cat.items.length) {
      unwrap(
        await supabase
          .from('checklist_items')
          .insert(
            cat.items.map((it, ii) => ({
              id: it.id,
              category_id: cat.id,
              label: it.label,
              checked: it.checked,
              ordre: ii,
            })),
          )
          .select(),
      )
    }
  }

  log.info('replaceRoadmap terminé', { projectId })
}
