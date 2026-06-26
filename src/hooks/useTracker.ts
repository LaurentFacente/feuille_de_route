import { useMemo } from 'react'
import { useRoadmapStore } from '@/features/roadmap/store'
import {
  flattenSteps,
  getActiveSteps,
  getCurrentStep,
  getNextStep,
  getProgress,
  weekendBounds,
  type EffectiveStep,
} from '@/features/roadmap/roadmap.utils'
import { useNow } from './useNow'

export interface TrackerSnapshot {
  now: Date
  steps: EffectiveStep[]
  current?: EffectiveStep
  /** Every step happening right now (in-progress or overrunning), chronologically. */
  actives: EffectiveStep[]
  next?: EffectiveStep
  lateSteps: EffectiveStep[]
  progress: ReturnType<typeof getProgress>
  weekend: ReturnType<typeof weekendBounds>
}

/** Derived, memoized view of the whole roadmap relative to "now". */
export function useTracker(): TrackerSnapshot {
  const now = useNow()
  const roadmap = useRoadmapStore((s) => s.roadmap)

  // Recompute each second by keying on the rounded timestamp.
  const nowKey = Math.floor(now.getTime() / 1000)

  return useMemo(() => {
    const steps = flattenSteps(roadmap, now)
    const current = getCurrentStep(steps)
    const next = getNextStep(steps, current)
    const actives = getActiveSteps(steps)
    const lateSteps = steps.filter((s) => s.status === 'late')
    return {
      now,
      steps,
      current,
      actives,
      next,
      lateSteps,
      progress: getProgress(steps),
      weekend: weekendBounds(roadmap),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roadmap, nowKey])
}
