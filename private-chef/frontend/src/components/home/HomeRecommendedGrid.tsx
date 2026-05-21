import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'
import { DishThumb } from '@/components/recipe/DishThumb'
import type { RecipeCardSummary } from '@/hooks/useHomeSummary'
import type { RecipeTag } from '@/hooks/useRecipes'

type Props = {
  dishes: RecipeCardSummary[]
  /** Optional map of recipeId → tags, cross-referenced from useRecipes */
  tagsMap?: Map<number, RecipeTag[]>
}

export function HomeRecommendedGrid({ dishes, tagsMap }: Props) {
  if (dishes.length === 0) return null

  const capped = dishes.slice(0, 6)
  const hasMore = dishes.length > 6

  return (
    <section>
      <div className="flex items-end justify-between mb-3">
        <h2 className="font-serif text-lg text-ink-900">今日推荐</h2>
        {hasMore && (
          <Link to="/menu" aria-label="查看全部">
            <button type="button" className="w-7 h-7 rounded-full surface-card flex items-center justify-center text-ink-500 hover:text-ink-700 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </Link>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {capped.map((dish) => {
          const tags = tagsMap?.get(dish.recipeId) ?? []
          return (
            <Link
              key={dish.recipeId}
              to={`/recipe/${dish.recipeId}`}
              className="surface-card overflow-hidden flex flex-col"
            >
              <div className="aspect-square w-full">
                <DishThumb
                  id={dish.recipeId}
                  name={dish.title}
                  src={dish.image?.thumbUrl ?? dish.image?.url ?? undefined}
                  size="lg"
                  rounded="lg"
                  className="w-full h-full object-cover rounded-none"
                />
              </div>
              <div className="p-2">
                <div className="text-xs font-medium line-clamp-1 text-ink-900">{dish.title}</div>
                {tags.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5 flex-wrap">
                    {tags.slice(0, 1).map((t) => (
                      <span
                        key={t.id}
                        className="text-[8px] rounded-full bg-cream-200 text-ink-700 px-1.5 py-0.5"
                      >
                        {t.name}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-0.5 flex items-center gap-1">
                  {dish.orderCount > 0 && (
                    <span className="text-[10px] text-ink-500">{dish.orderCount} 次</span>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
        {/* Placeholder when only 1 dish — fills the second cell */}
        {capped.length === 1 && (
          <Link
            to="/menu"
            className="surface-cream flex flex-col items-center justify-center gap-2 min-h-[140px] text-brand-600"
          >
            <ChevronRight className="w-6 h-6" />
            <span className="text-xs font-medium">更多推荐</span>
          </Link>
        )}
      </div>
    </section>
  )
}
