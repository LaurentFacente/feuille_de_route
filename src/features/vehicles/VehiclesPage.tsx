import { motion, AnimatePresence } from 'framer-motion'
import { Car, Plus, Trash2, UserCog, Users, Package } from 'lucide-react'
import { useRoadmapStore } from '@/features/roadmap/store'
import { TagEditor } from '@/components/common/TagEditor'
import { Button } from '@/components/ui/button'

function Section({ icon: Icon, label, children }: { icon: typeof Users; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </div>
      {children}
    </div>
  )
}

export function VehiclesPage() {
  const vehicles = useRoadmapStore((s) => s.roadmap.vehicles)
  const addVehicle = useRoadmapStore((s) => s.addVehicle)
  const updateVehicle = useRoadmapStore((s) => s.updateVehicle)
  const removeVehicle = useRoadmapStore((s) => s.removeVehicle)

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold">Véhicules</h2>
          <p className="text-sm text-muted-foreground">{vehicles.length} véhicules · logistique transport</p>
        </div>
        <Button onClick={() => addVehicle()}>
          <Plus /> Ajouter
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence>
          {vehicles.map((v) => (
            <motion.div
              key={v.id}
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="group space-y-4 rounded-2xl border border-border bg-card p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Car className="size-5" />
                </div>
                <input
                  value={v.name}
                  onChange={(e) => updateVehicle(v.id, { name: e.target.value })}
                  className="w-full bg-transparent text-lg font-bold outline-none"
                />
                <button
                  onClick={() => removeVehicle(v.id)}
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground/50 transition-opacity hover:text-destructive md:opacity-0 md:group-hover:opacity-100"
                  aria-label="Supprimer"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              <Section icon={UserCog} label="Conducteur">
                <input
                  value={v.driver ?? ''}
                  placeholder="Nom du conducteur"
                  onChange={(e) => updateVehicle(v.id, { driver: e.target.value })}
                  className="h-9 w-full rounded-lg bg-muted/40 px-2.5 text-sm font-semibold outline-none focus:bg-muted"
                />
              </Section>

              <Section icon={Users} label="Passagers">
                <TagEditor
                  items={v.passengers}
                  tone="people"
                  placeholder="Passager"
                  onChange={(passengers) => updateVehicle(v.id, { passengers })}
                />
              </Section>

              <Section icon={Package} label="Matériel transporté">
                <TagEditor
                  items={v.cargo}
                  tone="gear"
                  placeholder="Matériel"
                  onChange={(cargo) => updateVehicle(v.id, { cargo })}
                />
              </Section>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
