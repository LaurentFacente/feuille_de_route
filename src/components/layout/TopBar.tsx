import { motion } from 'framer-motion'
import { CalendarDays, Hourglass, AlertTriangle, PanelLeft } from 'lucide-react'
import { useRoadmapStore } from '@/features/roadmap/store'
import { useSidebar } from '@/components/layout/SidebarProvider'
import { useTracker } from '@/hooks/useTracker'
import { useNow } from '@/hooks/useNow'
import { formatClock, formatLongCountdown, formatLongDate } from '@/lib/time'
import { delayMinutes } from '@/features/roadmap/roadmap.utils'
import { Button } from '@/components/ui/button'

export function TopBar() {
  const now = useNow()
  const { open, toggle } = useSidebar()
  const projectName = useRoadmapStore((s) => s.roadmap.projectName)
  const subtitle = useRoadmapStore((s) => s.roadmap.subtitle)
  const { current, lateSteps, weekend } = useTracker()

  const dayLabel = current?.dayLabel ?? formatLongDate(now)
  const endMs = weekend.end ? new Date(weekend.end).getTime() - now.getTime() : 0
  const totalLate = lateSteps.reduce((acc, s) => acc + delayMinutes(s, now), 0)

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 glass pt-safe">
      <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="hidden size-9 shrink-0 md:inline-flex"
            onClick={toggle}
            aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={open}
          >
            <PanelLeft className="size-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-base font-extrabold tracking-tight md:text-lg">
              {projectName}
            </h1>
            <p className="hidden truncate text-xs text-muted-foreground sm:block">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {totalLate > 0 && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="hidden items-center gap-1.5 rounded-full border border-status-late/40 bg-status-late/15 px-3 py-1.5 text-xs font-bold text-status-late md:flex"
            >
              <AlertTriangle className="size-3.5" />
              Retard {totalLate} min
            </motion.div>
          )}

          <div className="hidden text-right md:block">
            <div className="flex items-center justify-end gap-1.5 text-xs font-medium text-muted-foreground">
              <CalendarDays className="size-3.5" />
              <span className="capitalize">{dayLabel}</span>
            </div>
            <div className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
              <Hourglass className="size-3.5" />
              <span>Fin dans {formatLongCountdown(endMs)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-border bg-background/40 px-2.5 py-1.5 md:gap-2.5 md:px-3">
            <span className="relative flex size-2.5 shrink-0 items-center justify-center" aria-hidden>
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-status-done opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-status-done" />
            </span>
            <span className="hidden text-[10px] font-bold uppercase tracking-widest text-status-done sm:inline">
              Live
            </span>
            <span className="font-mono text-base font-bold leading-none tabular md:text-2xl">
              {formatClock(now)}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile info strip — key context always visible on phones */}
      <div className="no-scrollbar flex items-center gap-3 overflow-x-auto border-t border-border/40 px-4 py-1.5 text-xs md:hidden">
        <span className="flex shrink-0 items-center gap-1.5 font-medium text-muted-foreground">
          <CalendarDays className="size-3.5" />
          <span className="capitalize">{dayLabel}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5 text-muted-foreground">
          <Hourglass className="size-3.5" />
          Fin dans {formatLongCountdown(endMs)}
        </span>
        {totalLate > 0 && (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-status-late/15 px-2 py-0.5 font-bold text-status-late">
            <AlertTriangle className="size-3" />
            Retard {totalLate} min
          </span>
        )}
      </div>
    </header>
  )
}
