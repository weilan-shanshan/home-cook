import { Link } from 'react-router'
import { ChevronRight, Heart } from 'lucide-react'
import { useSquareRecipes } from '@/hooks/useSquare'
import { DishThumb } from '@/components/recipe/DishThumb'
import { TagChip } from '@/components/recipe/TagChip'

export function HomeSquareCard() {
  const { data, isLoading } = useSquareRecipes({ limit: 4 })
  const dishes = data?.pages.flatMap((p) => p.data) ?? []

  if (isLoading || dishes.length === 0) {
    // Hide the section until there's something to show — otherwise it just
    // looks like an empty/broken module on a fresh family.
    return null
  }

  const capped = dishes.slice(0, 4)

  return (
    <section>
      <div className="flex items-end justify-between mb-3">
        <div>
          <h2 className="font-serif text-lg text-ink-900">家庭广场</h2>
          <p className="text-[11px] text-ink-500 mt-0.5">看看别人家在吃啥</p>
        </div>
        <Link to="/square" aria-label="查看全部">
          <button
            type="button"
            className="w-7 h-7 rounded-full surface-card flex items-center justify-center text-ink-500 hover:text-ink-700 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {capped.map((d) => (
          <Link
            key={d.id}
            to={`/square/${d.id}`}
            className="surface-card overflow-hidden flex flex-col"
          >
            <div className="relative aspect-square w-full">
              <DishThumb
                id={d.id}
                name={d.title}
                src={d.first_image?.thumbUrl ?? d.first_image?.url ?? null}
                rounded="lg"
                className="w-full h-full object-cover rounded-none"
              />
              {d.tags.length > 0 && (
                <div className="absolute top-2 left-2 right-2 flex flex-wrap gap-1 pointer-events-none">
                  {d.tags.slice(0, 1).map((t) => (
                    <TagChip key={t.id} name={t.name} />
                  ))}
                </div>
              )}
            </div>
            <div className="p-2.5 flex items-end justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm font-medium line-clamp-1 text-ink-900">
                  {d.title}
                </div>
                <div className="text-[10px] text-ink-400 mt-0.5 truncate">
                  来自 {d.family.name}
                </div>
              </div>
              {d.like_count > 0 && (
                <span className="shrink-0 inline-flex items-center gap-0.5 text-[11px] text-ink-500">
                  <Heart
                    className={`w-3 h-3 ${d.liked_by_me ? 'fill-rose-500 text-rose-500' : 'text-ink-400'}`}
                  />
                  {d.like_count}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
