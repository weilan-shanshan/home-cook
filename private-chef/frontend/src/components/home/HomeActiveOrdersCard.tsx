import { useNavigate } from 'react-router'
import type { ActiveOrderSummary } from '@/hooks/useHomeSummary'
import { DishThumb } from '@/components/recipe/DishThumb'
import { mealTypeLabel } from '@/lib/order-status'

type Props = { orders: ActiveOrderSummary[] }

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

export function HomeActiveOrdersCard({ orders }: Props) {
  const navigate = useNavigate()
  if (orders.length === 0) return null

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-serif text-lg text-ink-900">进行中的订单</h2>
        <button
          type="button"
          onClick={() => navigate('/orders')}
          className="text-xs text-brand"
        >
          全部 →
        </button>
      </div>
      <ul className="space-y-2">
        {orders.map((o) => {
          const chip = STATUS_CHIP[o.status]
          return (
            <li
              key={o.id}
              className="surface-card p-3 flex items-center gap-3 cursor-pointer"
              onClick={() => navigate(`/orders/${o.id}`)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`rounded-full text-[11px] px-2 py-0.5 ${chip.cls}`}>
                    {chip.label}
                  </span>
                  <span className="text-xs text-ink-500">{relativeTime(o.createdAt)}</span>
                </div>
                <div className="text-sm font-medium text-ink-900 mb-1.5">
                  {mealTypeLabel(o.mealType)} #{o.id}
                </div>
                {/* Dish thumb strip — max 4 */}
                <div className="flex items-center gap-1.5">
                  {o.items.slice(0, 4).map((it) => (
                    <DishThumb
                      key={it.recipeId}
                      id={it.recipeId}
                      name={it.recipeTitle}
                      src={it.image?.thumbUrl ?? it.image?.url ?? undefined}
                      size="sm"
                      rounded="lg"
                    />
                  ))}
                  {o.items.length > 4 && (
                    <span className="text-[11px] text-ink-400">+{o.items.length - 4}</span>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
