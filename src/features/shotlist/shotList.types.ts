export interface ShotPlan {
  id: string
  /** Affichage court, ex. "PLAN 1a" */
  label: string
}

export interface ShotVisuel {
  id: string
  /** Nom du visuel, ex. "SOUS MORPHINE VISUEL 1" */
  name: string
  /** Lieu de tournage du visuel */
  location: string
  plans: ShotPlan[]
}
