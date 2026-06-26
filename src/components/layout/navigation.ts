import {
  LayoutDashboard,
  CalendarRange,
  RadioTower,
  Users,
  Car,
  ListChecks,
  Clapperboard,
  Settings2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  short: string
  Icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', short: 'Live', Icon: LayoutDashboard },
  { to: '/planning', label: 'Planning', short: 'Plan', Icon: CalendarRange },
  { to: '/regie', label: 'Mode Régie', short: 'Régie', Icon: RadioTower },
  { to: '/equipe', label: 'Équipe', short: 'Équipe', Icon: Users },
  { to: '/vehicules', label: 'Véhicules', short: 'Autos', Icon: Car },
  { to: '/checklists', label: 'Checklists', short: 'Check', Icon: ListChecks },
  { to: '/shot-list', label: 'Shot List', short: 'Shots', Icon: Clapperboard },
  { to: '/reglages', label: 'Réglages', short: 'Plus', Icon: Settings2 },
]
