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
  const isSingle = capped.length === 1

  return (
    <section>
      <div className="flex items-end justify-between mb-3">
        <h2 className="font-serif text-lg text-ink-900">今日推荐</h2>
        {hasMore && (
          <Link to="/menu" className="text-xs text-brand">查看全部 →</Link>
        )}
      </div>
      <div className={isSingle ? '' : 'grid grid-cols-2 gap-3'}>
        {capped.map((dish) => (
          <Link
            key={dish.recipeId}
            to={`/recipe/${dish.recipeId}`}
            className={
              isSingle
                ? 'surface-card overflow-hidden flex items-center gap-3 p-3'
                : 'surface-card overflow-hidden flex flex-col'
            }
          >
            {isSingle ? (
              <>
                <DishThumb
                  id={dish.recipeId}
                  name={dish.title}
                  src={dish.image?.thumbUrl ?? dish.image?.url ?? undefined}
                  size="lg"
                  rounded="2xl"
                  className="w-20 h-20 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-brand-700 font-medium mb-0.5">为你推荐</div>
                  <div className="font-serif text-lg text-ink-900 line-clamp-1">{dish.title}</div>
                  {dish.orderCount > 0 && (
                    <div className="mt-1 text-[11px] text-ink-500">已被点单 {dish.orderCount} 次</div>
                  )}
                </div>
                <span className="text-brand text-sm">→</span>
              </>
            ) : (
              <>
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
              </>
            )}
          </Link>
        ))}
      </div>
    </section>
  )
}
