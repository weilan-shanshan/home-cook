import { Link } from 'react-router'
import { cn } from '@/lib/utils'
import { Utensils } from 'lucide-react'
import { OrderStatusBadge } from './OrderStatusBadge'
import { OrderActionButton } from './OrderActionButton'
import { ACTIVE_STATUSES, mealTypeLabel } from '@/lib/order-status'
import type { OrderStatus } from '@/hooks/useOrders'

export interface OrderCardData {
  id: number
  status: OrderStatus
  mealType: string
  mealDate: string
  createdAt: string
  isMine: boolean
  hasCook: boolean
  cookDisplayName: string | null
  requesterDisplayName: string
  items: Array<{
    recipeId: number
    recipeTitle: string
    image: { thumbUrl: string | null; url: string } | null
  }>
}

interface Props {
  order: OrderCardData
  currentUserId: number | null
  mode: 'compact' | 'default'
  onAction: (orderId: number, next: 'confirmed' | 'preparing' | 'completed' | 'cancelled') => void
  isPending: boolean
  className?: string
}

function formatRelativeTime(iso: string): string {
  const ts = new Date(iso.replace(' ', 'T')).getTime()
  const diffMin = Math.floor((Date.now() - ts) / 60000)
  if (diffMin < 1) return '刚刚'
  if (diffMin < 60) return `${diffMin} 分钟前`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH} 小时前`
  return new Date(ts).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

export function OrderCard({
  order,
  currentUserId,
  mode,
  onAction,
  isPending,
  className,
}: Props) {
  const isActive = ACTIVE_STATUSES.has(order.status)
  // We don't carry cookUserId in OrderCardData; gate isCook only when name is present.
  const isCook = !!currentUserId && order.cookDisplayName != null

  const showThumbnails = mode === 'default' && order.items.length > 0
  const previewItems = order.items.slice(0, 4)
  const remaining = Math.max(order.items.length - previewItems.length, 0)

  return (
    <div
      className={cn(
        'bg-white rounded-3xl p-4 transition-shadow',
        isActive ? 'border-2 border-brand-200 shadow-card' : 'border border-cream-300 opacity-90',
        className,
      )}
    >
      <div className="flex items-center justify-between mb-2.5 gap-2">
        <OrderStatusBadge status={order.status} />
        <span className="text-[10px] text-ink-500">{formatRelativeTime(order.createdAt)}</span>
      </div>

      <Link to={`/orders/${order.id}`} className="block">
        <p className="font-extrabold text-base mb-1 text-ink-900">
          {mealTypeLabel(order.mealType)} #{order.id}
        </p>
        <p className="text-xs text-ink-500 mb-3">
          {order.isMine ? '我' : order.requesterDisplayName} 点单
          {order.hasCook ? (
            <>
              <span className="mx-1.5 text-ink-400">·</span>
              {order.cookDisplayName ?? '已被接'} 掌勺
            </>
          ) : (
            <span className="ml-1.5 text-brand font-semibold">尚无大厨</span>
          )}
        </p>

        {showThumbnails && (
          <div className="flex gap-2 mb-3" data-test="order-thumbnails">
            {previewItems.map((item) => (
              <div
                key={item.recipeId}
                className="w-12 h-12 rounded-xl bg-cream-100 overflow-hidden flex items-center justify-center flex-none"
              >
                {item.image ? (
                  <img
                    src={item.image.thumbUrl || item.image.url}
                    alt={item.recipeTitle}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Utensils className="w-5 h-5 text-cream-400" />
                )}
              </div>
            ))}
            {remaining > 0 && (
              <div className="w-12 h-12 rounded-xl bg-cream-100 border border-dashed border-cream-400 flex items-center justify-center text-[10px] font-bold text-ink-500 flex-none">
                +{remaining}
              </div>
            )}
          </div>
        )}
      </Link>

      <OrderActionButton
        status={order.status}
        isMine={order.isMine}
        hasCook={order.hasCook}
        isCook={isCook}
        onAction={(next) => onAction(order.id, next)}
        isPending={isPending}
        variant="wide"
      />
    </div>
  )
}
