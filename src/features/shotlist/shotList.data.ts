import type { ShotPlan, ShotVisuel } from './shotList.types'

interface VisuelSeed {
  name: string
  location: string
  /** Codes de plan bruts, ex. "1a", "2", "4b" */
  plans: string[]
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/** Construit un visuel typé (ids stables) à partir d'une définition compacte. */
function buildVisuel(seed: VisuelSeed): ShotVisuel {
  const id = slugify(seed.name)
  const plans: ShotPlan[] = seed.plans.map((code) => ({
    id: `${id}__${slugify(code)}`,
    label: `PLAN ${code}`,
  }))
  return { id, name: seed.name, location: seed.location, plans }
}

const VISUEL_SEEDS: VisuelSeed[] = [
  {
    name: 'SOUS MORPHINE VISUEL 1',
    location: 'Atelier Romain',
    plans: ['1a', '1b', '2', '3a', '3b', '4a', '4b', '4c', '5a', '5b', '5c'],
  },
  {
    name: 'SOUS MORPHINE VISUEL 2',
    location: 'Atelier Romain',
    plans: ['1', '2', '3', '4', '5', '6'],
  },
  {
    name: 'SOUS MORPHINE VISUEL 3',
    location: 'Atelier Romain',
    plans: ['1a'],
  },
  {
    name: 'KATY PERI VISUEL 1 & 2',
    location: 'Marseille',
    plans: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16'],
  },
  {
    name: 'KATY PERI VISUEL 3',
    location: 'Atelier Romain',
    plans: ['1a', '1b', '2'],
  },
  {
    name: 'SOUS DROP VISUEL 1',
    location: 'Plateau de Vitrolles',
    plans: ['1', '2', '3', '4', '4b', '4c', '5', '5b', '5c', '6', '7', '7b', '8', '10', '11'],
  },
  {
    name: 'SOUS DROP VISUEL 2',
    location: 'Plateau de Vitrolles',
    plans: ['1', '2', '3', '4', '5', '6'],
  },
  {
    name: 'SOUS DROP VISUEL 3',
    location: 'Plateau de Vitrolles',
    plans: ['1', '2', '3', '4', '5', '6', '7'],
  },
  {
    name: 'READY TO SELL VISUEL 1',
    location: 'Calanque de Samena',
    plans: ['1a', '1b', '1c'],
  },
  {
    name: 'READY TO SELL VISUEL 2',
    location: 'Calanque de Samena',
    plans: ['1a', '1b', '2a', '2b'],
  },
  {
    name: 'READY TO SELL VISUEL 3',
    location: 'Calanque de Samena',
    plans: ['1'],
  },
]

export const SHOT_VISUELS: ShotVisuel[] = VISUEL_SEEDS.map(buildVisuel)
