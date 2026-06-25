import { useEffect, useState, type ReactNode } from 'react'
import { Car, Package, Save, Trash2, UserCog, Users, X } from 'lucide-react'
import type { Vehicle } from '@/features/roadmap/types'
import { TagEditor } from '@/components/common/TagEditor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

function Section({ icon: Icon, label, children }: { icon: typeof Users; label: string; children: ReactNode }) {
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

function vehicleEqual(a: Vehicle, b: Vehicle): boolean {
  return (
    a.name === b.name &&
    a.driver === b.driver &&
    a.passengers.join('\0') === b.passengers.join('\0') &&
    a.cargo.join('\0') === b.cargo.join('\0')
  )
}

interface VehicleCardProps {
  vehicle: Vehicle
  isNew?: boolean
  onSave: (draft: Vehicle) => void
  onCancel: () => void
  onDelete: () => void
}

export function VehicleCard({ vehicle, isNew, onSave, onCancel, onDelete }: VehicleCardProps) {
  const [draft, setDraft] = useState(vehicle)
  const dirty = isNew || !vehicleEqual(draft, vehicle)

  useEffect(() => {
    setDraft(vehicle)
  }, [vehicle.id])

  useEffect(() => {
    if (!dirty && !vehicleEqual(draft, vehicle)) setDraft(vehicle)
  }, [vehicle, dirty, draft])

  const patch = (p: Partial<Vehicle>) => setDraft((d) => ({ ...d, ...p }))

  const handleDelete = () => {
    if (confirm(`Supprimer « ${draft.name} » ?`)) onDelete()
  }

  return (
    <div className="group space-y-4 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Car className="size-5" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            {isNew && <Badge variant="muted">brouillon</Badge>}
            {dirty && !isNew && (
              <span className="text-xs text-amber-600 dark:text-amber-400">non enregistré</span>
            )}
          </div>
          <Input
            value={draft.name}
            onChange={(e) => patch({ name: e.target.value })}
            className="h-9 border-0 bg-transparent px-0 text-lg font-bold shadow-none focus-visible:ring-0"
            placeholder="Nom du véhicule"
          />
        </div>
        <button
          type="button"
          onClick={handleDelete}
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground/50 transition-opacity hover:text-destructive md:opacity-0 md:group-hover:opacity-100"
          aria-label="Supprimer"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <Section icon={UserCog} label="Conducteur">
        <Input
          value={draft.driver ?? ''}
          placeholder="Nom du conducteur"
          onChange={(e) => patch({ driver: e.target.value || undefined })}
          className="h-9"
        />
      </Section>

      <Section icon={Users} label="Passagers">
        <TagEditor
          items={draft.passengers}
          tone="people"
          placeholder="Passager"
          onChange={(passengers) => patch({ passengers })}
        />
      </Section>

      <Section icon={Package} label="Matériel transporté">
        <TagEditor
          items={draft.cargo}
          tone="gear"
          placeholder="Matériel"
          onChange={(cargo) => patch({ cargo })}
        />
      </Section>

      <div className="flex flex-wrap gap-2 border-t border-border/60 pt-3">
        <Button type="button" size="sm" onClick={() => onSave(draft)} disabled={!dirty && !isNew}>
          <Save /> Enregistrer
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            if (isNew) onCancel()
            else setDraft(vehicle)
          }}
          disabled={!dirty && !isNew}
        >
          <X /> {isNew ? 'Annuler' : 'Réinitialiser'}
        </Button>
      </div>
    </div>
  )
}
