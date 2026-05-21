import { cn } from '@/lib/utils'

export type OrderStatus = 'placed' | 'accepted' | 'cooking' | 'done'

const STEPS: { key: OrderStatus; label: string }[] = [
  { key: 'placed', label: '已下单' },
  { key: 'accepted', label: '已接单' },
  { key: 'cooking', label: '制作中' },
  { key: 'done', label: '已完成' },
]

const ORDER: OrderStatus[] = ['placed', 'accepted', 'cooking', 'done']

type Props = { current: OrderStatus; className?: string }

export function StatusStepBar({ current, className }: Props) {
  const currentIdx = ORDER.indexOf(current)
  return (
    <div className={cn('flex items-center justify-between gap-2', className)}>
      {STEPS.map((s, i) => {
        const reached = i <= currentIdx
        return (
          <div key={s.key} className="flex-1 flex flex-col items-center gap-1.5">
            <div
              className={cn(
                'h-1.5 rounded-full w-full',
                reached ? 'bg-brand' : 'bg-cream-200',
              )}
            />
            <span className={cn('text-[11px]', reached ? 'text-ink-900 font-medium' : 'text-ink-400')}>
              {s.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
