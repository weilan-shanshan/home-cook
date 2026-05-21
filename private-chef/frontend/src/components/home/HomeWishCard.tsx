import { useNavigate } from 'react-router'
import { useWishes } from '@/hooks/useWishes'

export function HomeWishCard() {
  const navigate = useNavigate()
  const { data: wishes = [] } = useWishes('pending')

  const pending = wishes.slice(0, 3)
  if (pending.length === 0) return null

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-serif text-lg text-ink-900">心愿单</h2>
        <button
          type="button"
          onClick={() => navigate('/wishes')}
          className="text-xs text-brand"
        >
          全部 →
        </button>
      </div>
      <div className="surface-card p-4">
        <div className="flex flex-wrap gap-2">
          {pending.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => navigate('/wishes')}
              className="inline-flex items-center gap-1 rounded-full bg-rose-100 text-rose-500 text-xs px-3 py-1.5 cursor-pointer hover:bg-rose-200 transition-colors"
            >
              <span>✦</span>
              <span className="font-medium">{w.dishName}</span>
            </button>
          ))}
          {wishes.length > 3 && (
            <button
              type="button"
              onClick={() => navigate('/wishes')}
              className="inline-flex items-center rounded-full bg-cream-100 text-ink-500 text-xs px-3 py-1.5 cursor-pointer hover:bg-cream-200 transition-colors"
            >
              +{wishes.length - 3} 更多
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
