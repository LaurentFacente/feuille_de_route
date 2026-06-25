import type { PostgrestError } from '@supabase/supabase-js'

/**
 * Erreur applicative normalisée, indépendante du transport (Supabase/PostgREST).
 * Permet à l'UI d'afficher un message clair et au logger de tracer la cause.
 */
export class ApiError extends Error {
  readonly code: string
  readonly status?: number
  readonly cause?: unknown

  constructor(message: string, options: { code?: string; status?: number; cause?: unknown } = {}) {
    super(message)
    this.name = 'ApiError'
    this.code = options.code ?? 'unknown'
    this.status = options.status
    this.cause = options.cause
  }
}

/** Traduit une erreur PostgREST en message utilisateur en français. */
function humanize(error: PostgrestError): string {
  switch (error.code) {
    case '23505':
      return 'Cet élément existe déjà (doublon).'
    case '23503':
      return 'Référence invalide : un élément lié est introuvable.'
    case '42501':
      return "Action non autorisée (droits insuffisants)."
    case 'PGRST301':
      return 'Session expirée, veuillez vous reconnecter.'
    default:
      return error.message || "Une erreur est survenue côté base de données."
  }
}

/**
 * Lève une `ApiError` si la réponse Supabase contient une erreur,
 * sinon renvoie la donnée garantie non-nulle.
 */
export function unwrap<T>(result: { data: T | null; error: PostgrestError | null }): T {
  if (result.error) {
    throw new ApiError(humanize(result.error), {
      code: result.error.code ?? 'postgrest_error',
      cause: result.error,
    })
  }
  if (result.data === null) {
    throw new ApiError('Ressource introuvable.', { code: 'not_found', status: 404 })
  }
  return result.data
}

/** Variante tolérant un résultat nul (ex. maybeSingle). */
export function unwrapNullable<T>(result: {
  data: T | null
  error: PostgrestError | null
}): T | null {
  if (result.error) {
    throw new ApiError(humanize(result.error), {
      code: result.error.code ?? 'postgrest_error',
      cause: result.error,
    })
  }
  return result.data
}
