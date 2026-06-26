import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  MapPin,
  Users,
  Camera,
  Clapperboard,
  Check,
  ArrowRight,
  CheckCircle2,
  RotateCcw,
  MessageSquare,
  Clock3,
} from 'lucide-react'
import type { EffectiveStep } from '@/features/roadmap/roadmap.utils'
import { useRoadmapStore } from '@/features/roadmap/store'
import { useShotListStore } from '@/features/shotlist/store'
import { resolveShot } from '@/features/shotlist/shotList.utils'
import { STATUS_CONFIG, StatusBadge } from '@/features/roadmap/status'
import { Button } from '@/components/ui/button'
import { CommentsPanel } from '@/features/comments/CommentsPanel'
import { cn } from '@/lib/utils'
import { formatRange, formatHmsCountdown } from '@/lib/time'

interface CurrentStepCardProps {
  current?: EffectiveStep
  next?: EffectiveStep
  now: Date
  /** Hero layout (single card). When false, compact layout for a grid of parallel cards. */
  emphasis?: boolean
}

function TagRow({
  icon: Icon,
  items,
  tone,
}: {
  icon: typeof Users
  items: string[]
  tone: 'people' | 'gear'
}) {
  if (!items.length) return null
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-1 size-4 shrink-0 text-muted-foreground" />
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className={cn(
              'rounded-lg px-2.5 py-1 text-sm font-semibold',
              tone === 'people'
                ? 'bg-primary/15 text-primary'
                : 'bg-accent text-accent-foreground',
            )}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

function ShotsRow({ shots }: { shots: string[] }) {
  const checked = useShotListStore((s) => s.checked)
  if (!shots.length) return null
  return (
    <div className="flex items-start gap-2.5">
      <Clapperboard className="mt-1 size-4 shrink-0 text-muted-foreground" />
      <div className="flex flex-wrap gap-1.5">
        {shots.map((planId) => {
          const resolved = resolveShot(planId)
          const isChecked = Boolean(checked[planId])
          const label = resolved ? `${resolved.visuel.name} · ${resolved.plan.label}` : planId
          return (
            <span
              key={planId}
              className={cn(
                'inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-sm font-semibold',
                isChecked
                  ? 'bg-status-done/15 text-status-done line-through'
                  : 'bg-accent text-accent-foreground',
              )}
            >
              {isChecked && <Check className="size-3.5 shrink-0" strokeWidth={3} />}
              {label}
            </span>
          )
        })}
      </div>
    </div>
  )
}

export function CurrentStepCard({ current, next, now, emphasis = true }: CurrentStepCardProps) {
  const [showComments, setShowComments] = useState(false)
  const setOverride = useRoadmapStore((s) => s.setStepOverride)

  if (!current) {
    return (
      <div className="rounded-3xl border border-border bg-card p-10 text-center">
        <CheckCircle2 className="mx-auto mb-3 size-10 text-status-done" />
        <p className="text-lg font-bold">Tournage terminé 🎬</p>
        <p className="text-sm text-muted-foreground">Toutes les étapes sont bouclées. Bravo l'équipe !</p>
      </div>
    )
  }

  const cfg = STATUS_CONFIG[current.status]
  const isDone = current.status === 'done'

  // Countdown until this step ends (or starts if upcoming).
  const targetTs =
    current.status === 'upcoming'
      ? new Date(current.start).getTime()
      : new Date(current.end).getTime()
  const countdownLabel = current.status === 'upcoming' ? 'Commence dans' : 'Temps restant'
  const countdownMs = targetTs - now.getTime()

  return (
    <motion.section
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative flex h-full flex-col overflow-hidden rounded-3xl border-2 bg-card shadow-2xl',
        emphasis ? 'p-6 md:p-8' : 'p-5',
        cfg.border,
      )}
    >
      {/* glow */}
      <div
        className={cn('pointer-events-none absolute -right-24 -top-24 size-64 rounded-full opacity-20 blur-3xl', cfg.dot)}
      />

      <div
        className={cn(
          'relative flex flex-1 flex-col gap-6',
          emphasis && 'lg:flex-row lg:items-start lg:justify-between',
        )}
      >
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {emphasis ? 'Étape actuelle' : 'En cours'} · {current.dayLabel}
            </span>
            <StatusBadge status={current.status} />
            <span className="rounded-full border border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground">
              {current.step.phase}
            </span>
          </div>

          <h2
            className={cn(
              'text-balance font-black leading-tight tracking-tight',
              emphasis ? 'text-3xl md:text-5xl' : 'text-2xl md:text-3xl',
            )}
          >
            {current.step.title}
          </h2>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-base font-semibold md:text-lg">
            <span className="flex items-center gap-2 font-mono tabular">
              <Clock3 className="size-5 text-muted-foreground" />
              {formatRange(current.start, current.end)}
            </span>
            {current.step.location && (
              <span className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="size-5" />
                {current.step.location}
              </span>
            )}
          </div>

          <div className="mt-5 space-y-3">
            <TagRow icon={Users} items={current.step.participants} tone="people" />
            <TagRow icon={Camera} items={current.step.equipment} tone="gear" />
            <ShotsRow shots={current.step.shots} />
          </div>

          {current.step.details.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {current.step.details.map((d) => (
                <li key={d} className="before:mr-1.5 before:text-primary before:content-['▹']">
                  {d}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Countdown + actions */}
        <div className={cn('flex shrink-0 flex-col items-stretch gap-3', emphasis && 'lg:w-60')}>
          <div className={cn('rounded-2xl border p-4 text-center', cfg.border, cfg.surface)}>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {countdownLabel}
            </div>
            <div className={cn('font-mono text-3xl font-black tabular md:text-4xl', cfg.text)}>
              {formatHmsCountdown(countdownMs)}
            </div>
          </div>

          <div className="flex gap-2">
            {isDone ? (
              <Button variant="outline" className="flex-1" onClick={() => setOverride(current.step.id, 'auto')}>
                <RotateCcw /> Rouvrir
              </Button>
            ) : (
              <Button variant="success" className="flex-1" onClick={() => setOverride(current.step.id, 'done')}>
                <CheckCircle2 /> Terminer
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowComments((v) => !v)}
              aria-label="Commentaires"
              className="relative"
            >
              <MessageSquare />
              {current.step.comments.length > 0 && (
                <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {current.step.comments.length}
                </span>
              )}
            </Button>
          </div>

          {emphasis && next && (
            <div className="rounded-2xl border border-border bg-muted/30 p-3">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <ArrowRight className="size-3.5" /> Ensuite
              </div>
              <div className="truncate text-sm font-bold">{next.step.title}</div>
              <div className="font-mono text-xs text-muted-foreground tabular">
                {formatRange(next.start, next.end)}
              </div>
            </div>
          )}
        </div>
      </div>

      {showComments && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="relative mt-6 border-t border-border/60 pt-5"
        >
          <CommentsPanel stepId={current.step.id} comments={current.step.comments} />
        </motion.div>
      )}
    </motion.section>
  )
}
