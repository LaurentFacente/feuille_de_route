import type { Roadmap } from '@/features/roadmap/types'

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr'))
}

/** Noms des membres de l'équipe. */
export function peopleOptions(roadmap: Roadmap): string[] {
  return uniqueSorted(roadmap.team.map((p) => p.name))
}

/** Noms des véhicules du projet. */
export function vehicleOptions(roadmap: Roadmap): string[] {
  return uniqueSorted(roadmap.vehicles.map((v) => v.name))
}

/** Matériel : items des checklists + matériel déjà utilisé dans les étapes. */
export function equipmentOptions(roadmap: Roadmap): string[] {
  const fromChecklists = roadmap.checklists.flatMap((c) => c.items.map((i) => i.label))
  const fromSteps = roadmap.days.flatMap((d) => d.steps.flatMap((s) => s.equipment))
  return uniqueSorted([...fromChecklists, ...fromSteps])
}
