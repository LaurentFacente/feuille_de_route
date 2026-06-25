import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, CalendarClock, EyeOff } from 'lucide-react'
import { useRoadmapStore } from '@/features/roadmap/store'
import type { EffectiveStep } from '@/features/roadmap/roadmap.utils'
import { delayMinutes } from '@/features/roadmap/roadmap.utils'
import { Button } from '@/components/ui/button'

interface DelayManagerProps {
  step: EffectiveStep
  now: Date
}

export function DelayManager({ step, now }: DelayManagerProps) {
  const setOverride = useRoadmapStore((s) => s.setStepOverride)
  const shiftFrom = useRoadmapStore((s) => s.shiftFromStep)
  const delay = delayMinutes(step, now)

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="overflow-hidden rounded-2xl border border-status-late/40 bg-status-late/10"
    >
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-status-late/20 text-status-late">
            <AlertTriangle className="size-5" />
          </span>
          <div>
            <div className="text-sm font-extrabold uppercase tracking-wide text-status-late">
              ⚠️ Retard de {delay} minutes
            </div>
            <div className="text-xs text-muted-foreground">
              « {step.step.title} » a dépassé son horaire prévu.
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            className="border-status-upcoming/40 text-status-upcoming hover:bg-status-upcoming/10"
            onClick={() => shiftFrom(step.step.id, delay)}
          >
            <CalendarClock /> Décaler la suite (+{delay})
          </Button>
          <Button size="sm" variant="success" onClick={() => setOverride(step.step.id, 'done')}>
            <CheckCircle2 /> Terminé
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setOverride(step.step.id, 'ignored')}
          >
            <EyeOff /> Ignorer
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
