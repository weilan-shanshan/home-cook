import { Link } from 'react-router'
import { DishThumb } from '@/components/recipe/DishThumb'
import type { RecipeListRow } from '@/hooks/useRecipes'

type Props = {
  recipes: RecipeListRow[]
}

export function HomeNewRecipesCard({ recipes }: Props) {
  if (recipes.length === 0) return null

  // Sort by created_at descending, take top 3
  const newest = [...recipes]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3)

  return (
    <section>
      <div className="flex items-end justify-between mb-3">
        <h2 className="font-serif text-lg text-ink-900">新菜来啦</h2>
        <Link to="/menu" className="text-xs text-brand">查看全部 →</Link>
      </div>
      <div className="surface-card divide-y divide-cream-100">
        {newest.map((r) => {
          const src = r.first_image?.thumb_url ?? r.first_image?.url ?? undefined
          const daysAgo = Math.round((Date.now() - new Date(r.created_at).getTime()) / 86_400_000)
          const timeLabel = daysAgo === 0 ? '今天' : daysAgo === 1 ? '昨天' : `${daysAgo} 天前`
          return (
            <Link
              key={r.id}
              to={`/recipe/${r.id}`}
              className="flex items-center gap-3 p-4 hover:bg-cream-50 transition-colors"
            >
              <DishThumb
                id={r.id}
                name={r.title}
                src={src ?? null}
                size="sm"
                rounded="lg"
                className="shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-ink-900 font-medium truncate">{r.title}</div>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  {r.cook_minutes && (
                    <span className="text-[11px] text-ink-400">⏱ {r.cook_minutes}min</span>
                  )}
                  {r.tags.length > 0 && (
                    <span className="text-[11px] text-ink-400">· {r.tags[0].name}</span>
                  )}
                </div>
              </div>
              <span className="text-[10px] text-ink-400 shrink-0">{timeLabel}</span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
