import { useNavigate } from 'react-router'
import { MessageCircle, ChevronRight } from 'lucide-react'
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
  submitted: { label: '谁来做', cls: 'bg-brand-100 text-brand-700' },
  confirmed: { label: '已接手',  cls: 'bg-honey-100 text-honey-700' },
  preparing: { label: '正在做',  cls: 'bg-honey-100 text-honey-700' },
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
        <h2 className="font-serif text-lg text-ink-900">正在做</h2>
        {hasMore && (
          <button
            type="button"
            onClick={() => navigate('/orders')}
            aria-label="查看全部"
            className="w-7 h-7 rounded-full surface-card flex items-center justify-center text-ink-500 hover:text-ink-700 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
      <ul className="space-y-3">
        {preview.map((o) => {
          const chip = STATUS_CHIP[o.status]
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

              {/* Dish thumb grid — 4-col, fills card width */}
              {o.items && o.items.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mb-3 mt-3">
                  {o.items.slice(0, 4).map((it) => (
                    <div key={it.recipeId} className="flex flex-col gap-1">
                      <div className="relative aspect-square w-full">
                        <DishThumb
                          id={it.recipeId}
                          name={it.recipeTitle}
                          src={it.image?.thumbUrl ?? it.image?.url ?? undefined}
                          size="fill"
                          rounded="lg"
                        />
                      </div>
                      <div className="text-[10px] text-ink-700 truncate">
                        {it.recipeTitle}
                      </div>
                    </div>
                  ))}
                  {o.items.length > 4 && (
                    <div className="flex flex-col gap-1">
                      <div className="w-full aspect-square rounded-lg bg-cream-200 flex items-center justify-center text-[10px] text-ink-500">
                        +{o.items.length - 4}
                      </div>
                    </div>
                  )}
                </div>
              )}

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
                    我来做 →
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
                    去看看 →
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
