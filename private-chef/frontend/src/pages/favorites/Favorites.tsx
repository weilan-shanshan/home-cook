import { Link } from 'react-router'
import { Heart, HeartOff } from 'lucide-react'
import { useFavorites, useToggleFavorite } from '@/hooks/useFavorites'
import { RecipeCard } from '@/components/recipe/RecipeCard'
import { Button } from '@/components/ui/button'

export default function Favorites() {
  const { data: favorites, isLoading } = useFavorites()
  const { mutate: toggleFavorite } = useToggleFavorite()

  return (
    <div className="space-y-8 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="pt-2 space-y-1.5">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">收藏</h1>
        <p className="text-muted-foreground text-sm font-medium">您最喜欢的菜谱都在这里。</p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted-foreground gap-5 animate-in fade-in zoom-in-95 duration-500">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
            <div className="bg-white/80 dark:bg-black/50 p-4 rounded-3xl shadow-elevated relative">
              <Heart className="h-8 w-8 animate-pulse text-rose-500/80" />
            </div>
          </div>
          <p className="text-sm font-medium tracking-wide">正在加载收藏...</p>
        </div>
      ) : !favorites?.length ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center text-muted-foreground animate-in fade-in zoom-in-95 duration-500">
          <div className="bg-secondary/30 p-6 rounded-full mb-6 border border-white/50 dark:border-white/5 shadow-sm">
            <HeartOff className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <p className="text-lg font-bold text-foreground mb-2">暂无收藏</p>
          <p className="text-sm text-muted-foreground max-w-[250px] mx-auto mb-8 leading-relaxed">
            您还没有收藏任何菜谱。去首页探索您的下一顿美食吧！
          </p>
          <Button asChild className="rounded-full shadow-button px-8">
            <Link to="/">
              浏览菜谱
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {favorites.map((fav) => (
            <div key={fav.id} className="relative group">
              <Button
                variant="secondary"
                size="icon"
                className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity rounded-full bg-background/80 hover:bg-background shadow-sm text-red-500 hover:text-red-600"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  toggleFavorite({ recipeId: fav.id, isFavorited: true })
                }}
                title="取消收藏"
              >
                <HeartOff className="h-4 w-4" />
              </Button>
              <RecipeCard 
                recipe={{
                  id: fav.id,
                  title: fav.title,
                  description: null,
                  cook_minutes: null,
                  servings: null,
                  first_image: fav.first_image,
                  tags: fav.tags,
                  avg_rating: null,
                }} 
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
