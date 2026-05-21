import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'
import { DishThumb } from '@/components/recipe/DishThumb'
import type { RecipeCardSummary } from '@/hooks/useHomeSummary'

type Props = {
  dishes: RecipeCardSummary[]
}

export function HomeFrequentList({ dishes }: Props) {
  if (dishes.length === 0) return null

  const capped = dishes.slice(0, 3)
  const hasMore = dishes.length > 3

  return (
    <section>
      <div className="flex items-end justify-between mb-3">
        <h2 className="font-serif text-lg text-ink-900">家里常点</h2>
        {hasMore && (
          <Link to="/menu" className="text-xs text-brand">查看全部 →</Link>
        )}
      </div>
      <div className="space-y-2">
        {capped.map((dish) => (
          <Link
            key={dish.recipeId}
            to={`/recipe/${dish.recipeId}`}
            className="surface-card p-3 flex items-center gap-3"
          >
            <DishThumb
              id={dish.recipeId}
              name={dish.title}
              src={dish.image?.thumbUrl ?? dish.image?.url ?? undefined}
              size="sm"
              rounded="2xl"
            />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-ink-900 truncate">{dish.title}</div>
              <div className="text-[11px] text-ink-500 mt-0.5">
                {dish.orderCount} 次
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-ink-400 shrink-0" />
          </Link>
        ))}
      </div>
    </section>
  )
}
