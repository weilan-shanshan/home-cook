import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Search, ShoppingBag, Plus, Minus, ChevronRight, Loader2, Sparkles, ChefHat } from 'lucide-react'
import { useRecipes, useTags } from '@/hooks/useRecipes'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RecipeCard } from '@/components/recipe/RecipeCard'

type SelectedRecipe = {
  recipe_id: number
  quantity: number
  title: string
  thumb_url: string | null
}

export default function MenuPage() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [activeTag, setActiveTag] = useState<number | undefined>(undefined)
  const [selectedItems, setSelectedItems] = useState<SelectedRecipe[]>([])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q), 300)
    return () => clearTimeout(timer)
  }, [q])

  const { data: tags = [] } = useTags()
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useRecipes({ limit: 20, q: debouncedQ, tag: activeTag })

  const recipes = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data])

  const totalSelectedCount = useMemo(
    () => selectedItems.reduce((sum, item) => sum + item.quantity, 0),
    [selectedItems],
  )
  const hasSelectedItems = selectedItems.length > 0

  const addRecipe = (recipe: (typeof recipes)[number]) => {
    const thumbUrl = recipe.first_image?.thumb_url || recipe.first_image?.url || null
    setSelectedItems((prev) => {
      const existing = prev.find((item) => item.recipe_id === recipe.id)
      if (existing) {
        return prev.map((item) =>
          item.recipe_id === recipe.id ? { ...item, quantity: item.quantity + 1 } : item,
        )
      }

      return [
        ...prev,
        {
          recipe_id: recipe.id,
          quantity: 1,
          title: recipe.title,
          thumb_url: thumbUrl,
        },
      ]
    })
  }

  const updateQuantity = (recipeId: number, delta: number) => {
    setSelectedItems((prev) =>
      prev
        .map((item) =>
          item.recipe_id === recipeId ? { ...item, quantity: item.quantity + delta } : item,
        )
        .filter((item) => item.quantity > 0),
    )
  }

  const handleGoToOrder = () => {
    const params = new URLSearchParams()
    params.set('items', JSON.stringify(selectedItems))
    navigate(`/menu/create-order?${params.toString()}`)
  }

  return (
    <div className={`space-y-6 animate-in fade-in duration-500 ${hasSelectedItems ? 'pb-40' : 'pb-8'}`}>
      <div className="space-y-2.5 pt-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
          点菜 <ChefHat className="h-6 w-6 text-primary fill-primary/20" />
        </h1>
        <p className="text-sm font-medium text-muted-foreground/80">挑选今天想吃的菜，加入清单后统一去下单。</p>
      </div>

      <div className="glass-card rounded-[var(--radius-card)] p-4 sm:p-5 shadow-card border border-border/50 dark:border-white/5">
        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <Input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="搜索你想吃的美味..."
            className="pl-11 h-12 rounded-full bg-background/80 border-border/50 focus-visible:ring-primary/20 focus-visible:bg-background text-base shadow-inner"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2.5">
          <Badge
            variant={activeTag === undefined ? 'default' : 'secondary'}
            className={`cursor-pointer px-4 py-1.5 rounded-full font-semibold shadow-sm transition-all duration-300 ${activeTag === undefined ? 'bg-primary text-primary-foreground shadow-button' : 'bg-secondary/60 hover:bg-secondary border-none'}`}
            onClick={() => setActiveTag(undefined)}
          >
            全部
          </Badge>
          {tags.map((tag) => (
            <Badge
              key={tag.id}
              variant={activeTag === tag.id ? 'default' : 'secondary'}
              className={`cursor-pointer px-4 py-1.5 rounded-full font-semibold shadow-sm transition-all duration-300 ${activeTag === tag.id ? 'bg-primary text-primary-foreground shadow-button' : 'bg-secondary/60 hover:bg-secondary border-none'}`}
              onClick={() => setActiveTag((current) => (current === tag.id ? undefined : tag.id))}
            >
              {tag.name}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="glass-card h-72 animate-pulse rounded-[1.5rem] bg-secondary/50 border border-border/50 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_2s_infinite]" />
            </div>
          ))
        ) : recipes.length === 0 ? (
            <div className="glass-card col-span-full rounded-[var(--radius-card)] p-12 text-center text-muted-foreground shadow-card border border-border/50 flex flex-col items-center justify-center gap-4">
            <div className="bg-primary/5 p-4 rounded-full">
              <Sparkles className="h-10 w-10 text-primary/40" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-bold text-foreground">没有找到相关的菜品</p>
              <p className="text-sm font-medium">换个关键词或者选择其他标签试试吧</p>
            </div>
            <Button variant="outline" className="rounded-full mt-2" onClick={() => {setQ(''); setActiveTag(undefined)}}>
              清除搜索条件
            </Button>
          </div>
        ) : (
          recipes.map((recipe) => {
            const selected = selectedItems.find((item) => item.recipe_id === recipe.id)

            const actionSlot = selected ? (
              <div className="flex items-center gap-2 bg-primary/5 p-1 rounded-full border border-primary/10 shadow-sm">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-full bg-white dark:bg-black/20 hover:bg-white dark:hover:bg-black/30 hover:text-primary shadow-sm"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(recipe.id, -1); }}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-5 text-center text-sm font-bold text-primary">{selected.quantity}</span>
                <Button
                  type="button"
                  size="icon"
                  className="h-8 w-8 rounded-full shadow-button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(recipe.id, 1); }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button type="button" size="sm" className="h-10 rounded-full px-5 text-sm font-bold shadow-button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); addRecipe(recipe); }}>
                加入清单
              </Button>
            )

            return (
              <div key={recipe.id}>
                <RecipeCard recipe={recipe} actionSlot={actionSlot} />
              </div>
            )
          })
        )}
      </div>

      {hasNextPage && (
        <div className="flex justify-center pt-6 pb-2">
          <Button
            variant="secondary"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="gap-2 rounded-full px-8 font-bold shadow-sm bg-white/60 hover:bg-white/90 dark:bg-white/5 border border-black/5"
          >
            {isFetchingNextPage && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
            {isFetchingNextPage ? '正在加载美味...' : '加载更多'}
          </Button>
        </div>
      )}

      {hasSelectedItems && (
        <div className="app-shell-floating-action">
          <div className="rounded-[var(--radius-modal)] border border-border/50 dark:border-white/10 bg-background/80 p-4 shadow-elevated backdrop-blur-xl pointer-events-auto transform transition-all duration-300 animate-in slide-in-from-bottom-8">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="rounded-full bg-primary p-3.5 text-primary-foreground shadow-button">
                  <ShoppingBag className="h-6 w-6" />
                </div>
                <div className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-background min-w-[20px] text-center">
                  {totalSelectedCount}
                </div>
              </div>
              <div className="min-w-0 flex-1 flex items-center justify-between gap-4">
                <div className="flex flex-col justify-center">
                  <p className="text-sm font-extrabold text-foreground tracking-tight">待下单清单</p>
                  <p className="text-[11px] font-semibold text-muted-foreground mt-0.5 line-clamp-1">
                    {selectedItems.map(i => i.title).join('、')}
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={handleGoToOrder}
                  className="rounded-full shadow-button font-bold px-5 whitespace-nowrap shrink-0"
                >
                  去下单
                  <ChevronRight className="ml-1 -mr-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
