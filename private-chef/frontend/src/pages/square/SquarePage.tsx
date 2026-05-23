import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router'
import { ChevronLeft, Heart, MessageCircle, Loader2 } from 'lucide-react'
import { useSquareRecipes, useToggleSquareLike, type SquareRecipeSummary } from '@/hooks/useSquare'
import { DishThumb } from '@/components/recipe/DishThumb'
import { TagChip } from '@/components/recipe/TagChip'
import { Button } from '@/components/ui/button'

function SquareCard({ dish }: { dish: SquareRecipeSummary }) {
  const toggleLike = useToggleSquareLike()
  return (
    <div className="surface-card overflow-hidden">
      <Link to={`/square/${dish.id}`} className="block aspect-square relative">
        <DishThumb
          id={dish.id}
          name={dish.title}
          src={dish.first_image?.thumbUrl ?? dish.first_image?.url ?? null}
          size="fill"
          rounded="lg"
          className="object-cover"
        />
        {dish.tags.length > 0 && (
          <div className="absolute top-2 left-2 right-2 flex flex-wrap gap-1 pointer-events-none">
            {dish.tags.slice(0, 2).map((t) => (
              <TagChip key={t.id} name={t.name} />
            ))}
          </div>
        )}
      </Link>
      <div className="p-3 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/square/${dish.id}`} className="min-w-0 flex-1">
            <p className="font-medium text-ink-900 text-sm line-clamp-1">{dish.title}</p>
            <p className="text-[10px] text-ink-400 mt-0.5">来自 {dish.family.name}</p>
          </Link>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              toggleLike.mutate(dish.id)
            }}
            disabled={toggleLike.isPending}
            aria-label={dish.liked_by_me ? '取消点赞' : '点赞'}
            className="shrink-0 flex items-center gap-1 text-[11px] text-ink-500 cursor-pointer"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                dish.liked_by_me ? 'fill-rose-500 text-rose-500' : 'text-ink-400'
              }`}
            />
            <span>{dish.like_count || ''}</span>
          </button>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-ink-500">
          {dish.cook_minutes != null && <span>⏱{dish.cook_minutes}min</span>}
          {dish.comment_count > 0 && (
            <span className="inline-flex items-center gap-0.5">
              <MessageCircle className="w-3 h-3" />
              {dish.comment_count}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SquarePage() {
  const navigate = useNavigate()
  const query = useSquareRecipes({ limit: 20 })
  const dishes = useMemo(
    () => query.data?.pages.flatMap((p) => p.data) ?? [],
    [query.data],
  )

  return (
    <main className="space-y-4 pb-20">
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="返回"
          className="w-9 h-9 rounded-full bg-cream-100 flex items-center justify-center text-ink-600 cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-serif text-2xl text-ink-900">家庭广场</h1>
      </div>
      <p className="text-xs text-ink-500">看看别人家在吃啥，喜欢就「复制到我家」</p>

      {query.isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-5 h-5 animate-spin text-brand" />
        </div>
      ) : dishes.length === 0 ? (
        <div className="surface-card p-10 text-center text-ink-400">
          <p className="text-sm">广场还没人发菜，第一个发布的就是你？</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            {dishes.map((d) => (
              <SquareCard key={d.id} dish={d} />
            ))}
          </div>
          {query.hasNextPage && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                disabled={query.isFetchingNextPage}
                onClick={() => query.fetchNextPage()}
              >
                {query.isFetchingNextPage ? '加载中…' : '加载更多'}
              </Button>
            </div>
          )}
        </>
      )}
    </main>
  )
}
