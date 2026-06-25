import { supabase } from '@/lib/supabase'
import { createLogger } from './logger'
import { REALTIME_TABLES } from './database.types'
import type { RealtimeChannel } from '@supabase/supabase-js'

const log = createLogger('realtime')

/**
 * S'abonne aux changements Postgres (INSERT/UPDATE/DELETE) de toutes les tables
 * du projet et notifie `onChange` (débordement débauncé). Pour 5-20 utilisateurs
 * et un volume de données faible, recharger la roadmap complète à chaque
 * changement est simple ET robuste : l'état converge toujours vers la base.
 */
export function subscribeToRoadmap(onChange: () => void): () => void {
  let debounce: ReturnType<typeof setTimeout> | null = null
  const schedule = () => {
    if (debounce) clearTimeout(debounce)
    debounce = setTimeout(onChange, 150)
  }

  const channel: RealtimeChannel = supabase.channel('roadmap-sync')

  for (const table of REALTIME_TABLES) {
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      (payload) => {
        log.debug('changement', { table, event: payload.eventType })
        schedule()
      },
    )
  }

  channel.subscribe((status) => {
    log.info('canal temps réel', { status })
  })

  return () => {
    if (debounce) clearTimeout(debounce)
    void supabase.removeChannel(channel)
  }
}
