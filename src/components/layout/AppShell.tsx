import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Clapperboard, PanelLeftClose } from 'lucide-react'
import { NAV_ITEMS } from './navigation'
import { SidebarNav } from './SidebarNav'
import { SidebarProvider, useSidebar } from './SidebarProvider'
import { TopBar } from './TopBar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const SIDEBAR_WIDTH = 240

function DesktopSidebar() {
  const { open, setOpen } = useSidebar()

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm lg:hidden"
            aria-label="Fermer le menu"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ width: open ? SIDEBAR_WIDTH : 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 36 }}
        className={cn(
          'fixed inset-y-0 left-0 z-50 hidden shrink-0 overflow-hidden border-r border-border/60 glass md:flex',
          !open && 'border-r-0',
        )}
        style={{ paddingLeft: 'env(safe-area-inset-left)' }}
        aria-hidden={!open}
      >
        <div className="flex h-full w-60 flex-col">
          <div className="flex items-center justify-between gap-2 px-4 py-5">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
                <Clapperboard className="size-5" />
              </div>
              <div className="min-w-0 leading-tight">
                <div className="truncate text-sm font-extrabold">Production</div>
                <div className="truncate text-xs text-muted-foreground">Tracker</div>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              onClick={() => setOpen(false)}
              aria-label="Fermer le menu"
            >
              <PanelLeftClose className="size-4" />
            </Button>
          </div>

          <SidebarNav onNavigate={() => setOpen(false)} />

          <div className="px-5 py-4 text-[11px] text-muted-foreground/70">Fil rouge tournage · v1</div>
        </div>
      </motion.aside>
    </>
  )
}

function AppShellLayout({ children }: { children: ReactNode }) {
  const { open } = useSidebar()

  return (
    <div className="flex min-h-screen-safe pr-safe">
      <DesktopSidebar />

      <motion.div
        initial={false}
        animate={{ marginLeft: open ? SIDEBAR_WIDTH : 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 36 }}
        className="flex min-w-0 flex-1 flex-col"
        style={{ paddingLeft: 'env(safe-area-inset-left)' }}
      >
        <TopBar />
        <main className="flex-1 px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-4 md:px-6 md:pb-8 md:pt-5">
          {children}
        </main>
      </motion.div>

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

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <AppShellLayout>{children}</AppShellLayout>
    </SidebarProvider>
  )
}
