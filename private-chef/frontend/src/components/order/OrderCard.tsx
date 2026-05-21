import { useNavigate } from 'react-router'
import { Heart, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
  note?: string | null
  primaryActionLabel?: string
  onPrimary?: () => void
  onToggleFavorite?: (item: OrderCardItem) => void
  primaryDisabled?: boolean
}

const STATUS_CHIP: Record<OrderCardData['status'], { label: string; cls: string }> = {
  pending: { label: '等你接单', cls: 'bg-brand-100 text-brand-700' },
  cooking: { label: '制作中',   cls: 'bg-honey-100 text-honey-700' },
  done:    { label: '已完成',   cls: 'bg-sky-100 text-sky-700' },
}

export function OrderCard(props: OrderCardData) {
  const navigate = useNavigate()
  const chip = STATUS_CHIP[props.status]
  const defaultLabel =
    props.status === 'pending' ? '我来接单' : props.status === 'cooking' ? '出锅完成 ✓' : '已完成'
  const label = props.primaryActionLabel ?? defaultLabel
  const totalCount = props.items.reduce((s, i) => s + (i.quantity ?? 1), 0)

  // Grid shows max 4 cells: show 3 dishes + 1 overflow if >4, else show all up to 4
  const showOverflow = props.items.length > 4
  const gridItems = showOverflow ? props.items.slice(0, 3) : props.items.slice(0, 4)
  const overflowCount = props.items.length - 3

  // Avatar initial from meta (first char of requester name portion)
  const avatarInitial = props.meta.charAt(0) || '?'

  return (
    <article
      className="surface-card hover-lift p-5 cursor-pointer"
      onClick={() => navigate(`/orders/${props.id}`)}
    >
      {/* Top row: status chip + avatar + meta + time */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <span className={`rounded-full text-[11px] px-3 py-1 font-medium shrink-0 ${chip.cls}`}>
            {chip.label}
          </span>
          <div className="flex items-center gap-1.5 min-w-0">
            <Avatar className="w-8 h-8 shrink-0">
              <AvatarFallback className="bg-brand-100 text-brand-700 text-[10px]">
                {avatarInitial}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="text-base font-medium text-ink-900 truncate">{props.no}</div>
              <div className="text-[11px] text-ink-500 truncate">{props.meta}</div>
            </div>
          </div>
        </div>
        <span className="text-[11px] text-ink-400 shrink-0">{props.agoLabel}</span>
      </div>

      {/* Separator */}
      <div className="h-px bg-cream-200 my-4" />

      {/* Dish mini-grid: 2x2 (max 4 cells) */}
      <div className="grid grid-cols-2 gap-2">
        {gridItems.map((it) => (
          <div
            key={it.id}
            className="bg-cream-100 rounded-2xl p-2.5 flex items-center gap-2"
          >
            <DishThumb
              id={it.recipeId ?? it.id}
              name={it.name}
              src={it.cover ?? undefined}
              size="md"
              rounded="lg"
            />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-ink-900 truncate">{it.name ?? `菜品 #${it.id}`}</div>
              <div className="flex items-center gap-1 mt-0.5">
                {it.avgRating != null && (
                  <RatingBadge avg={it.avgRating} count={it.ratingCount ?? null} size="xs" />
                )}
                {(it.quantity ?? 1) > 1 && (
                  <span className="text-[11px] text-ink-500">× {it.quantity}</span>
                )}
              </div>
            </div>
          </div>
        ))}
        {/* Overflow cell */}
        {showOverflow && (
          <div className="bg-cream-100 rounded-2xl p-2.5 flex items-center justify-center text-xs text-ink-500">
            还有 {overflowCount} 道 →
          </div>
        )}
      </div>

      {/* Total count */}
      <div className="mt-2 text-[11px] text-ink-400">一共 {totalCount} 份</div>

      {/* Note callout */}
      {props.note && (
        <div className="mt-3 rounded-2xl bg-honey-100 px-3 py-2.5 text-sm text-ink-700 flex items-start gap-1.5 line-clamp-2">
          <MessageCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-honey-500" />
          <span>{props.note}</span>
        </div>
      )}

      {/* Bottom action row */}
      <div className="mt-3 flex items-center gap-2">
        {props.status !== 'done' ? (
          <Button
            variant={props.status === 'pending' ? 'inverse' : 'default'}
            size="pill"
            className="flex-1"
            disabled={props.primaryDisabled}
            onClick={(e) => { e.stopPropagation(); props.onPrimary?.() }}
          >
            {label}
          </Button>
        ) : (
          <div className="flex-1 rounded-full bg-cream-100 text-ink-500 h-14 flex items-center justify-center text-sm">
            {label}
          </div>
        )}

        {/* Favorite toggle — only if handler provided */}
        {props.onToggleFavorite && props.items.length > 0 && (
          <button
            type="button"
            aria-label={props.items[0]?.favorited ? '取消收藏' : '收藏'}
            onClick={(e) => {
              e.stopPropagation()
              props.onToggleFavorite?.(props.items[0])
            }}
            className="w-10 h-10 rounded-full bg-cream-100 flex items-center justify-center text-brand cursor-pointer hover:bg-cream-200 transition-colors shrink-0"
          >
            <Heart
              className={`w-4 h-4 ${props.items[0]?.favorited ? 'fill-current' : ''}`}
            />
          </button>
        )}
      </div>
    </article>
  )
}
