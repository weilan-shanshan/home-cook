import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'
import { DishThumb } from '@/components/recipe/DishThumb'
import type { RecipeListRow } from '@/hooks/useRecipes'

type Props = {
  recipes: RecipeListRow[]
}

function relativeTime(iso: string): string {
  const d = Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (d === 0) return '今天'
  if (d === 1) return '昨天'
  if (d < 7) return `${d} 天前`
  return `${Math.floor(d / 7)} 周前`
}

export function HomeNewRecipesCard({ recipes }: Props) {
  if (recipes.length === 0) return null

  // Sort by created_at descending, cap at 4
  const newest = [...recipes]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 4)

  return (
    <section>
      <div className="flex items-end justify-between mb-3">
        <h2 className="font-serif text-lg text-ink-900">新菜来啦</h2>
        <Link to="/menu" aria-label="查看全部">
            <button type="button" className="w-7 h-7 rounded-full surface-card flex items-center justify-center text-ink-500 hover:text-ink-700 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </Link>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {newest.map((r) => {
          const src = r.first_image?.thumb_url ?? r.first_image?.url ?? undefined
          const timeLabel = relativeTime(r.created_at)
          const firstTag = r.tags.length > 0 ? r.tags[0].name : null

          return (
            <Link
              key={r.id}
              to={`/recipe/${r.id}`}
              className="surface-card overflow-hidden flex flex-col"
            >
              {/* Top half: dish image with tag chip overlay */}
              <div className="relative aspect-square w-full overflow-hidden">
                <DishThumb
                  id={r.id}
                  name={r.title}
                  src={src ?? null}
                  rounded="lg"
                  className="w-full h-full object-cover !rounded-none"
                />
                {firstTag && (
                  <span className="absolute top-2 left-2 text-[9px] rounded-full bg-cream-50/90 text-brand-700 px-1.5 py-0.5 backdrop-blur-sm">
                    {firstTag}
                  </span>
                )}
              </div>
              {/* Bottom: name + creator + time */}
              <div className="p-2.5 flex flex-col gap-0.5">
                <div className="text-sm font-medium text-ink-900 line-clamp-1">{r.title}</div>
                <div className="text-[10px] text-ink-400">{timeLabel}</div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
