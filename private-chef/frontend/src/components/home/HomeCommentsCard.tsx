import { useNavigate } from 'react-router'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { RecentCommentSummary } from '@/hooks/useHomeSummary'

type Props = { comments: RecentCommentSummary[] }

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return '刚刚'
  if (m < 60) return `${m} 分钟前`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} 小时前`
  return `${Math.floor(h / 24)} 天前`
}

export function HomeCommentsCard({ comments }: Props) {
  const navigate = useNavigate()
  if (comments.length === 0) return null

  const preview = comments.slice(0, 3)

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-serif text-lg text-ink-900">最近评论 · {comments.length}</h2>
      </div>
      <div className="surface-card divide-y divide-cream-100">
        {preview.map((c) => (
          <button
            key={c.id}
            type="button"
            className="w-full text-left p-4 flex items-start gap-3 cursor-pointer hover:bg-cream-50 transition-colors first:rounded-t-3xl last:rounded-b-3xl"
            onClick={() => navigate(`/orders/${c.orderId}`)}
          >
            <Avatar className="w-8 h-8 shrink-0">
              <AvatarFallback className="bg-brand-100 text-brand-700 text-sm">
                {(c.displayName ?? '?').slice(0, 1)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                <span className="text-sm font-medium text-ink-900 truncate">{c.displayName}</span>
                <span
                  className={`text-[11px] rounded-full px-2 py-0.5 ${
                    c.roleType === 'cook'
                      ? 'bg-mustard-100 text-mustard-700'
                      : 'bg-cream-100 text-ink-500'
                  }`}
                >
                  {c.roleType === 'cook' ? '大厨' : '点单人'}
                </span>
                <span className="text-[11px] text-ink-400 ml-auto shrink-0">
                  {relativeTime(c.createdAt)}
                </span>
              </div>
              <p className="text-sm text-ink-700 line-clamp-1">{c.contentPreview}</p>
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}
