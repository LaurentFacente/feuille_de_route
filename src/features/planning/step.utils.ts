import { addMinutes } from '@/lib/time'
import type { Day, Step } from '@/features/roadmap/types'

/** "2026-06-26T15:00:00" → valeur pour `<input type="datetime-local">`. */
export function toDatetimeLocal(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Valeur datetime-local → ISO naïf stocké en base. */
export function fromDatetimeLocal(value: string): string {
  if (!value) return ''
  return value.length === 16 ? `${value}:00` : value
}

function effectiveEndRaw(step: Step): string {
  return step.shiftMinutes ? addMinutes(step.end, step.shiftMinutes) : step.end
}

/** Valeurs par défaut pour une nouvelle étape (horaire après la dernière étape chronologique du jour). */
export function defaultNewStep(day: Day): Omit<Step, 'id' | 'comments'> {
  const last = [...day.steps].sort(
    (a, b) => new Date(effectiveEndRaw(b)).getTime() - new Date(effectiveEndRaw(a)).getTime(),
  )[0]
  const dateBase = day.date || '2026-01-01'
  const start = last ? effectiveEndRaw(last) : `${dateBase}T09:00:00`
  const end = addMinutes(start, 30)
  return {
    title: 'Nouvelle étape',
    phase: 'Tournage',
    start,
    end,
    participants: [],
    equipment: [],
    vehicles: [],
    shots: [],
    details: [],
    override: 'auto',
    shiftMinutes: 0,
  }
}

/** Brouillons en tête ; sinon tri chronologique par heure de début. */
export function sortPlanningDayItems<T extends { step: { id: string }; start: string }>(
  items: T[],
  pendingStepIds: string[],
): T[] {
  return [...items].sort((a, b) => {
    const aPending = pendingStepIds.includes(a.step.id)
    const bPending = pendingStepIds.includes(b.step.id)
    if (aPending !== bPending) return aPending ? -1 : 1
    if (aPending && bPending) {
      return pendingStepIds.indexOf(a.step.id) - pendingStepIds.indexOf(b.step.id)
    }
    return new Date(a.start).getTime() - new Date(b.start).getTime()
  })
}
