import { Routes, Route } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { PlanningPage } from '@/features/planning/PlanningPage'
import { RegiePage } from '@/features/regie/RegiePage'
import { TeamPage } from '@/features/team/TeamPage'
import { VehiclesPage } from '@/features/vehicles/VehiclesPage'
import { ChecklistsPage } from '@/features/checklists/ChecklistsPage'
import { ShotListPage } from '@/features/shotlist/ShotListPage'
import { SettingsPage } from '@/features/settings/SettingsPage'

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/planning" element={<PlanningPage />} />
        <Route path="/regie" element={<RegiePage />} />
        <Route path="/equipe" element={<TeamPage />} />
        <Route path="/vehicules" element={<VehiclesPage />} />
        <Route path="/checklists" element={<ChecklistsPage />} />
        <Route path="/shot-list" element={<ShotListPage />} />
        <Route path="/reglages" element={<SettingsPage />} />
      </Routes>
    </AppShell>
  )
}
