import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Plus, Trash2, ListChecks, FolderPlus } from 'lucide-react'
import { useRoadmapStore } from '@/features/roadmap/store'
import { checklistProgress } from '@/features/roadmap/roadmap.utils'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

function CategoryCard({ categoryId }: { categoryId: string }) {
  const category = useRoadmapStore((s) => s.roadmap.checklists.find((c) => c.id === categoryId))!
  const toggle = useRoadmapStore((s) => s.toggleChecklistItem)
  const addItem = useRoadmapStore((s) => s.addChecklistItem)
  const removeItem = useRoadmapStore((s) => s.removeChecklistItem)
  const [draft, setDraft] = useState('')

  const progress = checklistProgress(category.items)
  const pct = Math.round(progress.ratio * 100)

  const submit = () => {
    if (!draft.trim()) return
    addItem(categoryId, draft.trim())
    setDraft('')
  }

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-4">
      <div className="mb-1 flex items-baseline justify-between">
        <h3 className="text-base font-extrabold">{category.name}</h3>
        <span className="font-mono text-sm font-bold tabular text-muted-foreground">{pct}%</span>
      </div>
      <Progress
        value={pct}
        className="mb-1"
        indicatorClassName={pct === 100 ? 'bg-status-done' : 'bg-primary'}
      />
      <div className="mb-3 text-xs text-muted-foreground">
        {progress.done}/{progress.total} cochés
      </div>

      <div className="flex-1 space-y-1">
        <AnimatePresence initial={false}>
          {category.items.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              className="group flex items-center gap-1 rounded-lg hover:bg-muted/40"
            >
              <button
                onClick={() => toggle(categoryId, item.id)}
                className="flex min-h-[44px] flex-1 items-center gap-2.5 rounded-lg px-1.5 text-left active:bg-accent/40"
                aria-label={item.checked ? 'Décocher' : 'Cocher'}
              >
                <span
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-md border-2 transition-all',
                    item.checked
                      ? 'border-status-done bg-status-done text-white'
                      : 'border-border',
                  )}
                >
                  {item.checked && <Check className="size-4" strokeWidth={3} />}
                </span>
                <span
                  className={cn(
                    'text-sm transition-colors',
                    item.checked && 'text-muted-foreground line-through',
                  )}
                >
                  {item.label}
                </span>
              </button>
              <button
                onClick={() => removeItem(categoryId, item.id)}
                className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground/50 transition-opacity hover:text-destructive md:opacity-0 md:group-hover:opacity-100"
                aria-label="Supprimer"
              >
                <Trash2 className="size-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Nouvel élément…"
          className="h-9 text-sm"
        />
        <Button size="icon" variant="outline" onClick={submit} className="size-9 shrink-0" aria-label="Ajouter">
          <Plus />
        </Button>
      </div>
    </div>
  )
}

export function ChecklistsPage() {
  const checklists = useRoadmapStore((s) => s.roadmap.checklists)
  const addCategory = useRoadmapStore((s) => s.addChecklistCategory)
  const [newCat, setNewCat] = useState('')

  const allItems = checklists.flatMap((c) => c.items)
  const overall = checklistProgress(allItems)

  const submitCat = () => {
    if (!newCat.trim()) return
    addCategory(newCat.trim())
    setNewCat('')
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg font-extrabold">
            <ListChecks className="size-5 text-primary" />
            Préparation matériel
          </div>
          <span className="font-mono text-lg font-black tabular">
            {Math.round(overall.ratio * 100)}%
          </span>
        </div>
        <Progress value={overall.ratio * 100} indicatorClassName="bg-status-done" />
        <div className="mt-2 text-sm text-muted-foreground">
          {overall.done}/{overall.total} éléments prêts · progression personnelle
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {checklists.map((c) => (
          <CategoryCard key={c.id} categoryId={c.id} />
        ))}
      </div>

      <div className="flex items-center gap-2 rounded-2xl border border-dashed border-border p-3">
        <FolderPlus className="size-5 text-muted-foreground" />
        <Input
          value={newCat}
          onChange={(e) => setNewCat(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submitCat()}
          placeholder="Nouvelle catégorie (ex. Son)…"
          className="h-9 max-w-xs"
        />
        <Button variant="outline" size="sm" onClick={submitCat}>
          Ajouter une catégorie
        </Button>
      </div>
    </div>
  )
}
