import { cn } from '@/lib/utils'
import { dishColor } from '@/lib/dish-color'

type Item = { id: string | number; name?: string }

type Props = {
  items: Item[]
  max?: number
  className?: string
}

export function OrderColorChips({ items, max = 4, className }: Props) {
  const shown = items.slice(0, max)
  const rest = items.length - shown.length
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {shown.map((it) => {
        const c = dishColor(it.id ?? it.name)
        return (
          <div
            key={it.id}
            className={cn('w-10 h-10 rounded-2xl', c.bg)}
            aria-label={it.name}
          />
        )
      })}
      {rest > 0 && (
        <div className="w-10 h-10 rounded-2xl bg-cream-200 text-ink-700 text-xs flex items-center justify-center">
          +{rest}
        </div>
      )}
    </div>
  )
}
