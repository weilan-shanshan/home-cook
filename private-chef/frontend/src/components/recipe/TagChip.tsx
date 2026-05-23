import { cn } from '@/lib/utils'

type Size = 'xs' | 'sm'

interface Props {
  name: string
  size?: Size
  className?: string
}

const SIZE_CLASSES: Record<Size, string> = {
  xs: 'text-[11px] px-2.5 py-1 leading-[14px]',
  sm: 'text-[12px] px-3 py-1 leading-4',
}

const BASE_CHIP =
  'inline-flex items-center rounded-full font-semibold tracking-wide whitespace-nowrap bg-white/85 backdrop-blur-sm shadow-[0_1px_3px_rgba(0,0,0,0.12)] ring-1 ring-white/50'

/**
 * Translucent white pill with the brand sage-green text.
 * Designed for laying over dish images.
 */
export function TagChip({ name, size = 'xs', className }: Props) {
  return (
    <span className={cn(BASE_CHIP, 'text-brand-700', SIZE_CLASSES[size], className)}>
      {name}
    </span>
  )
}

/**
 * Overflow indicator used when only a subset of tags is rendered.
 */
export function TagOverflowChip({ count, size = 'xs' }: { count: number; size?: Size }) {
  return (
    <span className={cn(BASE_CHIP, 'text-ink-500', SIZE_CLASSES[size])}>
      +{count}
    </span>
  )
}
