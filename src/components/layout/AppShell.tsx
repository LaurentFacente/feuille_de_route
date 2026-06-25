import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { Clapperboard } from 'lucide-react'
import { NAV_ITEMS } from './navigation'
import { TopBar } from './TopBar'
import { cn } from '@/lib/utils'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen-safe pl-safe pr-safe">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border/60 glass md:flex">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
            <Clapperboard className="size-5" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-extrabold">Production</div>
            <div className="text-xs text-muted-foreground">Tracker</div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV_ITEMS.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )
              }
            >
              <Icon className="size-[18px]" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-5 py-4 text-[11px] text-muted-foreground/70">
          Fil rouge tournage · v1
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-4 md:px-6 md:pb-8 md:pt-5">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-7 border-t border-border/60 glass pb-safe md:hidden">
        {NAV_ITEMS.map(({ to, short, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex min-h-[58px] flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors active:bg-accent/60',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'flex size-9 items-center justify-center rounded-xl transition-colors',
                    isActive && 'bg-primary/15',
                  )}
                >
                  <Icon className="size-[22px]" />
                </span>
                {short}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
