import { useMemo } from 'react'
import { Star } from 'lucide-react'
import { useCookLogs, type CookLogDetail } from '@/hooks/useCookLogs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

type Props = { recipeId: number }

// useCookLogs returns res.json() — the backend may return an array or { data: [] }
// Normalize to always work with CookLogDetail[]
function normalizeLogs(raw: unknown): CookLogDetail[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw as CookLogDetail[]
  const obj = raw as Record<string, unknown>
  if (Array.isArray(obj.data)) return obj.data as CookLogDetail[]
  return []
}

export function RecipeComments({ recipeId }: Props) {
  const { data, isLoading } = useCookLogs(recipeId)

  const items = useMemo(() => {
    const logs = normalizeLogs(data)
    return logs
      .flatMap((log) =>
        (log.ratings ?? []).map((r) => ({
          ...r,
          cookedAt: log.cooked_at,
          cookUser: log.cooked_by_name,
        }))
      )
      .filter((r) => (r.comment && r.comment.trim()) || r.score > 0)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [data])

  return (
    <section className="mx-4 mt-5" id="comments">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm text-ink-500">评论 {items.length > 0 ? `· ${items.length} 条` : ''}</h2>
      </div>
      {isLoading && <div className="surface-card p-4 text-sm text-ink-400">加载中…</div>}
      {!isLoading && items.length === 0 && (
        <div className="surface-card p-6 text-center text-sm text-ink-400">还没有人留下评论</div>
      )}
      {items.length > 0 && (
        <ul className="space-y-3">
          {items.map((c) => (
            <li key={c.id} className="surface-card p-4 flex gap-3">
              <Avatar className="w-9 h-9">
                <AvatarFallback className="bg-brand-100 text-brand-700 text-sm">
                  {(c.display_name ?? '?').slice(0, 1)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-sm font-medium text-ink-900 truncate">{c.display_name}</span>
                    <span className="inline-flex items-center gap-0.5 text-mustard-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${i < c.score ? 'fill-current' : 'opacity-25 fill-current'}`}
                          strokeWidth={0}
                        />
                      ))}
                    </span>
                  </div>
                  <span className="text-[11px] text-ink-400 shrink-0">{formatTimeAgo(c.created_at)}</span>
                </div>
                {c.comment && (
                  <p className="mt-1.5 text-sm text-ink-700 leading-relaxed">{c.comment}</p>
                )}
                {c.cookUser && (
                  <div className="mt-1 text-[11px] text-ink-400">由 {c.cookUser} 烹饪</div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function formatTimeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diffMs / 60_000)
  if (m < 1) return '刚刚'
  if (m < 60) return `${m} 分钟前`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} 小时前`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d} 天前`
  return new Date(iso).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}
