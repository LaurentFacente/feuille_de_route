import { CheckCircle2, Circle, PlayCircle, AlertTriangle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StepStatus } from './types'

interface StatusConfig {
  label: string
  Icon: LucideIcon
  /** solid text+bg chip classes */
  chip: string
  /** plain text color */
  text: string
  /** dot / accent background */
  dot: string
  /** soft surface tint */
  surface: string
  /** left border accent */
  border: string
}

export const STATUS_CONFIG: Record<StepStatus, StatusConfig> = {
  done: {
    label: 'Terminé',
    Icon: CheckCircle2,
    chip: 'bg-status-done/15 text-status-done border border-status-done/30',
    text: 'text-status-done',
    dot: 'bg-status-done',
    surface: 'bg-status-done/5',
    border: 'border-status-done/40',
  },
  'in-progress': {
    label: 'En cours',
    Icon: PlayCircle,
    chip: 'bg-status-progress/15 text-status-progress border border-status-progress/30',
    text: 'text-status-progress',
    dot: 'bg-status-progress',
    surface: 'bg-status-progress/5',
    border: 'border-status-progress/50',
  },
  upcoming: {
    label: 'À venir',
    Icon: Circle,
    chip: 'bg-status-upcoming/15 text-status-upcoming border border-status-upcoming/30',
    text: 'text-status-upcoming',
    dot: 'bg-status-upcoming',
    surface: 'bg-status-upcoming/5',
    border: 'border-status-upcoming/40',
  },
  late: {
    label: 'En retard',
    Icon: AlertTriangle,
    chip: 'bg-status-late/15 text-status-late border border-status-late/30',
    text: 'text-status-late',
    dot: 'bg-status-late',
    surface: 'bg-status-late/5',
    border: 'border-status-late/50',
  },
}

interface StatusBadgeProps {
  status: StepStatus
  className?: string
  showIcon?: boolean
}

export function StatusBadge({ status, className, showIcon = true }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status]
  const { Icon } = cfg
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide',
        cfg.chip,
        className,
      )}
    >
      {showIcon && <Icon className="size-3.5" />}
      {cfg.label}
    </span>
  )
}

export function StatusDot({ status, className }: { status: StepStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-block size-2.5 rounded-full',
        STATUS_CONFIG[status].dot,
        status === 'in-progress' && 'animate-pulse-ring',
        className,
      )}
    />
  )
}
