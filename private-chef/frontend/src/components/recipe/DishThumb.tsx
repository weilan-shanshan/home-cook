import { cn } from '@/lib/utils'
import { dishColor } from '@/lib/dish-color'

type Props = {
  id?: string | number
  name?: string
  src?: string | null
  size?: 'sm' | 'md' | 'lg'
  rounded?: 'lg' | '2xl' | '3xl'
  className?: string
}

const sizeClass = { sm: 'w-12 h-12 text-xs', md: 'w-16 h-16 text-sm', lg: 'w-20 h-20 text-base' }
const roundClass = { lg: 'rounded-lg', '2xl': 'rounded-2xl', '3xl': 'rounded-3xl' }

export function DishThumb({ id, name, src, size = 'md', rounded = '2xl', className }: Props) {
  const c = dishColor(id ?? name)
  if (src) {
    return (
      <img
        src={src}
        alt={name ?? ''}
        className={cn('object-cover', sizeClass[size], roundClass[rounded], className)}
      />
    )
  }
  return (
    <div
      className={cn(
        'relative overflow-hidden flex items-center justify-center font-medium',
        c.bg,
        c.text,
        sizeClass[size],
        roundClass[rounded],
        className,
      )}
      aria-label={name}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/8" aria-hidden />
      {name?.[0] ?? ''}
    </div>
  )
}
