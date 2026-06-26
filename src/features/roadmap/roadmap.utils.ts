import { addMinutes, minutesBetween } from '@/lib/time'
import type { Day, Roadmap, Step, StepStatus } from './types'

export interface EffectiveStep {
  step: Step
  dayId: Day['id']
  dayLabel: string
  /** start/end with the manual shift applied */
  start: string
  end: string
  status: StepStatus
  /** true when override marked it as skipped */
  skipped: boolean
}

export function effectiveStart(step: Step): string {
  return step.shiftMinutes ? addMinutes(step.start, step.shiftMinutes) : step.start
}

export function effectiveEnd(step: Step): string {
  return step.shiftMinutes ? addMinutes(step.end, step.shiftMinutes) : step.end
}

/**
 * Per-step status.
 *
 * Once a step has started, it stays on the dashboard (in-progress or late) until
 * it is manually marked done/skipped, or auto-closed via override "ignored".
 */
export function computeStatus(step: Step, now: Date): StepStatus {
  if (step.override === 'done' || step.override === 'skipped') return 'done'

  const start = new Date(effectiveStart(step)).getTime()
  const end = new Date(effectiveEnd(step)).getTime()
  const t = now.getTime()

  if (t < start) return 'upcoming'
  if (t < end) return 'in-progress'

  // Past scheduled end: remain visible until manually closed.
  if (step.override === 'ignored') return 'done'
  return 'late'
}

/** Flattened, chronologically-sorted list of every step across all days. */
export function flattenSteps(roadmap: Roadmap, now: Date): EffectiveStep[] {
  const raw = roadmap.days.flatMap((day) =>
    day.steps.map((step) => ({ step, day })),
  )

  const all: EffectiveStep[] = raw.map(({ step, day }) => ({
    step,
    dayId: day.id,
    dayLabel: day.label,
    start: effectiveStart(step),
    end: effectiveEnd(step),
    status: computeStatus(step, now),
    skipped: step.override === 'skipped',
  }))

  return all.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
}

/** Steps that should appear on the dashboard right now (started but not closed). */
export function getActiveSteps(steps: EffectiveStep[]): EffectiveStep[] {
  return steps.filter((s) => s.status === 'in-progress' || s.status === 'late')
}

/** The step that best represents "where we are now". */
export function getCurrentStep(steps: EffectiveStep[]): EffectiveStep | undefined {
  const inProgress = steps.find((s) => s.status === 'in-progress')
  if (inProgress) return inProgress
  const late = steps.find((s) => s.status === 'late')
  if (late) return late
  return steps.find((s) => s.status === 'upcoming')
}

export function getNextStep(steps: EffectiveStep[], current?: EffectiveStep): EffectiveStep | undefined {
  if (!current) return steps.find((s) => s.status === 'upcoming')
  const idx = steps.findIndex((s) => s.step.id === current.step.id)
  return steps.slice(idx + 1).find((s) => s.status === 'upcoming' || s.status === 'in-progress')
}

/** Minutes we are behind schedule for a late step (positive = late). */
export function delayMinutes(step: EffectiveStep, now: Date): number {
  if (step.status !== 'late') return 0
  return Math.max(0, minutesBetween(step.end, now))
}

export interface Progress {
  done: number
  total: number
  ratio: number
}

export function getProgress(steps: EffectiveStep[]): Progress {
  const total = steps.length
  const done = steps.filter((s) => s.status === 'done').length
  return { done, total, ratio: total ? done / total : 0 }
}

export function weekendBounds(roadmap: Roadmap): { start?: string; end?: string } {
  const starts = roadmap.days.flatMap((d) => d.steps.map((s) => effectiveStart(s)))
  const ends = roadmap.days.flatMap((d) => d.steps.map((s) => effectiveEnd(s)))
  if (!starts.length) return {}
  const start = starts.reduce((a, b) => (new Date(a) < new Date(b) ? a : b))
  const end = ends.reduce((a, b) => (new Date(a) > new Date(b) ? a : b))
  return { start, end }
}

export function checklistProgress(items: { checked: boolean }[]): Progress {
  const total = items.length
  const done = items.filter((i) => i.checked).length
  return { done, total, ratio: total ? done / total : 0 }
}
