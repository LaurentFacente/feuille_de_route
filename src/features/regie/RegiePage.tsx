import { motion } from 'framer-motion'
import { MapPin, Radio, ArrowRight, CheckCircle2 } from 'lucide-react'
import { useTracker } from '@/hooks/useTracker'
import { useRoadmapStore } from '@/features/roadmap/store'
import { STATUS_CONFIG } from '@/features/roadmap/status'
import { Button } from '@/components/ui/button'
import { formatHmsCountdown, formatRange } from '@/lib/time'
import { cn } from '@/lib/utils'

export function RegiePage() {
  const { now, current, next } = useTracker()
  const setOverride = useRoadmapStore((s) => s.setStepOverride)

  // The action to prepare for: prefer the next upcoming step, else the current one.
  const action = next ?? current
  const target = action
    ? action.step.id === current?.step.id
      ? new Date(action.end).getTime()
      : new Date(action.start).getTime()
    : now.getTime()
  const countdownMs = target - now.getTime()

  if (!action) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
        <CheckCircle2 className="mb-4 size-16 text-status-done" />
        <p className="text-2xl font-black">Plus aucune action prévue</p>
        <p className="text-muted-foreground">Le tournage est terminé.</p>
      </div>
    )
  }

  const isPrep = action.step.id !== current?.step.id

  return (
    <div className="mx-auto flex min-h-[78vh] max-w-3xl flex-col items-center justify-center text-center">
      {current && (
        <div className="mb-6 flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm">
          <span className={cn('size-2.5 rounded-full', STATUS_CONFIG[current.status].dot, 'animate-pulse-ring')} />
          <span className="text-muted-foreground">En cours :</span>
          <span className="font-bold">{current.step.title}</span>
        </div>
      )}

      <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.3em] text-primary">
        <Radio className="size-4" />
        {isPrep ? 'Prochaine action dans' : 'Temps restant'}
      </div>

      <motion.div
        key={action.step.id}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="my-4 font-mono text-7xl font-black leading-none tabular sm:text-8xl md:text-9xl"
      >
        {formatHmsCountdown(countdownMs)}
      </motion.div>

      <div className="rounded-3xl border-2 border-primary/40 bg-card px-6 py-7 shadow-2xl">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {isPrep ? 'À préparer' : action.dayLabel} · {formatRange(action.start, action.end)}
        </div>
        <h1 className="mt-1 text-balance text-3xl font-black leading-tight sm:text-4xl">
          {action.step.title}
        </h1>

        {action.step.location && (
          <div className="mt-3 flex items-center justify-center gap-2 text-lg font-semibold text-muted-foreground">
            <MapPin className="size-5" />
            {action.step.location}
          </div>
        )}

        {action.step.participants.length > 0 && (
          <div className="mt-5">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Concernés
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {action.step.participants.map((p) => (
                <span
                  key={p}
                  className="rounded-xl bg-primary/15 px-4 py-2 text-lg font-bold text-primary"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {current && (
        <Button
          size="lg"
          variant="success"
          className="mt-6 w-full max-w-sm text-lg"
          onClick={() => setOverride(current.step.id, 'done')}
        >
          Terminer l'étape en cours <ArrowRight />
        </Button>
      )}
    </div>
  )
}
