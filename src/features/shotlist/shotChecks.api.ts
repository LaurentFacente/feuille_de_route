import { supabase } from '@/lib/supabase'
import { createLogger } from '@/api/logger'
import type { RealtimeChannel } from '@supabase/supabase-js'

const log = createLogger('shot-checks')

export type ShotCheckedMap = Record<string, boolean>

/** Charge l'état coché partagé de la Shot List pour un projet. */
export async function fetchShotChecks(projectId: string): Promise<ShotCheckedMap> {
  const { data, error } = await supabase
    .from('shot_checks')
    .select('plan_id, checked')
    .eq('project_id', projectId)

  if (error) throw error

  const map: ShotCheckedMap = {}
  for (const row of data ?? []) map[row.plan_id] = row.checked
  return map
}

/** Met à jour (upsert) la coche d'un plan, partagée avec toute l'équipe. */
export async function setShotCheck(
  projectId: string,
  planId: string,
  checked: boolean,
): Promise<void> {
  const { error } = await supabase
    .from('shot_checks')
    .upsert(
      { project_id: projectId, plan_id: planId, checked, updated_at: new Date().toISOString() },
      { onConflict: 'project_id,plan_id' },
    )
  if (error) throw error
  log.info('shot check mis à jour', { planId, checked })
}

/** S'abonne aux changements temps réel de la table shot_checks (reload débauncé). */
export function subscribeToShotChecks(onChange: () => void): () => void {
  let debounce: ReturnType<typeof setTimeout> | null = null
  const schedule = () => {
    if (debounce) clearTimeout(debounce)
    debounce = setTimeout(onChange, 150)
  }

  const channel: RealtimeChannel = supabase
    .channel('shot-checks-sync')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'shot_checks' }, () => schedule())
    .subscribe((status) => log.info('canal shot_checks', { status }))

  return () => {
    if (debounce) clearTimeout(debounce)
    void supabase.removeChannel(channel)
  }
}
