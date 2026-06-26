import { useEffect, useRef, useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SHOT_VISUELS } from './shotList.data'
import { resolveShot } from './shotList.utils'

interface ShotMultiSelectProps {
  /** Plan ids sélectionnés. */
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
}

export function ShotMultiSelect({
  value,
  onChange,
  placeholder = 'Choisir des plans…',
}: ShotMultiSelectProps) {
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

  const toggle = (planId: string) => {
    onChange(value.includes(planId) ? value.filter((v) => v !== planId) : [...value, planId])
  }

  const remove = (planId: string) => onChange(value.filter((v) => v !== planId))

  return (
    <div ref={rootRef} className="relative space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((planId) => {
            const resolved = resolveShot(planId)
            return (
              <span
                key={planId}
                className="inline-flex items-center gap-1 rounded-lg bg-accent px-2 py-1 text-xs font-semibold text-accent-foreground"
              >
                {resolved ? `${resolved.visuel.name} · ${resolved.plan.label}` : planId}
                <button
                  type="button"
                  onClick={() => remove(planId)}
                  className="-mr-1 flex size-5 items-center justify-center rounded opacity-70 hover:opacity-100"
                  aria-label="Retirer le plan"
                >
                  <X className="size-3.5" />
                </button>
              </span>
            )
          })}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-full items-center justify-between rounded-lg border border-input bg-card px-3 text-sm text-muted-foreground shadow-sm"
      >
        <span>{value.length ? `${value.length} plan(s) sélectionné(s)` : placeholder}</span>
        <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-border bg-card text-foreground shadow-xl">
          {SHOT_VISUELS.map((visuel) => (
            <div key={visuel.id} className="py-1">
              <div className="sticky top-0 bg-card px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                {visuel.name}
              </div>
              <ul>
                {visuel.plans.map((plan) => {
                  const checked = value.includes(plan.id)
                  return (
                    <li key={plan.id}>
                      <button
                        type="button"
                        onClick={() => toggle(plan.id)}
                        className={cn(
                          'flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-muted',
                          checked && 'bg-muted font-semibold',
                        )}
                      >
                        <span
                          className={cn(
                            'flex size-4 shrink-0 items-center justify-center rounded border',
                            checked
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border',
                          )}
                          aria-hidden
                        >
                          {checked ? '✓' : ''}
                        </span>
                        {plan.label}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
