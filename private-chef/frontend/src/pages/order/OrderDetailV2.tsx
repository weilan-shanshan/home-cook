import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router'
import { ChevronLeft, Heart, Share2, Loader2, Copy } from 'lucide-react'
import { useOrder, useUpdateOrderStatus } from '@/hooks/useOrders'
import { useToggleOrderLike } from '@/hooks/useOrderInteractions'
import { useCurrentUser } from '@/hooks/useAuth'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { OrderCommentThread } from '@/components/comment/OrderCommentThread'
import { OrderReviewCard } from '@/components/comment/OrderReviewCard'
import { ShareDialog } from '@/components/share/ShareDialog'
import { OrderStatusTimeline } from '@/components/order/OrderStatusTimeline'
import { OrderStatusBadge } from '@/components/order/OrderStatusBadge'
import { OrderActionButton } from '@/components/order/OrderActionButton'
import { OrderItemRow } from '@/components/order/OrderItemRow'
import { STATUS_LABEL, mealTypeLabel } from '@/lib/order-status'

function formatDateTime(iso: string): string {
  const d = new Date(iso.replace(' ', 'T'))
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getMonth() + 1}-${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function OrderDetailV2() {
  const { id } = useParams()
  const orderId = Number(id)
  const navigate = useNavigate()
  const { toast } = useToast()

  const { data: order, isLoading, error } = useOrder(orderId)
  const { data: currentUser } = useCurrentUser()
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateOrderStatus()
  const toggleLike = useToggleOrderLike(orderId)
  const [shareOpen, setShareOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-ink-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        加载中...
      </div>
    )
  }
  if (error || !order) {
    return (
      <div className="p-8 text-center text-rose-500">
        订单加载失败
        <div className="mt-4">
          <Link to="/orders" className="text-brand font-bold">返回订单列表</Link>
        </div>
      </div>
    )
  }

  const isMine = currentUser?.id === order.userId
  const hasCook = order.cook != null
  const isCook = currentUser?.id != null && order.cook?.userId === currentUser.id

  const handleAction = (next: 'confirmed' | 'preparing' | 'completed' | 'cancelled') => {
    updateStatus(
      { id: order.id, status: next },
      {
        onError: (err) => {
          toast({
            title: '状态更新失败',
            description: err instanceof Error ? err.message : '请重试',
            variant: 'destructive',
          })
        },
      },
    )
  }

  const handleLike = () => {
    toggleLike.mutate({ isLikedByMe: order.isLikedByMe })
  }

  const handleReorder = () => {
    const items = order.items.map((it) => ({
      recipe_id: it.recipeId,
      quantity: it.quantity,
      title: it.recipeTitle,
      thumb_url: it.image?.thumbUrl || it.image?.url || null,
    }))
    const params = new URLSearchParams()
    params.set('items', JSON.stringify(items))
    navigate(`/menu/create-order?${params.toString()}`)
  }

  return (
    <div className="space-y-5 pb-32 animate-in fade-in duration-500">
      {/* Top nav */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-cream-100 flex items-center justify-center text-ink-900"
          aria-label="返回"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-extrabold">
            {mealTypeLabel(order.mealType)} #{order.id}
          </h1>
          <p className="text-[11px] text-ink-500">
            {formatDateTime(order.createdAt)} · {order.requester.displayName} 点单
          </p>
        </div>
      </div>

      {/* Status hero card */}
      <div className="bg-gradient-to-br from-brand-50 to-cream-100 rounded-3xl p-5 border border-cream-300">
        <p className="text-xs text-ink-500 mb-2">订单状态</p>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl font-extrabold text-brand-700">
            {STATUS_LABEL[order.status]}
          </span>
          <span className="ml-auto">
            <OrderStatusBadge status={order.status} />
          </span>
        </div>
        <OrderStatusTimeline status={order.status} />
        <div className="mt-4">
          <OrderActionButton
            status={order.status}
            isMine={isMine}
            hasCook={hasCook}
            isCook={!!isCook}
            onAction={handleAction}
            isPending={isUpdating}
            variant="wide"
          />
        </div>
      </div>

      {/* Items */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-ink-500 mb-2">
          {order.items.length} 道菜
        </h2>
        <div className="bg-white rounded-3xl border border-cream-300 divide-y divide-cream-300 px-4">
          {order.items.map((item) => (
            <OrderItemRow
              key={item.id}
              item={{
                recipeId: item.recipeId,
                recipeTitle: item.recipeTitle,
                quantity: item.quantity,
                image: item.image,
              }}
            />
          ))}
        </div>
        {order.note && (
          <div className="mt-3 bg-amber-100 text-ink-800 rounded-2xl px-4 py-3 text-sm">
            <span className="font-bold mr-1">备注:</span>
            {order.note}
          </div>
        )}
      </div>

      {/* Review (completed only) */}
      {order.status === 'completed' && <OrderReviewCard orderId={order.id} />}

      {/* Comments */}
      <OrderCommentThread orderId={order.id} />

      {/* Sticky bottom action row */}
      <div
        className="fixed left-0 right-0 z-30 px-4 py-3 bg-white/95 backdrop-blur border-t border-cream-300 max-w-md mx-auto flex items-center gap-2"
        style={{ bottom: 'var(--app-tabbar-height, 4rem)' }}
      >
        <Button
          type="button"
          variant={order.isLikedByMe ? 'default' : 'outline'}
          onClick={handleLike}
          disabled={toggleLike.isPending}
          className="flex-1 gap-2"
          aria-pressed={order.isLikedByMe}
        >
          <Heart
            className={
              order.isLikedByMe
                ? 'w-4 h-4 fill-white text-white'
                : 'w-4 h-4 text-ink-500'
            }
          />
          {order.likeCount > 0 ? `赞 ${order.likeCount}` : '点赞'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setShareOpen(true)}
          className="flex-1 gap-2"
        >
          <Share2 className="w-4 h-4" />
          {order.shareCount > 0 ? `分享 ${order.shareCount}` : '分享'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleReorder}
          className="flex-1 gap-2"
        >
          <Copy className="w-4 h-4" />
          再来一单
        </Button>
      </div>

      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        title="分享这份订单"
        shareCardEndpoint={`/api/orders/${orderId}/share-card`}
        shareActionEndpoint={`/api/orders/${orderId}/share`}
        invalidateKeys={[['order', orderId]]}
      />
    </div>
  )
}
