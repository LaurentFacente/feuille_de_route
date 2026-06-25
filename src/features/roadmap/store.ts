import { create } from 'zustand'
import { uid } from '@/lib/utils'
import { env } from '@/lib/env'
import { createLogger } from '@/api/logger'
import {
  bulkSetStepShift,
  deletePerson,
  deleteStep,
  deleteVehicle,
  deleteChecklistItem,
  fetchRoadmap,
  insertChecklistCategory,
  insertChecklistItem,
  insertComment,
  insertPerson,
  insertStep,
  insertVehicle,
  replaceRoadmap,
  updatePersonRow,
  updateProjectRow,
  updateStepRow,
  updateVehicleRow,
} from '@/api/roadmap.api'
import { stepPatchToRow } from '@/api/mappers'
import { subscribeToRoadmap } from '@/api/realtime'
import { defaultNewStep } from '@/features/planning/step.utils'
import {
  applyChecklistLocalState,
  clearChecklistLocalState,
  setItemCheckedLocal,
} from '@/features/checklists/checklistLocal.storage'
import { mockRoadmap, ROADMAP_VERSION } from './mockData'
import type {
  ChecklistCategory,
  Day,
  Person,
  Roadmap,
  Step,
  StepStatusOverride,
  Vehicle,
} from './types'

const log = createLogger('store')

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error'

const EMPTY_ROADMAP: Roadmap = {
  projectName: '',
  subtitle: '',
  days: [],
  team: [],
  vehicles: [],
  checklists: [],
  version: ROADMAP_VERSION,
}

interface RoadmapState {
  roadmap: Roadmap
  status: LoadStatus
  error?: string
  /** Step ids created locally, not yet persisted to the database. */
  pendingStepIds: string[]
  pendingPersonIds: string[]
  pendingVehicleIds: string[]

  // Chargement / synchro
  load: () => Promise<void>

  // Project meta
  updateProject: (patch: Partial<Pick<Roadmap, 'projectName' | 'subtitle'>>) => void

  // Steps
  addStep: (dayId: Day['id'], step?: Partial<Step>) => string
  saveStep: (stepId: string, patch: Partial<Step>) => void
  cancelStep: (stepId: string) => void
  removeStep: (stepId: string) => void
  setStepOverride: (stepId: string, override: StepStatusOverride) => void
  shiftFromStep: (stepId: string, minutes: number) => void
  addComment: (stepId: string, author: string, text: string) => void

  // Team
  addPerson: (person?: Partial<Person>) => string
  savePerson: (id: string, patch: Partial<Person>) => void
  cancelPerson: (id: string) => void
  removePerson: (id: string) => void

  // Vehicles
  addVehicle: (vehicle?: Partial<Vehicle>) => string
  saveVehicle: (id: string, patch: Partial<Vehicle>) => void
  cancelVehicle: (id: string) => void
  removeVehicle: (id: string) => void

  // Checklists
  toggleChecklistItem: (categoryId: string, itemId: string) => void
  addChecklistItem: (categoryId: string, label: string) => void
  removeChecklistItem: (categoryId: string, itemId: string) => void
  addChecklistCategory: (name: string) => void

  // IO
  importRoadmap: (roadmap: Roadmap) => void
  resetRoadmap: () => void
}

function mapDays(roadmap: Roadmap, fn: (day: Roadmap['days'][number]) => Roadmap['days'][number]): Roadmap {
  return { ...roadmap, days: roadmap.days.map(fn) }
}

function mapSteps(roadmap: Roadmap, fn: (step: Step) => Step): Roadmap {
  return {
    ...roadmap,
    days: roadmap.days.map((day) => ({ ...day, steps: day.steps.map(fn) })),
  }
}

const PROJECT_ID = env.projectId

function findStep(roadmap: Roadmap, stepId: string): { day: Day; step: Step; index: number } | null {
  for (const day of roadmap.days) {
    const index = day.steps.findIndex((s) => s.id === stepId)
    if (index >= 0) return { day, step: day.steps[index]!, index }
  }
  return null
}

export const useRoadmapStore = create<RoadmapState>()((set, get) => {
  /**
   * Persiste une mutation côté serveur. En cas d'échec, recharge la roadmap
   * pour réconcilier l'état optimiste avec la base (rollback robuste).
   */
  const persist = (action: () => Promise<void>) => {
    action().catch((e) => {
      log.error('persistance échouée, réconciliation', e)
      void get().load()
    })
  }

  return {
    roadmap: EMPTY_ROADMAP,
    status: 'idle',
    pendingStepIds: [],
    pendingPersonIds: [],
    pendingVehicleIds: [],

    load: async () => {
      set({ status: 'loading' })
      try {
        const { pendingStepIds, pendingPersonIds, pendingVehicleIds, roadmap: prev } = get()
        const fetched = await fetchRoadmap(PROJECT_ID)

        let roadmap = fetched
        if (pendingStepIds.length > 0) {
          roadmap = {
            ...roadmap,
            days: roadmap.days.map((day) => {
              const prevDay = prev.days.find((d) => d.id === day.id)
              const localOnly = prevDay?.steps.filter((s) => pendingStepIds.includes(s.id)) ?? []
              return localOnly.length ? { ...day, steps: [...day.steps, ...localOnly] } : day
            }),
          }
        }
        if (pendingPersonIds.length > 0) {
          const localPeople = prev.team.filter((p) => pendingPersonIds.includes(p.id))
          roadmap = { ...roadmap, team: [...roadmap.team, ...localPeople] }
        }
        if (pendingVehicleIds.length > 0) {
          const localVehicles = prev.vehicles.filter((v) => pendingVehicleIds.includes(v.id))
          roadmap = { ...roadmap, vehicles: [...roadmap.vehicles, ...localVehicles] }
        }

        roadmap = { ...roadmap, checklists: applyChecklistLocalState(roadmap.checklists) }

        set({ roadmap, status: 'ready', error: undefined, pendingStepIds, pendingPersonIds, pendingVehicleIds })
      } catch (e) {
        log.error('chargement roadmap échoué', e)
        set({ status: 'error', error: e instanceof Error ? e.message : 'Erreur de chargement' })
      }
    },

    updateProject: (patch) => {
      set((s) => ({ roadmap: { ...s.roadmap, ...patch } }))
      persist(() =>
        updateProjectRow(PROJECT_ID, {
          name: patch.projectName,
          subtitle: patch.subtitle,
        }),
      )
    },

    addStep: (dayId, partial) => {
      const day = get().roadmap.days.find((d) => d.id === dayId)
      if (!day) return ''
      const id = uid('step')
      const base: Step = { id, comments: [], ...defaultNewStep(day), ...partial }
      set((s) => ({
        pendingStepIds: [...s.pendingStepIds, id],
        roadmap: mapDays(s.roadmap, (d) =>
          d.id === dayId ? { ...d, steps: [...d.steps, base] } : d,
        ),
      }))
      return id
    },

    saveStep: (stepId, patch) => {
      const located = findStep(get().roadmap, stepId)
      if (!located) return
      const merged: Step = { ...located.step, ...patch }
      const isPending = get().pendingStepIds.includes(stepId)

      set((s) => ({
        pendingStepIds: isPending
          ? s.pendingStepIds.filter((id) => id !== stepId)
          : s.pendingStepIds,
        roadmap: mapSteps(s.roadmap, (step) => (step.id === stepId ? merged : step)),
      }))

      if (isPending) {
        persist(() =>
          insertStep({
            id: stepId,
            day_id: located.day.id,
            title: merged.title,
            phase: merged.phase,
            start_at: merged.start || null,
            end_at: merged.end || null,
            location: merged.location ?? null,
            participants: merged.participants,
            equipment: merged.equipment,
            vehicles: merged.vehicles,
            details: merged.details,
            override: merged.override,
            shift_minutes: merged.shiftMinutes,
            ordre: located.index,
          }),
        )
      } else {
        persist(() => updateStepRow(stepId, stepPatchToRow(patch)))
      }
    },

    cancelStep: (stepId) => {
      if (get().pendingStepIds.includes(stepId)) {
        set((s) => ({
          pendingStepIds: s.pendingStepIds.filter((id) => id !== stepId),
          roadmap: mapDays(s.roadmap, (d) => ({
            ...d,
            steps: d.steps.filter((st) => st.id !== stepId),
          })),
        }))
      }
    },

    removeStep: (stepId) => {
      const isPending = get().pendingStepIds.includes(stepId)
      set((s) => ({
        pendingStepIds: s.pendingStepIds.filter((id) => id !== stepId),
        roadmap: mapDays(s.roadmap, (d) => ({
          ...d,
          steps: d.steps.filter((st) => st.id !== stepId),
        })),
      }))
      if (!isPending) persist(() => deleteStep(stepId))
    },

    setStepOverride: (stepId, override) => {
      set((s) => ({
        roadmap: mapSteps(s.roadmap, (step) =>
          step.id === stepId ? { ...step, override } : step,
        ),
      }))
      persist(() => updateStepRow(stepId, { override }))
    },

    shiftFromStep: (stepId, minutes) => {
      const target = get()
        .roadmap.days.flatMap((d) => d.steps)
        .find((st) => st.id === stepId)
      if (!target) return
      const threshold = new Date(target.start).getTime()

      const entries: { id: string; shift_minutes: number }[] = []
      set((s) => ({
        roadmap: mapSteps(s.roadmap, (step) => {
          if (new Date(step.start).getTime() >= threshold) {
            const shift_minutes = step.shiftMinutes + minutes
            entries.push({ id: step.id, shift_minutes })
            return { ...step, shiftMinutes: shift_minutes }
          }
          return step
        }),
      }))
      persist(() => bulkSetStepShift(entries))
    },

    addComment: (stepId, author, text) => {
      const id = uid('cmt')
      const safeAuthor = author.trim() || 'Anonyme'
      const safeText = text.trim()
      if (!safeText) return
      set((s) => ({
        roadmap: mapSteps(s.roadmap, (step) =>
          step.id === stepId
            ? {
                ...step,
                comments: [
                  ...step.comments,
                  { id, author: safeAuthor, text: safeText, createdAt: new Date().toISOString() },
                ],
              }
            : step,
        ),
      }))
      persist(() => insertComment({ id, step_id: stepId, author: safeAuthor, text: safeText }))
    },

    addPerson: (person) => {
      const id = uid('p')
      const newPerson: Person = {
        id,
        name: person?.name ?? 'Nouveau membre',
        role: person?.role ?? 'Rôle',
        phone: person?.phone,
        availability: person?.availability,
        vehicle: person?.vehicle,
      }
      set((s) => ({
        pendingPersonIds: [...s.pendingPersonIds, id],
        roadmap: { ...s.roadmap, team: [...s.roadmap.team, newPerson] },
      }))
      return id
    },

    savePerson: (id, patch) => {
      const index = get().roadmap.team.findIndex((p) => p.id === id)
      if (index < 0) return
      const merged: Person = { ...get().roadmap.team[index]!, ...patch }
      const isPending = get().pendingPersonIds.includes(id)

      set((s) => ({
        pendingPersonIds: isPending
          ? s.pendingPersonIds.filter((pid) => pid !== id)
          : s.pendingPersonIds,
        roadmap: {
          ...s.roadmap,
          team: s.roadmap.team.map((p) => (p.id === id ? merged : p)),
        },
      }))

      if (isPending) {
        persist(() =>
          insertPerson({
            id,
            project_id: PROJECT_ID,
            name: merged.name,
            role: merged.role,
            phone: merged.phone ?? null,
            availability: merged.availability ?? null,
            vehicle: merged.vehicle ?? null,
            ordre: index,
          }),
        )
      } else {
        persist(() =>
          updatePersonRow(id, {
            name: merged.name,
            role: merged.role,
            phone: merged.phone,
            availability: merged.availability,
            vehicle: merged.vehicle,
          }),
        )
      }
    },

    cancelPerson: (id) => {
      if (!get().pendingPersonIds.includes(id)) return
      set((s) => ({
        pendingPersonIds: s.pendingPersonIds.filter((pid) => pid !== id),
        roadmap: { ...s.roadmap, team: s.roadmap.team.filter((p) => p.id !== id) },
      }))
    },

    removePerson: (id) => {
      const isPending = get().pendingPersonIds.includes(id)
      set((s) => ({
        pendingPersonIds: s.pendingPersonIds.filter((pid) => pid !== id),
        roadmap: { ...s.roadmap, team: s.roadmap.team.filter((p) => p.id !== id) },
      }))
      if (!isPending) persist(() => deletePerson(id))
    },

    addVehicle: (vehicle) => {
      const id = uid('v')
      const newVehicle: Vehicle = {
        id,
        name: vehicle?.name ?? 'Nouveau véhicule',
        driver: vehicle?.driver,
        passengers: vehicle?.passengers ?? [],
        cargo: vehicle?.cargo ?? [],
      }
      set((s) => ({
        pendingVehicleIds: [...s.pendingVehicleIds, id],
        roadmap: { ...s.roadmap, vehicles: [...s.roadmap.vehicles, newVehicle] },
      }))
      return id
    },

    saveVehicle: (id, patch) => {
      const index = get().roadmap.vehicles.findIndex((v) => v.id === id)
      if (index < 0) return
      const merged: Vehicle = { ...get().roadmap.vehicles[index]!, ...patch }
      const isPending = get().pendingVehicleIds.includes(id)

      set((s) => ({
        pendingVehicleIds: isPending
          ? s.pendingVehicleIds.filter((vid) => vid !== id)
          : s.pendingVehicleIds,
        roadmap: {
          ...s.roadmap,
          vehicles: s.roadmap.vehicles.map((v) => (v.id === id ? merged : v)),
        },
      }))

      if (isPending) {
        persist(() =>
          insertVehicle({
            id,
            project_id: PROJECT_ID,
            name: merged.name,
            driver: merged.driver ?? null,
            passengers: merged.passengers,
            cargo: merged.cargo,
            ordre: index,
          }),
        )
      } else {
        persist(() =>
          updateVehicleRow(id, {
            name: merged.name,
            driver: merged.driver,
            passengers: merged.passengers,
            cargo: merged.cargo,
          }),
        )
      }
    },

    cancelVehicle: (id) => {
      if (!get().pendingVehicleIds.includes(id)) return
      set((s) => ({
        pendingVehicleIds: s.pendingVehicleIds.filter((vid) => vid !== id),
        roadmap: { ...s.roadmap, vehicles: s.roadmap.vehicles.filter((v) => v.id !== id) },
      }))
    },

    removeVehicle: (id) => {
      const isPending = get().pendingVehicleIds.includes(id)
      set((s) => ({
        pendingVehicleIds: s.pendingVehicleIds.filter((vid) => vid !== id),
        roadmap: { ...s.roadmap, vehicles: s.roadmap.vehicles.filter((v) => v.id !== id) },
      }))
      if (!isPending) persist(() => deleteVehicle(id))
    },

    toggleChecklistItem: (categoryId, itemId) => {
      let nextChecked = false
      set((s) => ({
        roadmap: {
          ...s.roadmap,
          checklists: s.roadmap.checklists.map((c) =>
            c.id === categoryId
              ? {
                  ...c,
                  items: c.items.map((it) => {
                    if (it.id !== itemId) return it
                    nextChecked = !it.checked
                    return { ...it, checked: nextChecked }
                  }),
                }
              : c,
          ),
        },
      }))
      setItemCheckedLocal(itemId, nextChecked)
    },

    addChecklistItem: (categoryId, label) => {
      const id = uid('ci')
      const category = get().roadmap.checklists.find((c) => c.id === categoryId)
      const ordre = category?.items.length ?? 0
      set((s) => ({
        roadmap: {
          ...s.roadmap,
          checklists: s.roadmap.checklists.map((c) =>
            c.id === categoryId
              ? { ...c, items: [...c.items, { id, label, checked: false }] }
              : c,
          ),
        },
      }))
      persist(() =>
        insertChecklistItem({ id, category_id: categoryId, label, checked: false, ordre }),
      )
    },

    removeChecklistItem: (categoryId, itemId) => {
      set((s) => ({
        roadmap: {
          ...s.roadmap,
          checklists: s.roadmap.checklists.map((c) =>
            c.id === categoryId
              ? { ...c, items: c.items.filter((it) => it.id !== itemId) }
              : c,
          ),
        },
      }))
      persist(() => deleteChecklistItem(itemId))
    },

    addChecklistCategory: (name) => {
      const id = uid('cl')
      const ordre = get().roadmap.checklists.length
      const category: ChecklistCategory = { id, name, items: [] }
      set((s) => ({
        roadmap: { ...s.roadmap, checklists: [...s.roadmap.checklists, category] },
      }))
      persist(() => insertChecklistCategory({ id, project_id: PROJECT_ID, name, ordre }))
    },

    importRoadmap: (roadmap) => {
      set({ roadmap })
      persist(async () => {
        await replaceRoadmap(PROJECT_ID, roadmap)
        await get().load()
      })
    },

    resetRoadmap: () => {
      clearChecklistLocalState()
      set({ roadmap: mockRoadmap })
      persist(async () => {
        await replaceRoadmap(PROJECT_ID, mockRoadmap)
        await get().load()
      })
    },
  }
})

/**
 * Démarre le chargement initial + l'abonnement temps réel. À appeler une fois
 * l'utilisateur authentifié. Renvoie une fonction de désabonnement.
 */
export function initRoadmapSync(): () => void {
  void useRoadmapStore.getState().load()
  return subscribeToRoadmap(() => {
    void useRoadmapStore.getState().load()
  })
}
