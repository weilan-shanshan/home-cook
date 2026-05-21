import { MessageSquare } from 'lucide-react'
import type { RecentCommentSummary } from '@/hooks/useHomeSummary'
import { HomeCommentRow } from './HomeCommentRow'

interface Props {
  comments: RecentCommentSummary[]
}

export function HomeRecentComments({ comments }: Props) {
  if (comments.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-brand-100 text-brand-700">
          <MessageSquare className="h-5 w-5" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-ink-900">最新评论</h2>
      </div>
      <div className="space-y-2">
        {comments.map((c) => (
          <HomeCommentRow key={c.id} comment={c} />
        ))}
      </div>
    </div>
  )
}
