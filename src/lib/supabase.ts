import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/api/database.types'
import { env } from './env'

/**
 * Client Supabase unique partagé par toute l'application.
 * Typé avec `Database` pour des requêtes sûres de bout en bout.
 */
export const supabase = createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    // Aucune authentification : accès direct via la clé anon publique.
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  realtime: {
    params: { eventsPerSecond: 20 },
  },
})
