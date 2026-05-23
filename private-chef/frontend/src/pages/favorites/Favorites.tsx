import { Link } from 'react-router'
import { Heart } from 'lucide-react'
import { useFavorites, useToggleFavorite } from '@/hooks/useFavorites'
import { DishThumb } from '@/components/recipe/DishThumb'

export default function Favorites() {
  const { data: favorites, isLoading } = useFavorites()
  const { mutate: toggleFavorite } = useToggleFavorite()

  return (
    <main className="space-y-4 pb-20">
      <h1 className="font-serif text-3xl text-ink-900">收藏</h1>

      {isLoading ? (
        <div className="surface-card p-6 text-center text-ink-500 text-sm">正在加载...</div>
      ) : !favorites?.length ? (
        <div className="surface-card p-6 text-center text-ink-500 text-sm">还没收藏什么菜</div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {favorites.map((fav) => (
            <div key={fav.id} className="surface-card overflow-hidden">
              <Link to={`/recipe/${fav.id}`} className="block aspect-square">
                <DishThumb id={fav.id} name={fav.title} src={fav.first_image?.thumb_url ?? fav.first_image?.url ?? undefined} size="fill" rounded="lg" />
              </Link>
              <div className="p-3 flex items-end justify-between">
                <div>
                  <div className="font-medium text-ink-900 line-clamp-1">{fav.title}</div>
                </div>
                <button
                  className="w-8 h-8 rounded-full bg-cream-100 text-brand flex items-center justify-center cursor-pointer hover:bg-cream-200 transition-colors"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    toggleFavorite({ recipeId: fav.id, isFavorited: true })
                  }}
                  aria-label="取消收藏"
                >
                  <Heart className="w-4 h-4 fill-current" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
