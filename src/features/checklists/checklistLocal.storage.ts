import type { ChecklistCategory } from '@/features/roadmap/types'

const STORAGE_KEY = 'fdr-checklist-checked'

type CheckedMap = Record<string, boolean>

function readMap(): CheckedMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const data = JSON.parse(raw) as unknown
    return typeof data === 'object' && data !== null ? (data as CheckedMap) : {}
  } catch {
    return {}
  }
}

function writeMap(map: CheckedMap): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

/** Persiste l'état coché d'un item (progression personnelle, non partagée). */
export function setItemCheckedLocal(itemId: string, checked: boolean): void {
  const map = readMap()
  map[itemId] = checked
  writeMap(map)
}

/** Fusionne la progression locale sur la structure checklist chargée depuis la base. */
export function applyChecklistLocalState(checklists: ChecklistCategory[]): ChecklistCategory[] {
  const map = readMap()
  return checklists.map((category) => ({
    ...category,
    items: category.items.map((item) => ({
      ...item,
      checked: map[item.id] ?? item.checked,
    })),
  }))
}

export function clearChecklistLocalState(): void {
  localStorage.removeItem(STORAGE_KEY)
}
