import { motion, AnimatePresence } from 'framer-motion'
import { Check, Clapperboard, MapPin } from 'lucide-react'
import { checklistProgress } from '@/features/roadmap/roadmap.utils'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { SHOT_VISUELS } from './shotList.data'
import { useShotListStore } from './store'
import type { ShotVisuel } from './shotList.types'

function VisuelCard({ visuel }: { visuel: ShotVisuel }) {
  const checked = useShotListStore((s) => s.checked)
  const toggle = useShotListStore((s) => s.toggle)

  const items = visuel.plans.map((plan) => ({ checked: Boolean(checked[plan.id]) }))
  const progress = checklistProgress(items)
  const pct = Math.round(progress.ratio * 100)

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-4">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <h3 className="text-base font-extrabold">{visuel.name}</h3>
        <span className="font-mono text-sm font-bold tabular text-muted-foreground">{pct}%</span>
      </div>
      <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <MapPin className="size-3.5" />
        {visuel.location}
      </div>
      <Progress
        value={pct}
        className="mb-1"
        indicatorClassName={pct === 100 ? 'bg-status-done' : 'bg-primary'}
      />
      <div className="mb-3 text-xs text-muted-foreground">
        {progress.done}/{progress.total} plans tournés
      </div>

      <div className="flex-1 space-y-1">
        <AnimatePresence initial={false}>
          {visuel.plans.map((plan) => {
            const isChecked = Boolean(checked[plan.id])
            return (
              <motion.div
                key={plan.id}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                className="group flex items-center gap-1 rounded-lg hover:bg-muted/40"
              >
                <button
                  onClick={() => toggle(plan.id)}
                  className="flex min-h-[44px] flex-1 items-center gap-2.5 rounded-lg px-1.5 text-left active:bg-accent/40"
                  aria-label={isChecked ? 'Décocher' : 'Cocher'}
                >
                  <span
                    className={cn(
                      'flex size-6 shrink-0 items-center justify-center rounded-md border-2 transition-all',
                      isChecked ? 'border-status-done bg-status-done text-white' : 'border-border',
                    )}
                  >
                    {isChecked && <Check className="size-4" strokeWidth={3} />}
                  </span>
                  <span
                    className={cn(
                      'text-sm transition-colors',
                      isChecked && 'text-muted-foreground line-through',
                    )}
                  >
                    {plan.label}
                  </span>
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}

export function ShotListPage() {
  const checked = useShotListStore((s) => s.checked)

  const allItems = SHOT_VISUELS.flatMap((v) => v.plans.map((p) => ({ checked: Boolean(checked[p.id]) })))
  const overall = checklistProgress(allItems)

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg font-extrabold">
            <Clapperboard className="size-5 text-primary" />
            Shot List
          </div>
          <span className="font-mono text-lg font-black tabular">
            {Math.round(overall.ratio * 100)}%
          </span>
        </div>
        <Progress value={overall.ratio * 100} indicatorClassName="bg-status-done" />
        <div className="mt-2 text-sm text-muted-foreground">
          {overall.done}/{overall.total} plans tournés · partagé avec l'équipe
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {SHOT_VISUELS.map((visuel) => (
          <VisuelCard key={visuel.id} visuel={visuel} />
        ))}
      </div>
    </div>
  )
}
