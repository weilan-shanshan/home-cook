import { cn } from '@/lib/utils'
import { dishColor } from '@/lib/dish-color'

type Props = {
  id?: string | number
  name?: string
  src?: string | null
  /**
   * `fill` lets the parent control sizing (use with an `aspect-square` wrapper).
   * Fixed sizes are for inline thumbnails where the container has no defined dims.
   */
  size?: 'sm' | 'md' | 'lg' | 'fill'
  rounded?: 'lg' | '2xl' | '3xl'
  className?: string
}

const sizeClass = {
  sm: 'w-12 h-12 text-xs',
  md: 'w-16 h-16 text-sm',
  lg: 'w-20 h-20 text-base',
  // fill 模式：脱离文档流，让父容器的 aspect-square / 固定尺寸真正决定大小。
  // 不脱流的话，img 的 intrinsic 比例会撑高父容器，aspect-ratio 失效。
  // 调用方必须给父容器加 `relative`（所有调用点已具备）。
  fill: 'absolute inset-0 w-full h-full text-base',
}
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
      className={cn(c.bg, sizeClass[size], roundClass[rounded], className)}
      aria-label={name}
    />
  )
}
