import { Link } from 'react-router'
import { DishThumb } from '@/components/recipe/DishThumb'
import type { RecipeCardSummary } from '@/hooks/useHomeSummary'

type Props = {
  dishes: RecipeCardSummary[]
}

export function HomeFrequentList({ dishes }: Props) {
  if (dishes.length === 0) return null

  const capped = dishes.slice(0, 4)
  const hasMore = dishes.length > 4

  return (
    <section>
      <div className="flex items-end justify-between mb-3">
        <h2 className="font-serif text-lg text-ink-900">家里常点</h2>
        {hasMore && (
          <Link to="/menu" className="text-xs text-brand">查看全部 →</Link>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {capped.map((dish) => (
          <Link
            key={dish.recipeId}
            to={`/recipe/${dish.recipeId}`}
            className="surface-card p-3 flex flex-col gap-2"
          >
            <div className="aspect-square w-full">
              <DishThumb
                id={dish.recipeId}
                name={dish.title}
                src={dish.image?.thumbUrl ?? dish.image?.url ?? undefined}
                className="w-full h-full"
                rounded="lg"
              />
            </div>
            <div>
              <div className="text-sm font-medium text-ink-900 line-clamp-1">{dish.title}</div>
              <div className="text-[10px] text-ink-500">{dish.orderCount} 次点单</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
