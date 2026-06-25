/**
 * Validation des variables d'environnement exposées au client.
 * Échoue tôt et explicitement si la configuration Supabase est absente.
 */

interface ClientEnv {
  supabaseUrl: string
  supabaseAnonKey: string
  projectId: string
}

function required(value: string | undefined, key: string): string {
  if (!value || value.trim() === '') {
    throw new Error(
      `Variable d'environnement manquante : ${key}. ` +
        'Copiez .env.example vers .env et renseignez vos clés Supabase.',
    )
  }
  return value
}

export const env: ClientEnv = {
  supabaseUrl: required(import.meta.env.VITE_SUPABASE_URL, 'VITE_SUPABASE_URL'),
  supabaseAnonKey: required(import.meta.env.VITE_SUPABASE_ANON_KEY, 'VITE_SUPABASE_ANON_KEY'),
  projectId: import.meta.env.VITE_PROJECT_ID?.trim() || 'tehazed',
}
