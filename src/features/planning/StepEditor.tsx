import { useEffect, useState } from 'react'
import { Save, Trash2, X } from 'lucide-react'
import type { Step } from '@/features/roadmap/types'
import { EntityMultiSelect } from '@/components/common/EntityMultiSelect'
import { useRoadmapStore } from '@/features/roadmap/store'
import {
  equipmentOptions,
  peopleOptions,
  vehicleOptions,
} from '@/features/planning/stepResources.utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { TagEditor } from '@/components/common/TagEditor'
import { fromDatetimeLocal, toDatetimeLocal } from './step.utils'

interface StepEditorProps {
  step: Step
  isNew?: boolean
  onSave: (draft: Step) => void
  onCancel: () => void
  onDelete: () => void
}

function stepFieldsEqual(a: Step, b: Step): boolean {
  return (
    a.title === b.title &&
    a.phase === b.phase &&
    a.start === b.start &&
    a.end === b.end &&
    a.location === b.location &&
    a.participants.join('\0') === b.participants.join('\0') &&
    a.equipment.join('\0') === b.equipment.join('\0') &&
    a.vehicles.join('\0') === b.vehicles.join('\0') &&
    a.details.join('\0') === b.details.join('\0')
  )
}

export function StepEditor({ step, isNew, onSave, onCancel, onDelete }: StepEditorProps) {
  const roadmap = useRoadmapStore((s) => s.roadmap)
  const [draft, setDraft] = useState(step)
  const dirty = isNew || !stepFieldsEqual(draft, step)

  const peopleOpts = peopleOptions(roadmap)
  const vehicleOpts = vehicleOptions(roadmap)
  const equipmentOpts = equipmentOptions(roadmap)

  useEffect(() => {
    setDraft(step)
  }, [step.id])

  useEffect(() => {
    if (!dirty && !stepFieldsEqual(draft, step)) setDraft(step)
  }, [step, dirty, draft])

  const patch = (p: Partial<Step>) => setDraft((d) => ({ ...d, ...p }))

  const handleDelete = () => {
    if (confirm(`Supprimer « ${draft.title} » ?`)) onDelete()
  }

  return (
    <div className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {isNew ? 'Nouvelle étape' : "Modifier l'étape"}
          </p>
          {dirty && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Modifications non enregistrées
            </p>
          )}
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={handleDelete}
        >
          <Trash2 /> Supprimer
        </Button>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground">Titre</label>
        <Input
          value={draft.title}
          onChange={(e) => patch({ title: e.target.value })}
          className="h-9 font-bold"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Phase</label>
          <Input
            value={draft.phase}
            onChange={(e) => patch({ phase: e.target.value })}
            className="h-9"
            placeholder="Tournage, Setup, Trajet…"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Lieu</label>
          <Input
            value={draft.location ?? ''}
            onChange={(e) => patch({ location: e.target.value || undefined })}
            className="h-9"
            placeholder="Plateau, adresse…"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Début</label>
          <Input
            type="datetime-local"
            value={toDatetimeLocal(draft.start)}
            onChange={(e) => patch({ start: fromDatetimeLocal(e.target.value) })}
            className="h-9 font-mono text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Fin</label>
          <Input
            type="datetime-local"
            value={toDatetimeLocal(draft.end)}
            onChange={(e) => patch({ end: fromDatetimeLocal(e.target.value) })}
            className="h-9 font-mono text-sm"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground">Personnes</label>
        <EntityMultiSelect
          options={peopleOpts}
          value={draft.participants}
          onChange={(participants) => patch({ participants })}
          placeholder="Choisir des personnes…"
          tone="people"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground">Véhicules</label>
        <EntityMultiSelect
          options={vehicleOpts}
          value={draft.vehicles}
          onChange={(vehicles) => patch({ vehicles })}
          placeholder="Choisir des véhicules…"
          tone="vehicle"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground">Matériel</label>
        <EntityMultiSelect
          options={equipmentOpts}
          value={draft.equipment}
          onChange={(equipment) => patch({ equipment })}
          placeholder="Choisir du matériel…"
          tone="gear"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground">Détails / plans</label>
        <TagEditor
          items={draft.details}
          onChange={(details) => patch({ details })}
          placeholder="Plan 1, Plan 2…"
          tone="gear"
        />
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border/60 pt-3">
        <Button type="button" onClick={() => onSave(draft)} disabled={!dirty && !isNew}>
          <Save /> Enregistrer
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (isNew) onCancel()
            else setDraft(step)
          }}
          disabled={!dirty && !isNew}
        >
          <X /> {isNew ? 'Annuler' : 'Réinitialiser'}
        </Button>
      </div>
    </div>
  )
}
