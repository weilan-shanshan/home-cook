import { TIMELINE_STAGES, STAGE_LABEL, statusToTimelineIndex } from '@/lib/order-status'
import type { OrderStatus } from '@/hooks/useOrders'
import { cn } from '@/lib/utils'

interface Props {
  status: OrderStatus
  className?: string
}

export function OrderStatusTimeline({ status, className }: Props) {
  const currentIdx = statusToTimelineIndex(status)

  if (currentIdx === -1) {
    return (
      <div
        className={cn(
          'rounded-2xl bg-rose-100 px-3 py-2 text-rose-500 text-sm font-bold',
          className,
        )}
      >
        订单已取消
      </div>
    )
  }

  return (
    <div className={className}>
      <div
        className="flex items-center gap-1 mb-2"
        role="progressbar"
        aria-label="订单进度"
        aria-valuenow={currentIdx + 1}
        aria-valuemin={1}
        aria-valuemax={TIMELINE_STAGES.length}
      >
        {TIMELINE_STAGES.map((_, idx) => (
          <div
            key={idx}
            className={cn(
              'flex-1 h-1.5 rounded-full transition-colors',
              idx <= currentIdx ? 'bg-brand' : 'bg-cream-300',
            )}
          />
        ))}
      </div>
      <div className="flex justify-between text-[10px] font-semibold">
        {TIMELINE_STAGES.map((stage, idx) => (
          <span
            key={stage}
            className={idx === currentIdx ? 'text-brand-700' : 'text-ink-500'}
          >
            {STAGE_LABEL[stage]}
          </span>
        ))}
      </div>
    </div>
  )
}
