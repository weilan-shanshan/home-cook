import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'
import { DishThumb } from '@/components/recipe/DishThumb'
import { TagChip } from '@/components/recipe/TagChip'
import type { RecipeCardSummary } from '@/hooks/useHomeSummary'
import type { RecipeTag } from '@/hooks/useRecipes'

type Props = {
  dishes: RecipeCardSummary[]
  /** Optional map of recipeId → tags, cross-referenced from useRecipes */
  tagsMap?: Map<number, RecipeTag[]>
}

export function HomeFrequentList({ dishes, tagsMap }: Props) {
  if (dishes.length === 0) return null

  const capped = dishes.slice(0, 4)
  const hasMore = dishes.length > 4

  return (
    <section>
      <div className="flex items-end justify-between mb-3">
        <h2 className="font-serif text-lg text-ink-900">家里常点</h2>
        {hasMore && (
          <Link to="/menu" aria-label="查看全部">
            <button type="button" className="w-7 h-7 rounded-full surface-card flex items-center justify-center text-ink-500 hover:text-ink-700 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {capped.map((dish) => {
          const tags = tagsMap?.get(dish.recipeId) ?? []
          return (
            <Link
              key={dish.recipeId}
              to={`/recipe/${dish.recipeId}`}
              className="surface-card p-3 flex flex-col gap-2"
            >
              <div className="relative aspect-square w-full">
                <DishThumb
                  id={dish.recipeId}
                  name={dish.title}
                  src={dish.image?.thumbUrl ?? dish.image?.url ?? undefined}
                  className="w-full h-full"
                  rounded="lg"
                />
                {tags.length > 0 && (
                  <div className="absolute top-2 left-2 right-2 flex flex-wrap gap-1 pointer-events-none">
                    {tags.slice(0, 2).map((t) => (
                      <TagChip key={t.id} name={t.name} />
                    ))}
                  </div>
                )}
              </div>
              <div>
                <div className="text-sm font-medium text-ink-900 line-clamp-1">{dish.title}</div>
                <div className="text-[10px] text-ink-500 mt-0.5">{dish.orderCount} 次想吃</div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
