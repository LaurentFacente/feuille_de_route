import { motion, AnimatePresence } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useRoadmapStore } from '@/features/roadmap/store'
import { VehicleCard } from '@/features/vehicles/VehicleCard'
import { Button } from '@/components/ui/button'

export function VehiclesPage() {
  const vehicles = useRoadmapStore((s) => s.roadmap.vehicles)
  const pendingVehicleIds = useRoadmapStore((s) => s.pendingVehicleIds)
  const addVehicle = useRoadmapStore((s) => s.addVehicle)
  const saveVehicle = useRoadmapStore((s) => s.saveVehicle)
  const cancelVehicle = useRoadmapStore((s) => s.cancelVehicle)
  const removeVehicle = useRoadmapStore((s) => s.removeVehicle)

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold">Véhicules</h2>
          <p className="text-sm text-muted-foreground">
            {vehicles.length} véhicules · modifiez puis <strong>Enregistrer</strong>
          </p>
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
            >
              <VehicleCard
                vehicle={v}
                isNew={pendingVehicleIds.includes(v.id)}
                onSave={(draft) => saveVehicle(v.id, draft)}
                onCancel={() => cancelVehicle(v.id)}
                onDelete={() => removeVehicle(v.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
