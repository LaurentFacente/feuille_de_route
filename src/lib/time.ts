/** Lightweight time helpers (no external date library, fr-FR locale). */

export function parseISO(iso: string): Date {
  return new Date(iso)
}

export function addMinutes(iso: string, minutes: number): string {
  const d = new Date(iso)
  d.setMinutes(d.getMinutes() + minutes)
  return d.toISOString()
}

/** "20h10" */
export function formatHm(input: string | Date): string {
  const d = typeof input === 'string' ? new Date(input) : input
  const hh = d.getHours().toString().padStart(2, '0')
  const mm = d.getMinutes().toString().padStart(2, '0')
  return `${hh}h${mm}`
}

/** "20:10:42" (24h clock) */
export function formatClock(input: string | Date, withSeconds = true): string {
  const d = typeof input === 'string' ? new Date(input) : input
  const hh = d.getHours().toString().padStart(2, '0')
  const mm = d.getMinutes().toString().padStart(2, '0')
  if (!withSeconds) return `${hh}:${mm}`
  const ss = d.getSeconds().toString().padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

export function formatRange(start: string, end: string): string {
  return `${formatHm(start)} → ${formatHm(end)}`
}

/** "Vendredi 26 juin" */
export function formatLongDate(input: string | Date): string {
  const d = typeof input === 'string' ? new Date(input) : input
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(d)
}

export function clampMs(ms: number): number {
  return ms < 0 ? 0 : ms
}

/** "00:14:32" */
export function formatHmsCountdown(ms: number): string {
  const total = Math.floor(clampMs(ms) / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return [h, m, s].map((n) => n.toString().padStart(2, '0')).join(':')
}

/** "2 j 4 h 12 min" — coarse human duration for the weekend countdown */
export function formatLongCountdown(ms: number): string {
  const total = Math.floor(clampMs(ms) / 1000)
  const d = Math.floor(total / 86400)
  const h = Math.floor((total % 86400) / 3600)
  const m = Math.floor((total % 3600) / 60)
  const parts: string[] = []
  if (d > 0) parts.push(`${d} j`)
  parts.push(`${h} h`)
  parts.push(`${m} min`)
  return parts.join(' ')
}

/** "+22 min" / "-5 min" signed minute delta. */
export function formatSignedMinutes(minutes: number): string {
  const sign = minutes >= 0 ? '+' : '−'
  return `${sign}${Math.abs(minutes)} min`
}

export function minutesBetween(a: string | Date, b: string | Date): number {
  const da = typeof a === 'string' ? new Date(a) : a
  const db = typeof b === 'string' ? new Date(b) : b
  return Math.round((db.getTime() - da.getTime()) / 60000)
}
