import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { OrderColorChips } from '@/components/order/OrderColorChips'

export type PendingOrder = {
  id: string | number
  title: string           // e.g. "晚餐 · 红烧肉 · 清蒸鱼"
  meta: string            // e.g. "爸 点单 · 尚无大厨"
  waitedLabel: string     // e.g. "2 分钟前"
  items: { id: string | number; name?: string }[]
}

type Props = {
  order: PendingOrder | null | undefined
  onAccept: (id: string | number) => void
  accepting?: boolean
}

export function HomePendingOrderCard({ order, onAccept, accepting }: Props) {
  const navigate = useNavigate()
  if (!order) return null
  return (
    <section
      className="surface-card p-4 cursor-pointer"
      onClick={() => navigate(`/orders/${order.id}`)}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="rounded-full bg-brand-100 text-brand-700 text-xs px-2.5 py-1">谁来做</span>
        <span className="text-xs text-ink-500">{order.waitedLabel}</span>
      </div>
      <div className="font-medium text-ink-900">{order.title}</div>
      <div className="text-xs text-ink-500 mb-3">{order.meta}</div>
      <OrderColorChips items={order.items} className="mb-4" />
      <Button
        type="button"
        variant="inverse"
        className="w-full"
        disabled={accepting}
        onClick={(e) => { e.stopPropagation(); onAccept(order.id) }}
      >
        {accepting ? '处理中…' : '我来做'}
      </Button>
    </section>
  )
}
