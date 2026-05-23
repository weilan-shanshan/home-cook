import { cn } from '@/lib/utils'

export type ChipOption = { value: string; label: string; count?: number }

type Props = {
  options: ChipOption[]
  value: string | string[]
  multiple?: boolean
  onChange: (next: string | string[]) => void
  className?: string
}

export function ChipGroup({ options, value, multiple, onChange, className }: Props) {
  const isActive = (v: string) =>
    multiple ? (value as string[]).includes(v) : value === v

  const handle = (v: string) => {
    if (!multiple) return onChange(v)
    const arr = new Set(value as string[])
    if (arr.has(v)) arr.delete(v)
    else arr.add(v)
    onChange(Array.from(arr))
  }

  return (
    <div
      role="group"
      className={cn(
        'flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4',
        className,
      )}
    >
      {options.map((o) => {
        const active = isActive(o.value)
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => handle(o.value)}
            className={cn(
              'shrink-0 inline-flex items-center gap-1 rounded-full transition-all cursor-pointer',
              active
                ? 'h-9 px-4 text-sm font-bold bg-brand text-white shadow-button ring-2 ring-brand-400/40 scale-105'
                : 'h-8 px-3.5 text-sm font-medium bg-cream-100 text-ink-700 hover:bg-cream-200',
            )}
            aria-pressed={active}
          >
            {o.label}
            {typeof o.count === 'number' && (
              <span
                className={cn(
                  'ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full px-1 text-[11px]',
                  active ? 'bg-white/25 text-white font-semibold' : 'bg-cream-300 text-ink-700',
                )}
              >
                {o.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
