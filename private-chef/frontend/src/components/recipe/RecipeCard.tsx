import { Link } from 'react-router'
import { Clock, Star, ChefHat, Users, Heart } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useFavorites, useToggleFavorite } from '@/hooks/useFavorites'
import { Button } from '@/components/ui/button'

interface RecipeCardProps {
  recipe: {
    id: number
    title: string
    description: string | null
    cook_minutes: number | null
    servings: number | null
    first_image: { url: string; thumb_url: string | null } | null
    tags: Array<{ id: number; name: string }>
    avg_rating: number | null
  }
  actionSlot?: React.ReactNode
  onClick?: (e: React.MouseEvent) => void
}

export function RecipeCard({ recipe, actionSlot, onClick }: RecipeCardProps) {
  const { data: favorites } = useFavorites()
  const { mutate: toggleFavorite, isPending } = useToggleFavorite()

  const isFavorited = favorites?.some((f) => f.id === recipe.id) ?? false

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault() // prevent navigating to detail page
    e.stopPropagation()
    toggleFavorite({ recipeId: recipe.id, isFavorited })
  }

  const content = (
    <div className="glass-card flex flex-col h-full overflow-hidden transition-all hover:shadow-hover hover:-translate-y-1 relative">
      <div className="absolute top-2 left-2 z-10">
        <Button
          variant="secondary"
          size="icon"
          className={`h-8 w-8 rounded-full bg-background/80 backdrop-blur-md shadow-sm transition-colors hover:bg-background ${isFavorited ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}
          onClick={handleFavoriteClick}
          disabled={isPending}
        >
          <Heart className={`h-4 w-4 ${isFavorited ? 'fill-current' : ''}`} />
        </Button>
      </div>
      <div className="relative aspect-video w-full overflow-hidden bg-muted/50">
        {recipe.first_image ? (
          <img
            src={recipe.first_image.thumb_url || recipe.first_image.url}
            alt={recipe.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground bg-secondary/50">
            <ChefHat className="h-12 w-12 opacity-20" />
          </div>
        )}
        {recipe.avg_rating != null && (
          <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-background/80 backdrop-blur-md px-2 py-1 text-xs font-semibold shadow-sm">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            {recipe.avg_rating.toFixed(1)}
          </div>
        )}
      </div>
      <div className="flex flex-col flex-1 p-4 space-y-3">
        <h3 className="font-semibold text-lg leading-tight line-clamp-1 group-hover:text-primary transition-colors">
          {recipe.title}
        </h3>
        
        <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
          {recipe.description || '暂无描述。'}
        </p>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {recipe.tags.slice(0, 3).map((tag) => (
            <Badge key={tag.id} variant="secondary" className="px-1.5 py-0 text-[10px]">
              {tag.name}
            </Badge>
          ))}
          {recipe.tags.length > 3 && (
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
              +{recipe.tags.length - 3}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground pt-2 mt-auto border-t border-border/50">
          <div className="flex items-center gap-4">
            {recipe.cook_minutes && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>{recipe.cook_minutes}分钟</span>
              </div>
            )}
            {recipe.servings && (
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                <span>{recipe.servings} 人份</span>
              </div>
            )}
          </div>
          {actionSlot && <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>{actionSlot}</div>}
        </div>
      </div>
    </div>
  )

  if (onClick) {
    return (
      <div onClick={onClick} className="group block cursor-pointer h-full">
        {content}
      </div>
    )
  }

  return (
    <Link to={`/recipe/${recipe.id}`} className="group block h-full">
      {content}
    </Link>
  )
}
