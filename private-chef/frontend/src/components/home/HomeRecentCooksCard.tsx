import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'
import type { RecentOrderSummary } from '@/hooks/useHomeSummary'

type Props = {
  orders: RecentOrderSummary[]
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return '刚刚'
  if (m < 60) return `${m} 分钟前`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} 小时前`
  const d = Math.floor(h / 24)
  if (d === 1) return '昨天'
  if (d < 7) return `${d} 天前`
  return `${Math.floor(d / 7)} 周前`
}

export function HomeRecentCooksCard({ orders }: Props) {
  // Only show completed orders
  const completed = orders.filter((o) => o.status === 'completed').slice(0, 3)
  if (completed.length === 0) return null

  return (
    <section>
      <div className="flex items-end justify-between mb-3">
        <h2 className="font-serif text-lg text-ink-900">最近烹饪</h2>
        <Link to="/orders" aria-label="查看全部">
            <button type="button" className="w-7 h-7 rounded-full surface-card flex items-center justify-center text-ink-500 hover:text-ink-700 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </Link>
      </div>
      <div className="surface-card divide-y divide-cream-100">
        {completed.map((o) => (
          <Link
            key={o.id}
            to={`/orders/${o.id}`}
            className="flex items-center gap-3 p-4 hover:bg-cream-50 transition-colors"
          >
            {/* Avatar initial */}
            <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-semibold shrink-0">
              {(o.requester.displayName ?? '?').charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-ink-900 font-medium line-clamp-1">
                {o.recipeTitles.length > 0 ? o.recipeTitles.join('、') : '无菜品'}
              </div>
              <div className="text-[11px] text-ink-400 mt-0.5">
                {o.requester.displayName} · {relativeTime(o.createdAt)}
              </div>
            </div>
            <span className="text-[10px] rounded-full bg-sky-100 text-sky-600 px-2 py-0.5 shrink-0">完成</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
