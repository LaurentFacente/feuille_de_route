import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TagEditorProps {
  items: string[]
  onChange: (items: string[]) => void
  placeholder?: string
  tone?: 'people' | 'gear'
}

export function TagEditor({ items, onChange, placeholder = 'Ajouter…', tone = 'gear' }: TagEditorProps) {
  const [draft, setDraft] = useState('')

  const add = () => {
    const v = draft.trim()
    if (!v) return
    onChange([...items, v])
    setDraft('')
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {items.map((item, i) => (
        <span
          key={`${item}-${i}`}
          className={cn(
            'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold',
            tone === 'people' ? 'bg-primary/15 text-primary' : 'bg-accent text-accent-foreground',
          )}
        >
          {item}
          <button
            onClick={() => onChange(items.filter((_, idx) => idx !== i))}
            className="-mr-1 flex size-5 items-center justify-center rounded opacity-70 hover:opacity-100"
            aria-label={`Retirer ${item}`}
          >
            <X className="size-3.5" />
          </button>
        </span>
      ))}
      <span className="inline-flex items-center gap-1 rounded-lg border border-dashed border-border px-1.5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder={placeholder}
          className="h-7 w-24 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
        />
        <button onClick={add} className="text-muted-foreground hover:text-primary" aria-label="Ajouter">
          <Plus className="size-3.5" />
        </button>
      </span>
    </div>
  )
}
