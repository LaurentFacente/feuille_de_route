import type { Roadmap } from './types'

export function exportRoadmap(roadmap: Roadmap): void {
  const blob = new Blob([JSON.stringify(roadmap, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const stamp = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `feuille-de-route-${stamp}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export class RoadmapValidationError extends Error {}

/** Defensive parse: ensures the imported object has the required shape. */
export function parseRoadmap(raw: string): Roadmap {
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    throw new RoadmapValidationError('Fichier JSON invalide (parsing impossible).')
  }

  if (typeof data !== 'object' || data === null) {
    throw new RoadmapValidationError('Le JSON doit être un objet.')
  }

  const obj = data as Record<string, unknown>
  if (!Array.isArray(obj.days)) {
    throw new RoadmapValidationError('Champ "days" manquant ou invalide.')
  }
  if (typeof obj.projectName !== 'string') {
    throw new RoadmapValidationError('Champ "projectName" manquant.')
  }

  return {
    projectName: obj.projectName,
    subtitle: typeof obj.subtitle === 'string' ? obj.subtitle : '',
    days: obj.days as Roadmap['days'],
    team: Array.isArray(obj.team) ? (obj.team as Roadmap['team']) : [],
    vehicles: Array.isArray(obj.vehicles) ? (obj.vehicles as Roadmap['vehicles']) : [],
    checklists: Array.isArray(obj.checklists) ? (obj.checklists as Roadmap['checklists']) : [],
    version: typeof obj.version === 'number' ? obj.version : 1,
  }
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new RoadmapValidationError('Lecture du fichier impossible.'))
    reader.readAsText(file)
  })
}
