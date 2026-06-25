/**
 * Helpers de pagination par offset (range PostgREST).
 * Utilisés par les endpoints de liste pour borner les réponses.
 */

export interface PageParams {
  /** Page 1-indexée. */
  page?: number
  /** Taille de page (défaut 50, max 200). */
  pageSize?: number
}

export interface Page<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasNext: boolean
}

const DEFAULT_PAGE_SIZE = 50
const MAX_PAGE_SIZE = 200

export function normalizePage({ page = 1, pageSize = DEFAULT_PAGE_SIZE }: PageParams = {}): {
  page: number
  pageSize: number
  from: number
  to: number
} {
  const safeSize = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE)
  const safePage = Math.max(1, page)
  const from = (safePage - 1) * safeSize
  const to = from + safeSize - 1
  return { page: safePage, pageSize: safeSize, from, to }
}

export function buildPage<T>(items: T[], total: number, page: number, pageSize: number): Page<T> {
  const totalPages = pageSize > 0 ? Math.ceil(total / pageSize) : 0
  return {
    items,
    page,
    pageSize,
    total,
    totalPages,
    hasNext: page < totalPages,
  }
}
