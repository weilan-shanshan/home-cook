import { useNavigate } from 'react-router'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DishThumb } from '@/components/recipe/DishThumb'
import { RatingBadge } from '@/components/recipe/RatingBadge'

export type OrderCardItem = {
  id: string | number
  recipeId?: string | number
  name?: string
  cover?: string | null
  quantity?: number
  avgRating?: number | null
  ratingCount?: number | null
  favorited?: boolean
  durationMin?: number | null
}

export type OrderCardData = {
  id: string | number
  no: string
  meta: string
  agoLabel: string
  status: 'pending' | 'cooking' | 'done'
  items: OrderCardItem[]
  primaryActionLabel?: string
  onPrimary?: () => void
  onToggleFavorite?: (item: OrderCardItem) => void
  primaryDisabled?: boolean
}

const STATUS_CHIP: Record<OrderCardData['status'], { label: string; cls: string }> = {
  pending: { label: '等你接单', cls: 'bg-brand-100 text-brand-700' },
  cooking: { label: '制作中',   cls: 'bg-mustard-100 text-mustard-700' },
  done:    { label: '已完成',   cls: 'bg-sage-100 text-sage-700' },
}

export function OrderCard(props: OrderCardData) {
  const navigate = useNavigate()
  const chip = STATUS_CHIP[props.status]
  const defaultLabel =
    props.status === 'pending' ? '我来接单' : props.status === 'cooking' ? '出锅完成 ✓' : '已完成'
  const label = props.primaryActionLabel ?? defaultLabel
  const totalCount = props.items.reduce((s, i) => s + (i.quantity ?? 1), 0)
  const previewItems = props.items.slice(0, 3)
  const extraDishCount = props.items.length - previewItems.length

  return (
    <article
      className="surface-card p-4 cursor-pointer"
      onClick={() => navigate(`/orders/${props.id}`)}
    >
      <div className="flex items-center justify-between">
        <span className={`rounded-full text-xs px-2.5 py-1 ${chip.cls}`}>{chip.label}</span>
        <span className="text-xs text-ink-500">{props.agoLabel}</span>
      </div>
      <div className="mt-2 font-medium text-ink-900">{props.no}</div>
      <div className="text-xs text-ink-500 mb-3">{props.meta}</div>

      <ul className="space-y-2 mb-3">
        {previewItems.map((it) => (
          <li key={it.id} className="flex items-center gap-3">
            <DishThumb
              id={it.recipeId ?? it.id}
              name={it.name}
              src={it.cover ?? undefined}
              size="sm"
              rounded="lg"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm text-ink-900 truncate">{it.name ?? `菜品 #${it.id}`}</span>
                {it.avgRating != null && (
                  <RatingBadge avg={it.avgRating} count={it.ratingCount ?? null} />
                )}
              </div>
              {it.durationMin != null && (
                <div className="text-[11px] text-ink-400">{it.durationMin} min</div>
              )}
            </div>
            {props.onToggleFavorite && (
              <button
                type="button"
                aria-label={it.favorited ? '取消收藏' : '收藏'}
                onClick={(e) => { e.stopPropagation(); props.onToggleFavorite?.(it) }}
                className="w-7 h-7 rounded-full flex items-center justify-center text-brand cursor-pointer hover:bg-cream-100"
              >
                <Heart className={`w-3.5 h-3.5 ${it.favorited ? 'fill-current' : ''}`} />
              </button>
            )}
            {(it.quantity ?? 1) > 1 && (
              <span className="text-xs text-ink-500 shrink-0">× {it.quantity}</span>
            )}
          </li>
        ))}
        {extraDishCount > 0 && (
          <li className="text-[11px] text-ink-400">还有 {extraDishCount} 道菜…</li>
        )}
      </ul>
      <div className="text-[11px] text-ink-400 mb-3">一共 {totalCount} 份</div>

      {props.status !== 'done' ? (
        <Button
          variant={props.status === 'pending' ? 'inverse' : 'default'}
          size="lg"
          className="w-full"
          disabled={props.primaryDisabled}
          onClick={(e) => { e.stopPropagation(); props.onPrimary?.() }}
        >
          {label}
        </Button>
      ) : (
        <div className="rounded-full bg-cream-100 text-ink-500 h-11 flex items-center justify-center text-sm">
          {label}
        </div>
      )}
    </article>
  )
}
