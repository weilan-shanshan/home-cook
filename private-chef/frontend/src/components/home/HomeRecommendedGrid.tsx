import { Link } from 'react-router'
import { DishThumb } from '@/components/recipe/DishThumb'
import type { RecipeCardSummary } from '@/hooks/useHomeSummary'

type Props = {
  dishes: RecipeCardSummary[]
}

export function HomeRecommendedGrid({ dishes }: Props) {
  if (dishes.length === 0) return null

  const capped = dishes.slice(0, 4)
  const hasMore = dishes.length > 4

  return (
    <section>
      <div className="flex items-end justify-between mb-3">
        <h2 className="font-serif text-lg text-ink-900">今日推荐</h2>
        {hasMore && (
          <Link to="/menu" className="text-xs text-brand">查看全部 →</Link>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {capped.map((dish) => (
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
            <div className="p-2.5">
              <div className="text-sm font-medium line-clamp-1 text-ink-900">{dish.title}</div>
              <div className="mt-1 flex items-center gap-1.5">
                {dish.orderCount > 0 && (
                  <span className="text-[11px] text-ink-500">{dish.orderCount} 次点单</span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
