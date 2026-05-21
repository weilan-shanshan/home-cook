import { Link } from 'react-router'
import type { RecentCommentSummary } from '@/hooks/useHomeSummary'

interface Props {
  comment: RecentCommentSummary
}

function formatRelativeTime(iso: string): string {
  const ts = new Date(iso.replace(' ', 'T')).getTime()
  const diffMin = Math.floor((Date.now() - ts) / 60000)
  if (diffMin < 1) return '刚刚'
  if (diffMin < 60) return `${diffMin} 分钟前`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH} 小时前`
  return new Date(ts).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

export function HomeCommentRow({ comment }: Props) {
  const roleLabel = comment.roleType === 'cook' ? '掌勺人' : '想吃的人'
  const initial = comment.displayName.slice(0, 1)

  return (
    <Link
      to={`/orders/${comment.orderId}`}
      className="flex gap-3 p-3 rounded-2xl bg-white border border-cream-300 hover:border-brand-200 transition-colors"
    >
      <div aria-hidden="true" className="flex-none w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm">
        {initial}
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-ink-900">{comment.displayName}</span>
          <span className="text-ink-500 text-[10px] px-1.5 py-0.5 bg-cream-100 rounded-full">
            {roleLabel}
          </span>
          <span className="ml-auto text-[10px] text-ink-500">
            {formatRelativeTime(comment.createdAt)}
          </span>
        </div>
        <p className="text-sm text-ink-700 line-clamp-2">{comment.contentPreview}</p>
      </div>
    </Link>
  )
}
