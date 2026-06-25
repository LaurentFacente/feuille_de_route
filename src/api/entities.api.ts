/**
 * CRUD générique typé pour les entités complémentaires (Matériel, Lieu,
 * Sous-étape). Fournit Create / Read (liste paginée + par id) / Update / Delete,
 * avec validation zod et journalisation. Le frontend actuel n'expose pas encore
 * ces écrans, mais l'API est complète et documentée (voir docs/API.md).
 */
import { supabase } from '@/lib/supabase'
import { unwrap, unwrapNullable, ApiError } from './errors'
import { createLogger } from './logger'
import { buildPage, normalizePage, type Page, type PageParams } from './pagination'
import { env } from '@/lib/env'
import { uid } from '@/lib/utils'
import { locationInputSchema, materialInputSchema, subStepInputSchema } from './schemas'
import type { z } from 'zod'
import type { LocationRow, MaterialRow, SubStepRow } from './database.types'

type TableName = 'materials' | 'locations' | 'sub_steps'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyZodObject = z.ZodObject<any>

function makeCrud<TInput extends Record<string, unknown>, TRow extends { id: string }>(
  table: TableName,
  schema: AnyZodObject,
  idPrefix: string,
  scope: { column: 'project_id' | 'step_id'; valueFor: (input: TInput) => string },
) {
  const log = createLogger(`api.${table}`)
  // Le nom de table est dynamique : on relâche le typage du builder à ce seul
  // endroit. La sécurité est assurée en amont par zod et en aval par TRow.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tbl = () => supabase.from(table) as any

  return {
    async list(params: PageParams & { scopeId?: string } = {}): Promise<Page<TRow>> {
      const { page, pageSize, from, to } = normalizePage(params)
      let query = tbl().select('*', { count: 'exact' })
      if (params.scopeId) query = query.eq(scope.column, params.scopeId)
      const { data, error, count } = await query.order('ordre').range(from, to)
      if (error) throw new ApiError(error.message, { code: error.code ?? 'list_failed', cause: error })
      return buildPage((data ?? []) as TRow[], count ?? 0, page, pageSize)
    },

    async getById(id: string): Promise<TRow | null> {
      return unwrapNullable(await tbl().select('*').eq('id', id).maybeSingle()) as TRow | null
    },

    async create(input: TInput): Promise<TRow> {
      const parsed = schema.parse(input) as TInput
      const row = { id: uid(idPrefix), [scope.column]: scope.valueFor(parsed), ...parsed }
      const created = unwrap(await tbl().insert(row).select().single())
      log.info('created', { id: row.id })
      return created as TRow
    },

    async update(id: string, patch: Partial<TInput>): Promise<TRow> {
      const parsed = schema.partial().parse(patch)
      const updated = unwrap(await tbl().update(parsed).eq('id', id).select().single())
      log.info('updated', { id })
      return updated as TRow
    },

    async remove(id: string): Promise<void> {
      unwrap(await tbl().delete().eq('id', id).select().single())
      log.info('deleted', { id })
    },
  }
}

export const materialsApi = makeCrud<z.infer<typeof materialInputSchema>, MaterialRow>(
  'materials',
  materialInputSchema,
  'mat',
  { column: 'project_id', valueFor: () => env.projectId },
)

export const locationsApi = makeCrud<z.infer<typeof locationInputSchema>, LocationRow>(
  'locations',
  locationInputSchema,
  'loc',
  { column: 'project_id', valueFor: () => env.projectId },
)

export const subStepsApi = makeCrud<z.infer<typeof subStepInputSchema>, SubStepRow>(
  'sub_steps',
  subStepInputSchema,
  'sub',
  { column: 'step_id', valueFor: (input) => input.step_id },
)
