import { motion, AnimatePresence } from 'framer-motion'
import { UserPlus, Trash2, User } from 'lucide-react'
import { useRoadmapStore } from '@/features/roadmap/store'
import { Button } from '@/components/ui/button'

export function TeamPage() {
  const team = useRoadmapStore((s) => s.roadmap.team)
  const addPerson = useRoadmapStore((s) => s.addPerson)
  const updatePerson = useRoadmapStore((s) => s.updatePerson)
  const removePerson = useRoadmapStore((s) => s.removePerson)

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold">Équipe</h2>
          <p className="text-sm text-muted-foreground">{team.length} personnes · cliquez pour éditer</p>
        </div>
        <Button onClick={() => addPerson()}>
          <UserPlus /> Ajouter
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>
          {team.map((p) => (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="group rounded-2xl border border-border bg-card p-4"
            >
              <div className="flex items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-base font-black text-primary">
                  {p.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <input
                    value={p.name}
                    onChange={(e) => updatePerson(p.id, { name: e.target.value })}
                    className="w-full bg-transparent text-base font-bold outline-none"
                  />
                  <input
                    value={p.role}
                    onChange={(e) => updatePerson(p.id, { role: e.target.value })}
                    className="w-full bg-transparent text-sm text-primary outline-none"
                  />
                </div>
                <button
                  onClick={() => removePerson(p.id)}
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground/50 transition-opacity hover:text-destructive md:opacity-0 md:group-hover:opacity-100"
                  aria-label="Supprimer"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {team.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border py-12 text-center text-muted-foreground">
          <User className="mx-auto mb-2 size-8" />
          Aucun membre. Ajoutez votre équipe.
        </div>
      )}
    </div>
  )
}
