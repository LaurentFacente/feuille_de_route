import { create } from 'zustand'
import { uid } from '@/lib/utils'
import { env } from '@/lib/env'
import { createLogger } from '@/api/logger'
import {
  bulkSetStepShift,
  deletePerson,
  deleteVehicle,
  deleteChecklistItem,
  fetchRoadmap,
  insertChecklistCategory,
  insertChecklistItem,
  insertComment,
  insertPerson,
  insertVehicle,
  replaceRoadmap,
  setChecklistItemChecked,
  updatePersonRow,
  updateProjectRow,
  updateStepRow,
  updateVehicleRow,
} from '@/api/roadmap.api'
import { stepPatchToRow } from '@/api/mappers'
import { subscribeToRoadmap } from '@/api/realtime'
import { mockRoadmap, ROADMAP_VERSION } from './mockData'
import type {
  ChecklistCategory,
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

  // Chargement / synchro
  load: () => Promise<void>

  // Project meta
  updateProject: (patch: Partial<Pick<Roadmap, 'projectName' | 'subtitle'>>) => void

  // Steps
  updateStep: (stepId: string, patch: Partial<Step>) => void
  setStepOverride: (stepId: string, override: StepStatusOverride) => void
  shiftFromStep: (stepId: string, minutes: number) => void
  addComment: (stepId: string, author: string, text: string) => void

  // Team
  addPerson: (person?: Partial<Person>) => void
  updatePerson: (id: string, patch: Partial<Person>) => void
  removePerson: (id: string) => void

  // Vehicles
  addVehicle: (vehicle?: Partial<Vehicle>) => void
  updateVehicle: (id: string, patch: Partial<Vehicle>) => void
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

function mapSteps(roadmap: Roadmap, fn: (step: Step) => Step): Roadmap {
  return {
    ...roadmap,
    days: roadmap.days.map((day) => ({ ...day, steps: day.steps.map(fn) })),
  }
}

const PROJECT_ID = env.projectId

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

    load: async () => {
      set({ status: 'loading' })
      try {
        const roadmap = await fetchRoadmap(PROJECT_ID)
        set({ roadmap, status: 'ready', error: undefined })
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

    updateStep: (stepId, patch) => {
      set((s) => ({
        roadmap: mapSteps(s.roadmap, (step) =>
          step.id === stepId ? { ...step, ...patch } : step,
        ),
      }))
      persist(() => updateStepRow(stepId, stepPatchToRow(patch)))
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
      const ordre = get().roadmap.team.length
      set((s) => ({ roadmap: { ...s.roadmap, team: [...s.roadmap.team, newPerson] } }))
      persist(() =>
        insertPerson({
          id,
          project_id: PROJECT_ID,
          name: newPerson.name,
          role: newPerson.role,
          phone: newPerson.phone ?? null,
          availability: newPerson.availability ?? null,
          vehicle: newPerson.vehicle ?? null,
          ordre,
        }),
      )
    },

    updatePerson: (id, patch) => {
      set((s) => ({
        roadmap: {
          ...s.roadmap,
          team: s.roadmap.team.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        },
      }))
      persist(() =>
        updatePersonRow(id, {
          name: patch.name,
          role: patch.role,
          phone: patch.phone,
          availability: patch.availability,
          vehicle: patch.vehicle,
        }),
      )
    },

    removePerson: (id) => {
      set((s) => ({
        roadmap: { ...s.roadmap, team: s.roadmap.team.filter((p) => p.id !== id) },
      }))
      persist(() => deletePerson(id))
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
      const ordre = get().roadmap.vehicles.length
      set((s) => ({ roadmap: { ...s.roadmap, vehicles: [...s.roadmap.vehicles, newVehicle] } }))
      persist(() =>
        insertVehicle({
          id,
          project_id: PROJECT_ID,
          name: newVehicle.name,
          driver: newVehicle.driver ?? null,
          passengers: newVehicle.passengers,
          cargo: newVehicle.cargo,
          ordre,
        }),
      )
    },

    updateVehicle: (id, patch) => {
      set((s) => ({
        roadmap: {
          ...s.roadmap,
          vehicles: s.roadmap.vehicles.map((v) => (v.id === id ? { ...v, ...patch } : v)),
        },
      }))
      persist(() =>
        updateVehicleRow(id, {
          name: patch.name,
          driver: patch.driver,
          passengers: patch.passengers,
          cargo: patch.cargo,
        }),
      )
    },

    removeVehicle: (id) => {
      set((s) => ({
        roadmap: { ...s.roadmap, vehicles: s.roadmap.vehicles.filter((v) => v.id !== id) },
      }))
      persist(() => deleteVehicle(id))
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
      persist(() => setChecklistItemChecked(itemId, nextChecked))
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
