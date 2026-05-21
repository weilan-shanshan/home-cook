import { useNavigate } from 'react-router'
import { useWishes } from '@/hooks/useWishes'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export function HomeWishCard() {
  const navigate = useNavigate()
  const { data: wishes = [] } = useWishes('pending')

  const preview = wishes.slice(0, 4)
  const hasMore = wishes.length > 4

  return (
    <div
      className="surface-card p-5 flex flex-col gap-3 cursor-pointer"
      onClick={() => navigate('/wishes')}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-lg text-ink-900">心愿单</h2>
        <div className="flex items-center gap-2">
          {wishes.length > 0 && (
            <span className="text-[11px] rounded-full bg-rose-100 text-rose-500 px-2 py-0.5 font-medium">
              {wishes.length}
            </span>
          )}
          <span className="text-xs text-brand">查看全部 →</span>
        </div>
      </div>

      {/* Wish items or empty state */}
      {wishes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-4 gap-2 text-center">
          <div className="text-2xl">✨</div>
          <p className="text-sm text-ink-500">还没人许愿，点这里加一条 →</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {preview.map((w) => (
            <div
              key={w.id}
              className="flex items-center gap-3"
            >
              <Avatar className="w-7 h-7 shrink-0">
                <AvatarFallback className="bg-rose-100 text-rose-500 text-[11px] font-semibold">
                  {w.dishName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-ink-900 truncate font-medium">{w.dishName}</div>
                {w.note && (
                  <div className="text-[11px] text-ink-400 truncate">{w.note}</div>
                )}
              </div>
              <span className="text-[10px] rounded-full bg-rose-100 text-rose-500 px-2 py-0.5 shrink-0">
                想吃
              </span>
            </div>
          ))}
        </div>
      )}

      {/* View all */}
      {hasMore && (
        <div className="text-xs text-brand mt-auto">
          查看全部 {wishes.length} 条 →
        </div>
      )}
    </div>
  )
}
