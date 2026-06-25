import { useEffect, useRef, useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EntityMultiSelectProps {
  options: string[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  tone?: 'people' | 'gear' | 'vehicle'
}

const toneClass = {
  people: 'bg-primary/15 text-primary',
  gear: 'bg-accent text-accent-foreground',
  vehicle: 'bg-secondary text-secondary-foreground',
} as const

export function EntityMultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Sélectionner…',
  tone = 'gear',
}: EntityMultiSelectProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
    }
  }, [open])

  const sortedOptions = [...new Set(options)].sort((a, b) => a.localeCompare(b, 'fr'))
  const orphanValues = value.filter((v) => !sortedOptions.includes(v))

  const toggle = (item: string) => {
    onChange(value.includes(item) ? value.filter((v) => v !== item) : [...value, item])
  }

  const remove = (item: string) => onChange(value.filter((v) => v !== item))

  return (
    <div ref={rootRef} className="relative space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((item) => (
            <span
              key={item}
              className={cn(
                'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold',
                toneClass[tone],
              )}
            >
              {item}
              <button
                type="button"
                onClick={() => remove(item)}
                className="-mr-1 flex size-5 items-center justify-center rounded opacity-70 hover:opacity-100"
                aria-label={`Retirer ${item}`}
              >
                <X className="size-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-full items-center justify-between rounded-lg border border-input bg-card px-3 text-sm text-muted-foreground shadow-sm"
      >
        <span>{value.length ? `${value.length} sélectionné(s)` : placeholder}</span>
        <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-border bg-card text-foreground shadow-xl">
          {sortedOptions.length === 0 && orphanValues.length === 0 && (
            <p className="px-3 py-2 text-sm text-muted-foreground">Aucune option disponible.</p>
          )}
          <ul className="py-1">
            {sortedOptions.map((opt) => {
              const checked = value.includes(opt)
              return (
                <li key={opt}>
                  <button
                    type="button"
                    onClick={() => toggle(opt)}
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-muted',
                      checked && 'bg-muted font-semibold',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-4 shrink-0 items-center justify-center rounded border',
                        checked ? 'border-primary bg-primary text-primary-foreground' : 'border-border',
                      )}
                      aria-hidden
                    >
                      {checked ? '✓' : ''}
                    </span>
                    {opt}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
