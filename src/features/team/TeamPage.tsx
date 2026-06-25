import { motion } from 'framer-motion'
import { User } from 'lucide-react'
import { useRoadmapStore } from '@/features/roadmap/store'

export function TeamPage() {
  const team = useRoadmapStore((s) => s.roadmap.team)

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div>
        <h2 className="text-xl font-extrabold">Équipe</h2>
        <p className="text-sm text-muted-foreground">{team.length} personnes</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {team.map((p) => (
          <motion.div
            key={p.id}
            layout
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-border bg-card p-4"
          >
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-base font-black text-primary">
                {p.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-base font-bold">{p.name}</p>
                <p className="text-sm text-primary">{p.role}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {team.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border py-12 text-center text-muted-foreground">
          <User className="mx-auto mb-2 size-8" />
          Aucun membre dans l'équipe.
        </div>
      )}
    </div>
  )
}
