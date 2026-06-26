import { motion } from 'framer-motion'
import { Activity, CheckCircle2, ListTodo, Timer, Layers } from 'lucide-react'
import { useTracker } from '@/hooks/useTracker'
import { formatLongCountdown } from '@/lib/time'
import { delayMinutes } from '@/features/roadmap/roadmap.utils'
import { CurrentStepCard } from './CurrentStepCard'
import { Timeline } from './Timeline'
import { DelayManager } from '@/features/delay/DelayManager'
import { cn } from '@/lib/utils'

function StatCard({
  icon: Icon,
  label,
  value,
  tone = 'default',
}: {
  icon: typeof Activity
  label: string
  value: string
  tone?: 'default' | 'late' | 'done'
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
      <span
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-xl',
          tone === 'late' && 'bg-status-late/15 text-status-late',
          tone === 'done' && 'bg-status-done/15 text-status-done',
          tone === 'default' && 'bg-primary/15 text-primary',
        )}
      >
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        <div className="truncate text-lg font-bold tabular">{value}</div>
      </div>
    </div>
  )
}

export function DashboardPage() {
  const { now, steps, current, actives, next, lateSteps, progress, weekend } = useTracker()

  const endMs = weekend.end ? new Date(weekend.end).getTime() - now.getTime() : 0
  const totalLate = lateSteps.reduce((acc, s) => acc + delayMinutes(s, now), 0)
  const remaining = progress.total - progress.done

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        <StatCard
          icon={Timer}
          label="Fin du tournage dans"
          value={formatLongCountdown(endMs)}
        />
        <StatCard
          icon={CheckCircle2}
          label="Progression"
          value={`${progress.done}/${progress.total} (${Math.round(progress.ratio * 100)}%)`}
          tone="done"
        />
        <StatCard icon={ListTodo} label="Étapes restantes" value={`${remaining}`} />
        <StatCard
          icon={Activity}
          label="État planning"
          value={totalLate > 0 ? `Retard ${totalLate} min` : 'Dans les temps'}
          tone={totalLate > 0 ? 'late' : 'done'}
        />
      </motion.div>

      {lateSteps.length > 0 && <DelayManager step={lateSteps[0]} now={now} />}

      {actives.length > 0 ? (
        <div className="space-y-3">
          {actives.length > 1 && (
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
              <Layers className="size-4 text-primary" />
              {actives.length} étapes en parallèle
            </div>
          )}
          <div
            className={cn(
              'grid items-stretch gap-4',
              actives.length > 1 && 'xl:grid-cols-2',
            )}
          >
            {actives.map((s) => (
              <CurrentStepCard
                key={s.step.id}
                current={s}
                now={now}
                emphasis={actives.length === 1}
                next={actives.length === 1 ? next : undefined}
              />
            ))}
          </div>
        </div>
      ) : (
        <CurrentStepCard current={current} next={next} now={now} />
      )}

      <Timeline
        steps={steps}
        currentId={current?.step.id}
        activeIds={actives.map((s) => s.step.id)}
        progressRatio={progress.ratio}
      />
    </div>
  )
}
