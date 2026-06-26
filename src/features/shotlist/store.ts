import { create } from 'zustand'
import { env } from '@/lib/env'
import { createLogger } from '@/api/logger'
import {
  fetchShotChecks,
  setShotCheck,
  subscribeToShotChecks,
  type ShotCheckedMap,
} from './shotChecks.api'

const log = createLogger('shotlist-store')
const PROJECT_ID = env.projectId

interface ShotListState {
  /** planId → coché. État PARTAGÉ par toute l'équipe (Supabase + temps réel). */
  checked: ShotCheckedMap
  load: () => Promise<void>
  toggle: (planId: string) => void
  setChecked: (planId: string, value: boolean) => void
}

/**
 * État coché de la Shot List, partagé par toute l'équipe : un plan tourné est
 * tourné pour tout le monde. Le catalogue lui-même est statique (shotList.data.ts).
 */
export const useShotListStore = create<ShotListState>((set, get) => {
  const persist = (planId: string, value: boolean) => {
    void setShotCheck(PROJECT_ID, planId, value).catch((e) => {
      log.error('échec mise à jour shot check', e)
      void get().load()
    })
  }

  return {
    checked: {},

    load: async () => {
      try {
        const checked = await fetchShotChecks(PROJECT_ID)
        set({ checked })
      } catch (e) {
        log.error('chargement shot checks échoué', e)
      }
    },

    toggle: (planId) => {
      const value = !get().checked[planId]
      set((s) => ({ checked: { ...s.checked, [planId]: value } }))
      persist(planId, value)
    },

    setChecked: (planId, value) => {
      set((s) => ({ checked: { ...s.checked, [planId]: value } }))
      persist(planId, value)
    },
  }
})

/**
 * Démarre le chargement initial + l'abonnement temps réel des coches partagées.
 * Renvoie une fonction de désabonnement.
 */
export function initShotListSync(): () => void {
  void useShotListStore.getState().load()
  return subscribeToShotChecks(() => {
    void useShotListStore.getState().load()
  })
}
