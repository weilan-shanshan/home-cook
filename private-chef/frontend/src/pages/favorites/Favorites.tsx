import { Link } from 'react-router'
import { Heart, HeartOff } from 'lucide-react'
import { useFavorites, useToggleFavorite } from '@/hooks/useFavorites'
import { RecipeCard } from '@/components/recipe/RecipeCard'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function Favorites() {
  const { data: favorites, isLoading } = useFavorites()
  const { mutate: toggleFavorite } = useToggleFavorite()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">收藏</h1>
        <p className="text-muted-foreground mt-1">您最喜欢的菜谱都在这里。</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">正在加载...</div>
      ) : !favorites?.length ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Heart className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium">暂无收藏</h3>
            <p className="text-muted-foreground mt-1 max-w-sm">
              您还没有收藏任何菜谱。去首页探索您的下一顿美食吧！
            </p>
            <div className="mt-6">
              <Link to="/" className="text-primary hover:underline font-medium">浏览菜谱 →</Link>
            </div>
          </CardContent>
        </Card>
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
