import { Link } from 'react-router'
import { Utensils } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RecipeCardSummary } from '@/hooks/useHomeSummary'

interface Props {
  title: string
  icon: React.ReactNode
  iconClassName?: string
  recipes: RecipeCardSummary[]
  countLabel: (count: number) => string
}

export function HomeRecipeRail({
  title,
  icon,
  iconClassName,
  recipes,
  countLabel,
}: Props) {
  if (recipes.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className={cn('p-1.5 rounded-lg', iconClassName ?? 'bg-brand-100 text-brand-700')}>
          {icon}
        </div>
        <h2 className="text-xl font-bold tracking-tight text-ink-900">{title}</h2>
      </div>
      <div className="flex overflow-x-auto pb-2 -mx-4 px-4 gap-3 snap-x snap-mandatory hide-scrollbar">
        {recipes.map((recipe) => (
          <Link
            key={recipe.recipeId}
            to={`/recipe/${recipe.recipeId}`}
            className="flex-none w-[140px] snap-center group"
          >
            <div className="aspect-[4/5] rounded-2xl bg-gradient-to-br from-brand-100 to-brand-300 overflow-hidden mb-2 border border-cream-300">
              {recipe.image ? (
                <img
                  src={recipe.image.thumbUrl || recipe.image.url}
                  alt={recipe.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/70">
                  <Utensils className="h-8 w-8" />
                </div>
              )}
            </div>
            <h3 className="font-bold text-sm line-clamp-1 text-ink-900 group-hover:text-brand transition-colors">
              {recipe.title}
            </h3>
            <p className="text-[10px] font-medium text-ink-500 mt-0.5">
              {countLabel(recipe.orderCount)}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
