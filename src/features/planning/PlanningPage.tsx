import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MapPin, Users, Camera, ChevronDown, CheckCircle2, RotateCcw } from 'lucide-react'
import { useRoadmapStore } from '@/features/roadmap/store'
import { useTracker } from '@/hooks/useTracker'
import type { EffectiveStep } from '@/features/roadmap/roadmap.utils'
import { STATUS_CONFIG, StatusBadge, StatusDot } from '@/features/roadmap/status'
import { CommentsPanel } from '@/features/comments/CommentsPanel'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatRange, formatLongDate } from '@/lib/time'

function PlanningRow({ s, isCurrent }: { s: EffectiveStep; isCurrent: boolean }) {
  const [open, setOpen] = useState(false)
  const setOverride = useRoadmapStore((st) => st.setStepOverride)
  const cfg = STATUS_CONFIG[s.status]
  const isDone = s.status === 'done'

  return (
    <div className={cn('rounded-xl border bg-card', isCurrent ? 'border-status-progress/60' : 'border-border/60')}>
      {/* Compact layout (mobile + tablet) */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full space-y-1.5 p-3.5 text-left active:bg-accent/30 lg:hidden"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className={cn('h-7 w-1 shrink-0 rounded-full', cfg.dot)} />
            <span className="font-mono text-sm font-semibold tabular">{formatRange(s.start, s.end)}</span>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <StatusBadge status={s.status} showIcon={false} />
            <ChevronDown className={cn('size-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold">{s.step.title}</span>
          {s.skipped && <Badge variant="muted">sauté</Badge>}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          <span>{s.step.phase}</span>
          {s.step.location && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3" /> {s.step.location}
            </span>
          )}
          {s.step.participants.length > 0 && (
            <span className="flex items-center gap-1">
              <Users className="size-3" /> {s.step.participants.join(', ')}
            </span>
          )}
        </div>
      </button>

      {/* Desktop columnar (Gantt) layout */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="hidden w-full grid-cols-[120px_1.6fr_1fr_1fr_1fr_120px_28px] items-center gap-2 p-3 text-left lg:grid"
      >
        <div className="flex items-center gap-2">
          <span className={cn('h-8 w-1 rounded-full', cfg.dot)} />
          <span className="font-mono text-sm font-semibold tabular">{formatRange(s.start, s.end)}</span>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate font-bold">{s.step.title}</span>
            {s.skipped && <Badge variant="muted">sauté</Badge>}
          </div>
          <span className="text-xs text-muted-foreground">{s.step.phase}</span>
        </div>
        <div className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
          {s.step.location && (
            <>
              <MapPin className="size-3.5 shrink-0" />
              <span className="truncate">{s.step.location}</span>
            </>
          )}
        </div>
        <div className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
          {s.step.participants.length > 0 && (
            <>
              <Users className="size-3.5 shrink-0" />
              <span className="truncate">{s.step.participants.join(', ')}</span>
            </>
          )}
        </div>
        <div className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
          {s.step.equipment.length > 0 && (
            <>
              <Camera className="size-3.5 shrink-0" />
              <span className="truncate">{s.step.equipment.join(', ')}</span>
            </>
          )}
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <StatusBadge status={s.status} showIcon={false} className="w-full justify-center" />
        </div>
        <ChevronDown
          className={cn('size-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border/60"
          >
            <div className="grid gap-4 p-4 lg:grid-cols-2">
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2 text-sm lg:hidden">
                  {s.step.location && (
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="size-3.5" /> {s.step.location}
                    </span>
                  )}
                </div>
                {s.step.participants.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {s.step.participants.map((p) => (
                      <span key={p} className="rounded-lg bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
                        {p}
                      </span>
                    ))}
                  </div>
                )}
                {s.step.equipment.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {s.step.equipment.map((e) => (
                      <span key={e} className="rounded-lg bg-accent px-2 py-0.5 text-xs font-semibold">
                        {e}
                      </span>
                    ))}
                  </div>
                )}
                {s.step.details.length > 0 && (
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {s.step.details.map((d) => (
                      <li key={d} className="before:mr-1.5 before:text-primary before:content-['▹']">
                        {d}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex gap-2">
                  {isDone ? (
                    <Button size="sm" variant="outline" onClick={() => setOverride(s.step.id, 'auto')}>
                      <RotateCcw /> Rouvrir
                    </Button>
                  ) : (
                    <Button size="sm" variant="success" onClick={() => setOverride(s.step.id, 'done')}>
                      <CheckCircle2 /> Marquer terminé
                    </Button>
                  )}
                </div>
              </div>
              <CommentsPanel stepId={s.step.id} comments={s.step.comments} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function PlanningPage() {
  const { steps, current } = useTracker()

  const byDay = useMemo(() => {
    const groups = new Map<string, { label: string; date: string; items: EffectiveStep[] }>()
    for (const s of steps) {
      const g = groups.get(s.dayId) ?? { label: s.dayLabel, date: s.start, items: [] }
      g.items.push(s)
      groups.set(s.dayId, g)
    }
    return [...groups.values()]
  }, [steps])

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <StatusDot status="done" /> Terminé
        <StatusDot status="in-progress" className="ml-3" /> En cours
        <StatusDot status="upcoming" className="ml-3" /> À venir
        <StatusDot status="late" className="ml-3" /> En retard
      </div>

      <div className="hidden grid-cols-[120px_1.6fr_1fr_1fr_1fr_120px_28px] gap-2 px-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground/70 lg:grid">
        <span>Heure</span>
        <span>Quoi</span>
        <span>Où</span>
        <span>Qui</span>
        <span>Matériel</span>
        <span>Statut</span>
        <span />
      </div>

      {byDay.map((g) => (
        <section key={g.label} className="space-y-2">
          <h2 className="sticky top-[92px] z-10 -mx-1 rounded-lg bg-background/80 px-3 py-2 text-sm font-extrabold uppercase tracking-wide backdrop-blur md:top-[68px]">
            {g.label} <span className="font-normal capitalize text-muted-foreground">· {formatLongDate(g.date)}</span>
          </h2>
          <div className="space-y-2">
            {g.items.map((s) => (
              <PlanningRow key={s.step.id} s={s} isCurrent={s.step.id === current?.step.id} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
