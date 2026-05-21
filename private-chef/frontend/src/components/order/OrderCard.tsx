import { useNavigate } from 'react-router'
import { Heart, MessageCircle, ArrowRight } from 'lucide-react'
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
  pending: { label: '谁来做', cls: 'bg-brand-100 text-brand-700' },
  cooking: { label: '正在做',  cls: 'bg-honey-100 text-honey-700' },
  done:    { label: '做好了',  cls: 'bg-sky-100 text-sky-700' },
}

// ─── Pending variant ───────────────────────────────────────────────────────────

function PendingOrderCard(props: OrderCardData & { navigate: ReturnType<typeof useNavigate> }) {
  const { navigate } = props
  const label = props.primaryActionLabel ?? '我来做'
  const totalCount = props.items.reduce((s, i) => s + (i.quantity ?? 1), 0)
  const showOverflow = props.items.length > 4
  const gridItems = showOverflow ? props.items.slice(0, 3) : props.items.slice(0, 4)
  const overflowCount = props.items.length - 3

  return (
    <article
      className="rounded-3xl bg-gradient-to-br from-brand-50 to-cream-100 border border-brand-200 shadow-[0_8px_32px_-8px_rgba(122,164,104,0.30),0_2px_4px_rgba(122,164,104,0.10)] p-5 cursor-pointer"
      onClick={() => navigate(`/orders/${props.id}`)}
    >
      {/* Header: status chip (pulsing) + time */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className="inline-flex items-center h-7 px-3.5 rounded-full bg-brand text-cream-50 text-xs font-medium animate-[pulse_2s_ease-in-out_infinite]">
          谁来做
</span>
        <span className="text-xs text-ink-500 shrink-0 pt-0.5">{props.agoLabel}</span>
      </div>

      {/* Order title prominent */}
      <div className="font-serif text-xl text-ink-900 mb-1">{props.no}</div>
      <div className="text-xs text-ink-500 mb-4">{props.meta}</div>

      {/* Separator */}
      <div className="h-px bg-brand-100 mb-4" />

      {/* Dish mini-grid */}
      <div className="grid grid-cols-2 gap-2">
        {gridItems.map((it) => (
          <div
            key={it.id}
            className="bg-white/60 rounded-2xl p-2.5 flex items-center gap-2 backdrop-blur-sm"
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
        {showOverflow && (
          <div className="bg-white/60 rounded-2xl p-2.5 flex items-center justify-center text-xs text-ink-500 backdrop-blur-sm">
            还有 {overflowCount} 道 →
          </div>
        )}
      </div>

      <div className="mt-2 text-[11px] text-ink-400">一共 {totalCount} 份</div>

      {/* Note */}
      {props.note && (
        <div className="mt-3 rounded-2xl bg-honey-100 px-3 py-2.5 text-sm text-ink-700 flex items-start gap-1.5 line-clamp-2">
          <MessageCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-honey-500" />
          <span>{props.note}</span>
        </div>
      )}

      {/* Action button */}
      <div className="mt-4 flex items-center gap-2">
        <Button
          variant="inverse"
          size="pill"
          className="flex-1"
          disabled={props.primaryDisabled}
          onClick={(e) => { e.stopPropagation(); props.onPrimary?.() }}
        >
          {label}
          <ArrowRight className="w-4 h-4 ml-1.5" />
        </Button>
        {props.onToggleFavorite && props.items.length > 0 && (
          <button
            type="button"
            aria-label={props.items[0]?.favorited ? '取消收藏' : '收藏'}
            onClick={(e) => {
              e.stopPropagation()
              props.onToggleFavorite?.(props.items[0])
            }}
            className="w-10 h-10 rounded-full bg-white/60 flex items-center justify-center text-brand cursor-pointer hover:bg-white/80 transition-colors shrink-0"
          >
            <Heart className={`w-4 h-4 ${props.items[0]?.favorited ? 'fill-current' : ''}`} />
          </button>
        )}
      </div>
    </article>
  )
}

// ─── Default (cooking / done) variant ─────────────────────────────────────────

function DefaultOrderCard(props: OrderCardData & { navigate: ReturnType<typeof useNavigate> }) {
  const { navigate } = props
  const chip = STATUS_CHIP[props.status]
  const defaultLabel =
    props.status === 'cooking' ? '做好啦 ✓' : '做好了'
  const label = props.primaryActionLabel ?? defaultLabel
  const totalCount = props.items.reduce((s, i) => s + (i.quantity ?? 1), 0)
  const showOverflow = props.items.length > 4
  const gridItems = showOverflow ? props.items.slice(0, 3) : props.items.slice(0, 4)
  const overflowCount = props.items.length - 3
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
        <span className="text-xs text-ink-400 shrink-0">{props.agoLabel}</span>
      </div>

      {/* Separator */}
      <div className="h-px bg-cream-200 my-4" />

      {/* Dish mini-grid */}
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
        {showOverflow && (
          <div className="bg-cream-100 rounded-2xl p-2.5 flex items-center justify-center text-xs text-ink-500">
            还有 {overflowCount} 道 →
          </div>
        )}
      </div>

      <div className="mt-2 text-[11px] text-ink-400">一共 {totalCount} 份</div>

      {/* Note */}
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
            variant="default"
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
            <Heart className={`w-4 h-4 ${props.items[0]?.favorited ? 'fill-current' : ''}`} />
          </button>
        )}
      </div>
    </article>
  )
}

// ─── Public export ─────────────────────────────────────────────────────────────

export function OrderCard(props: OrderCardData) {
  const navigate = useNavigate()
  if (props.status === 'pending') {
    return <PendingOrderCard {...props} navigate={navigate} />
  }
  return <DefaultOrderCard {...props} navigate={navigate} />
}
