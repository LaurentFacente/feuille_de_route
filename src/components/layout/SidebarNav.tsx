import { NavLink } from 'react-router-dom'
import { NAV_ITEMS } from './navigation'
import { cn } from '@/lib/utils'

interface SidebarNavProps {
  onNavigate?: () => void
  className?: string
}

export function SidebarNav({ onNavigate, className }: SidebarNavProps) {
  return (
    <nav className={cn('flex flex-1 flex-col gap-1 px-3', className)}>
      {NAV_ITEMS.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary/15 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )
          }
        >
          <Icon className="size-[18px] shrink-0" />
          <span className="truncate">{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
