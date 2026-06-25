import { useRef, useState } from 'react'
import { Download, Upload, RotateCcw, FileJson, Check, AlertTriangle } from 'lucide-react'
import { useRoadmapStore } from '@/features/roadmap/store'
import { exportRoadmap, parseRoadmap, readFileAsText, RoadmapValidationError } from '@/features/roadmap/io'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Feedback = { type: 'ok' | 'error'; message: string } | null

export function SettingsPage() {
  const roadmap = useRoadmapStore((s) => s.roadmap)
  const updateProject = useRoadmapStore((s) => s.updateProject)
  const importRoadmap = useRoadmapStore((s) => s.importRoadmap)
  const resetRoadmap = useRoadmapStore((s) => s.resetRoadmap)
  const fileRef = useRef<HTMLInputElement>(null)
  const [feedback, setFeedback] = useState<Feedback>(null)

  const handleFile = async (file?: File) => {
    if (!file) return
    try {
      const text = await readFileAsText(file)
      const parsed = parseRoadmap(text)
      importRoadmap(parsed)
      setFeedback({ type: 'ok', message: `Feuille de route « ${parsed.projectName} » importée.` })
    } catch (e) {
      const message = e instanceof RoadmapValidationError ? e.message : 'Import impossible.'
      setFeedback({ type: 'error', message })
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h2 className="text-xl font-extrabold">Réglages</h2>

      <Card>
        <CardHeader>
          <CardTitle>Projet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Nom du projet
            </label>
            <Input
              value={roadmap.projectName}
              onChange={(e) => updateProject({ projectName: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Sous-titre / capsules
            </label>
            <Input
              value={roadmap.subtitle}
              onChange={(e) => updateProject({ subtitle: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileJson className="size-5 text-primary" /> Feuille de route (JSON)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Sauvegardez ou chargez l'intégralité de la feuille de route (jours, étapes,
            participants, matériel, commentaires, checklists).
          </p>

          {feedback && (
            <div
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                feedback.type === 'ok'
                  ? 'border-status-done/40 bg-status-done/10 text-status-done'
                  : 'border-destructive/40 bg-destructive/10 text-destructive'
              }`}
            >
              {feedback.type === 'ok' ? <Check className="size-4" /> : <AlertTriangle className="size-4" />}
              {feedback.message}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => exportRoadmap(roadmap)}>
              <Download /> Exporter le JSON
            </Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload /> Importer un JSON
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                void handleFile(e.target.files?.[0])
                e.target.value = ''
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Zone sensible</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            Réinitialise la feuille de route avec les données de démonstration.
          </p>
          <Button
            variant="destructive"
            onClick={() => {
              if (confirm('Réinitialiser toutes les données ? Cette action est irréversible.')) {
                resetRoadmap()
                setFeedback({ type: 'ok', message: 'Données réinitialisées.' })
              }
            }}
          >
            <RotateCcw /> Réinitialiser
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
