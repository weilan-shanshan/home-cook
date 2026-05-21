import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { ArrowLeft, Send, Loader2 } from 'lucide-react'
import { useOrder, useUpdateOrderStatus } from '@/hooks/useOrders'
import { useCurrentUser } from '@/hooks/useAuth'
import { useOrderComments, useCreateOrderComment } from '@/hooks/useOrderInteractions'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { StatusStepBar, type OrderStatus as StepStatus } from '@/components/order/StatusStepBar'
import { DishThumb } from '@/components/recipe/DishThumb'
import { mealTypeLabel, nextActionFor } from '@/lib/order-status'
import type { OrderStatus } from '@/hooks/useOrders'

// ─── helpers ────────────────────────────────────────────────────────────────

function mapStepStatus(s: OrderStatus): StepStatus {
  switch (s) {
    case 'pending':
    case 'submitted':
      return 'placed'
    case 'confirmed':
      return 'accepted'
    case 'preparing':
      return 'cooking'
    case 'completed':
    case 'cancelled':
      return 'done'
  }
}

function headlineFor(s: OrderStatus): string {
  switch (s) {
    case 'pending':
    case 'submitted':
      return '等家人来做'
    case 'confirmed':
      return '已经开始啦'
    case 'preparing':
      return '正在做'
    case 'completed':
      return '做好啦 🎉'
    case 'cancelled':
      return '这次先不做了'
  }
}

function statusBadge(s: OrderStatus): string {
  switch (s) {
    case 'pending':
    case 'submitted':
      return '等接手'
    case 'confirmed':
      return '正在做'
    case 'preparing':
      return '正在做'
    case 'completed':
      return '做好了'
    case 'cancelled':
      return '已取消'
  }
}

function relativeTime(iso: string): string {
  const now = Date.now()
  const ts = new Date(iso.replace(' ', 'T')).getTime()
  const diff = Math.floor((now - ts) / 1000)
  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`
  return `${Math.floor(diff / 86400)} 天前`
}

// ─── component ───────────────────────────────────────────────────────────────

export default function OrderDetailV2() {
  const { id } = useParams()
  const orderId = Number(id)
  const navigate = useNavigate()
  const { toast } = useToast()

  const { data: order, isLoading, error } = useOrder(orderId)
  const { data: currentUser } = useCurrentUser()
  const { data: comments = [] } = useOrderComments(orderId)
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateOrderStatus()
  const { mutateAsync: addComment, isPending: isSending } = useCreateOrderComment(orderId)

  const [note, setNote] = useState('')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-ink-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        加载中…
      </div>
    )
  }
  if (error || !order) {
    return (
      <div className="p-8 text-center text-rose-500">
        订单加载失败
      </div>
    )
  }

  const isMine = currentUser?.id === order.userId
  const hasCook = order.cook != null
  const isCook = currentUser?.id != null && order.cook?.userId === currentUser.id

  const action = nextActionFor({ status: order.status, isMine, hasCook, isCook })

  const handleAction = () => {
    if (!action) return
    updateStatus(
      { id: order.id, status: action.next },
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

  const handleSend = async () => {
    const text = note.trim()
    if (!text) return
    try {
      await addComment({ content: text, roleType: 'member' })
      setNote('')
    } catch (err) {
      toast({
        title: '发送失败',
        description: err instanceof Error ? err.message : '请重试',
        variant: 'destructive',
      })
    }
  }

  const stepStatus = mapStepStatus(order.status)
  const headline = headlineFor(order.status)
  const badge = statusBadge(order.status)
  const isCancelled = order.status === 'cancelled'

  return (
    <main className="space-y-4 pb-28 animate-in fade-in duration-500">
      {/* ── Header ── */}
      <header className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="返回"
          className="w-9 h-9 rounded-full bg-cream-100 flex items-center justify-center cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 text-ink-700" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="font-serif text-xl text-ink-900 leading-tight">
            {mealTypeLabel(order.mealType)} #{order.id}
          </div>
          <div className="text-xs text-ink-500 mt-0.5">
            {order.requester.displayName} 想吃
          </div>
        </div>
      </header>

      {/* ── Status hero card ── */}
      <section className="rounded-3xl bg-brand-100 border border-brand-100 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-ink-500">现在进度</span>
          <span
            className={
              isCancelled
                ? 'rounded-full bg-ink-300 text-ink-700 text-xs px-2.5 py-1'
                : 'rounded-full bg-brand text-white text-xs px-2.5 py-1'
            }
          >
            {badge}
          </span>
        </div>

        <h2 className="font-serif text-3xl text-brand leading-tight">{headline}</h2>

        {!isCancelled && <StatusStepBar current={stepStatus} />}

        {isCancelled && (
          <div className="rounded-2xl bg-cream-100 px-3 py-2 text-ink-500 text-sm">
            这次先不做了
          </div>
        )}

        {action && (
          <Button
            variant="default"
            className="w-full rounded-full"
            onClick={handleAction}
            disabled={isUpdating}
          >
            {action.label} →
          </Button>
        )}
      </section>

      {/* ── Dishes card ── */}
      <section className="surface-card p-4">
        <div className="text-sm text-ink-500 mb-3">{order.items.length} 道菜</div>
        <ul className="space-y-3">
          {order.items.map((it) => {
            const src = it.image?.thumbUrl ?? it.image?.url ?? undefined
            const isCompleted = order.status === 'completed'
            return (
              <li key={it.id} className="flex items-center gap-3">
                <DishThumb
                  id={it.recipeId}
                  name={it.recipeTitle}
                  src={src}
                  size="md"
                  rounded="2xl"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-medium text-ink-900 truncate">{it.recipeTitle}</span>
                    <span className="text-xs text-ink-500 shrink-0">× {it.quantity}</span>
                  </div>
                  <div className="text-[11px] text-ink-500">家常</div>
                </div>
                {isCompleted && (
                  <a
                    href={`/recipe/${it.recipeId}#comments`}
                    onClick={(e) => { e.stopPropagation() }}
                    className="text-[11px] text-honey-700 shrink-0 hover:underline"
                  >
                    夸夸厨师 →
                  </a>
                )}
              </li>
            )
          })}
        </ul>
        {order.note && (
          <div className="mt-4 rounded-2xl bg-honey-100 border border-honey-300/50 px-3 py-2 text-sm text-ink-800">
            <span className="font-medium mr-1">备注:</span>
            {order.note}
          </div>
        )}
      </section>

      {/* ── Notes / Comments card ── */}
      <section className="surface-card p-4">
        <div className="text-sm text-ink-500 mb-3">家人留言 {comments.length} 条</div>
        {comments.length === 0 ? (
          <p className="text-sm text-ink-400 text-center py-2">还没有留言</p>
        ) : (
          <ul className="space-y-3">
            {comments.map((c) => (
              <li key={c.id} className="flex items-start gap-3">
                <Avatar className="w-7 h-7 flex-none">
                  <AvatarFallback className="bg-brand-100 text-brand text-xs">
                    {(c.display_name ?? '?').slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-ink-500 flex items-center gap-1.5 flex-wrap">
                    <span className="rounded-full bg-cream-100 px-2 py-0.5 text-ink-700">
                      {c.display_name ?? '用户'}
                      {c.role_type === 'cook' && (
                        <span className="ml-1 text-brand">厨师</span>
                      )}
                    </span>
                    <span>{relativeTime(c.created_at)}</span>
                  </div>
                  <div className="text-sm text-ink-900 mt-1 leading-relaxed">{c.content}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Fixed bottom note input ── */}
      <div
        className="fixed left-1/2 -translate-x-1/2 w-full max-w-[28rem] px-4 pt-3 pb-3 bg-cream-50/95 backdrop-blur border-t border-cream-200 flex items-center gap-2 z-30"
        style={{ bottom: 'calc(var(--app-tabbar-height) + env(safe-area-inset-bottom))' }}
      >
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void handleSend()
            }
          }}
          placeholder="想说点什么…"
          className="flex-1 h-11 rounded-full bg-cream-100 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
        />
        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={isSending || !note.trim()}
          aria-label="发送备注"
          className="w-11 h-11 rounded-full bg-brand text-white flex items-center justify-center cursor-pointer disabled:opacity-40 transition-opacity"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </main>
  )
}
