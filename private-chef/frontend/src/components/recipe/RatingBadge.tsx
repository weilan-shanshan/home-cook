import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  avg?: number | null
  count?: number | null
  size?: 'xs' | 'sm'
  variant?: 'solid' | 'ghost'
  className?: string
}

export function RatingBadge({ avg, count, size = 'xs', variant = 'ghost', className }: Props) {
  if (avg == null) return null
  const sizeCls = size === 'sm' ? 'text-xs h-6 px-2' : 'text-[11px] h-5 px-1.5'
  const cls = variant === 'solid'
    ? 'bg-honey-300 text-ink-900'
    : 'bg-cream-100 text-ink-700'
  return (
    <span className={cn('inline-flex items-center gap-0.5 rounded-full', sizeCls, cls, className)}>
      <Star className="w-3 h-3 fill-current text-honey-500" strokeWidth={0} />
      <span className="font-medium">{avg.toFixed(1)}</span>
      {typeof count === 'number' && count > 0 && (
        <span className="text-ink-500 ml-0.5">({count})</span>
      )}
    </span>
  )
}
