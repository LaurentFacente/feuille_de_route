import { SHOT_VISUELS } from './shotList.data'
import type { ShotPlan, ShotVisuel } from './shotList.types'

export interface ResolvedShot {
  plan: ShotPlan
  visuel: ShotVisuel
}

const PLAN_INDEX: Map<string, ResolvedShot> = new Map(
  SHOT_VISUELS.flatMap((visuel) => visuel.plans.map((plan) => [plan.id, { plan, visuel }] as const)),
)

/** Retrouve un plan (et son visuel) à partir de son id. */
export function resolveShot(planId: string): ResolvedShot | undefined {
  return PLAN_INDEX.get(planId)
}

/** Libellé complet, ex. "SOUS DROP VISUEL 1 · PLAN 4b". */
export function shotFullLabel(planId: string): string {
  const resolved = PLAN_INDEX.get(planId)
  if (!resolved) return planId
  return `${resolved.visuel.name} · ${resolved.plan.label}`
}
