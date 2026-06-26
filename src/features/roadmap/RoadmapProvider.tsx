import { useEffect, type ReactNode } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { initShotListSync } from '@/features/shotlist/store'
import { initRoadmapSync, useRoadmapStore } from './store'

/**
 * Charge la roadmap depuis Supabase et maintient la synchro temps réel tant que
 * ce composant est monté (donc tant que l'utilisateur est authentifié).
 */
export function RoadmapProvider({ children }: { children: ReactNode }) {
  const status = useRoadmapStore((s) => s.status)
  const error = useRoadmapStore((s) => s.error)
  const load = useRoadmapStore((s) => s.load)

  useEffect(() => {
    const unsubscribeRoadmap = initRoadmapSync()
    const unsubscribeShots = initShotListSync()
    return () => {
      unsubscribeRoadmap()
      unsubscribeShots()
    }
  }, [])

  if (status === 'idle' || status === 'loading') {
    return (
      <div className="flex min-h-dvh items-center justify-center gap-2 bg-background text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        Chargement de la feuille de route…
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background p-6 text-center">
        <AlertTriangle className="size-8 text-destructive" />
        <div>
          <p className="font-semibold">Impossible de charger les données.</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
        <Button onClick={() => void load()}>Réessayer</Button>
      </div>
    )
  }

  return <>{children}</>
}
