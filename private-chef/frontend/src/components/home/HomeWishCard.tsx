import { useNavigate } from 'react-router'
import { useWishes } from '@/hooks/useWishes'

export function HomeWishCard() {
  const navigate = useNavigate()
  const { data: wishes = [] } = useWishes('pending')

  if (wishes.length === 0) return null

  const preview = wishes.slice(0, 2)
  const hasMore = wishes.length > 2

  return (
    <div
      className="surface-card p-4 flex flex-col gap-2 h-full cursor-pointer"
      onClick={() => navigate('/wishes')}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-base text-ink-900">心愿单</h2>
        <span className="text-[11px] rounded-full bg-rose-100 text-rose-500 px-2 py-0.5 font-medium">
          {wishes.length}
        </span>
      </div>

      {/* Wish items */}
      <div className="flex flex-col gap-1.5 flex-1">
        {preview.map((w) => (
          <div
            key={w.id}
            className="text-sm text-ink-900 line-clamp-1 flex items-center gap-1"
          >
            <span className="text-rose-400 text-[10px] shrink-0">✦</span>
            <span className="truncate">{w.dishName}</span>
          </div>
        ))}
      </div>

      {/* View all */}
      {hasMore && (
        <div className="text-xs text-brand mt-auto">查看全部 →</div>
      )}
    </div>
  )
}
