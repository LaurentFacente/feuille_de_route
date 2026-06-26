import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import type { EffectiveStep } from '@/features/roadmap/roadmap.utils'
import { STATUS_CONFIG } from '@/features/roadmap/status'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { formatHm } from '@/lib/time'

interface TimelineProps {
  steps: EffectiveStep[]
  currentId?: string
  activeIds?: string[]
  progressRatio: number
}

export function Timeline({ steps, currentId, activeIds, progressRatio }: TimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const currentRef = useRef<HTMLButtonElement>(null)
  const highlightIds = activeIds?.length ? activeIds : currentId ? [currentId] : []

  useEffect(() => {
    currentRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [highlightIds.join(',')])

  return (
    <div className="rounded-2xl border border-border bg-card p-4 md:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Timeline du week-end
        </h3>
        <span className="font-mono text-xs text-muted-foreground tabular">
          {Math.round(progressRatio * 100)}%
        </span>
      </div>

      <Progress value={progressRatio * 100} className="mb-4" indicatorClassName="bg-status-done" />

      <div ref={scrollRef} className="no-scrollbar flex gap-2 overflow-x-auto pb-2">
        {steps.map((s, i) => {
          const cfg = STATUS_CONFIG[s.status]
          const isCurrent = highlightIds.includes(s.step.id)
          const isScrollTarget = highlightIds[0] === s.step.id
          return (
            <div key={s.step.id} className="flex items-center gap-2">
              <motion.button
                ref={isScrollTarget ? currentRef : undefined}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: Math.min(i * 0.015, 0.3) }}
                className={cn(
                  'relative flex w-36 shrink-0 flex-col gap-1 rounded-xl border p-3 text-left transition-all',
                  cfg.border,
                  cfg.surface,
                  isCurrent ? 'ring-2 ring-status-progress shadow-lg' : 'hover:brightness-125',
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn('text-[10px] font-bold uppercase tracking-wide', cfg.text)}>
                    {s.step.phase}
                  </span>
                  <span className={cn('size-2 rounded-full', cfg.dot, isCurrent && 'animate-pulse-ring')} />
                </div>
                <span className="line-clamp-2 text-xs font-bold leading-tight">{s.step.title}</span>
                <span className="font-mono text-[10px] text-muted-foreground tabular">
                  {formatHm(s.start)}
                </span>
                <span className="text-[9px] uppercase text-muted-foreground/70">{s.dayLabel}</span>
              </motion.button>
              {i < steps.length - 1 && (
                <ChevronRight className="size-4 shrink-0 text-muted-foreground/40" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
