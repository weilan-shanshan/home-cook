import { useNavigate } from 'react-router'
import { MessageCircle } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { DishThumb } from '@/components/recipe/DishThumb'
import type { ActiveOrderSummary } from '@/hooks/useHomeSummary'
import { mealTypeLabel } from '@/lib/order-status'

type Props = {
  orders: ActiveOrderSummary[]
  onAccept?: (id: number) => void
}

const STATUS_CHIP: Record<ActiveOrderSummary['status'], { label: string; cls: string }> = {
  submitted: { label: '等你接单', cls: 'bg-brand-100 text-brand-700' },
  confirmed: { label: '已接单',   cls: 'bg-mustard-100 text-mustard-700' },
  preparing: { label: '制作中',   cls: 'bg-mustard-100 text-mustard-700' },
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return '刚刚'
  if (m < 60) return `${m} 分钟前`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} 小时前`
  return `${Math.floor(h / 24)} 天前`
}

export function HomeActiveOrdersCard({ orders, onAccept }: Props) {
  const navigate = useNavigate()
  if (orders.length === 0) return null

  const preview = orders.slice(0, 3)
  const hasMore = orders.length > 3

  return (
    <section>
      <div className="flex items-end justify-between mb-3">
        <h2 className="font-serif text-lg text-ink-900">进行中</h2>
        {hasMore && (
          <button
            type="button"
            onClick={() => navigate('/orders')}
            className="text-xs text-brand"
          >
            查看全部 {orders.length} →
          </button>
        )}
      </div>
      <ul className="space-y-3">
        {preview.map((o) => {
          const chip = STATUS_CHIP[o.status]
          const thumbs = o.items.slice(0, 4)
          const extraThumbs = o.items.length - thumbs.length
          return (
            <li
              key={o.id}
              className="surface-card hover-lift p-4 cursor-pointer"
              onClick={() => navigate(`/orders/${o.id}`)}
            >
              {/* Top row: status + avatar + name + meal + time */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`rounded-full text-[11px] px-2 py-0.5 font-medium ${chip.cls}`}>
                    {chip.label}
                  </span>
                  <Avatar className="w-5 h-5 shrink-0">
                    <AvatarFallback className="bg-brand-100 text-brand-700 text-[10px]">
                      {(o.requester.displayName ?? '?').slice(0, 1)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-ink-700 font-medium">
                    {o.requester.displayName}
                  </span>
                  <span className="text-[11px] text-ink-400">
                    · {mealTypeLabel(o.mealType)} #{o.id}
                  </span>
                </div>
                <span className="text-[11px] text-ink-400 shrink-0">
                  {relativeTime(o.createdAt)}
                </span>
              </div>

              {/* Dish thumb strip — max 4, overflow clipped (no scroll) */}
              <div className="mt-3 flex items-center gap-1.5 overflow-hidden">
                {thumbs.map((it) => (
                  <DishThumb
                    key={it.recipeId}
                    id={it.recipeId}
                    name={it.recipeTitle}
                    src={it.image?.thumbUrl ?? it.image?.url ?? undefined}
                    size="sm"
                    rounded="lg"
                  />
                ))}
                {extraThumbs > 0 && (
                  <span className="text-[11px] text-ink-400">+{extraThumbs}</span>
                )}
              </div>

              {/* Note preview */}
              {o.note && (
                <div className="mt-2 text-xs text-ink-500 truncate flex items-center gap-1">
                  <MessageCircle className="w-3 h-3 shrink-0" />
                  {o.note}
                </div>
              )}

              {/* Bottom action */}
              <div className="mt-3 flex justify-end">
                {o.canAccept ? (
                  <Button
                    variant="inverse"
                    size="sm"
                    className="rounded-full"
                    onClick={(e) => {
                      e.stopPropagation()
                      onAccept?.(o.id)
                    }}
                  >
                    我来接单 →
                  </Button>
                ) : (
                  <button
                    type="button"
                    className="text-xs text-brand"
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/orders/${o.id}`)
                    }}
                  >
                    进入查看 →
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
