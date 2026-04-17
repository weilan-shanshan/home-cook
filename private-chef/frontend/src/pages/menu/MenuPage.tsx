import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Search, ShoppingBag, Plus, Minus, ChevronRight, Utensils, Loader2 } from 'lucide-react'
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
    <div className="mx-auto max-w-6xl space-y-6 pb-28 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">点菜</h1>
        <p className="text-sm text-muted-foreground">挑选今天想吃的菜，加入清单后统一去下单。</p>
      </div>

      <div className="glass-card rounded-2xl p-4 shadow-sm sm:p-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="搜索菜品名称..."
            className="pl-9"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Badge
            variant={activeTag === undefined ? 'default' : 'outline'}
            className="cursor-pointer px-3 py-1"
            onClick={() => setActiveTag(undefined)}
          >
            全部
          </Badge>
          {tags.map((tag) => (
            <Badge
              key={tag.id}
              variant={activeTag === tag.id ? 'default' : 'outline'}
              className="cursor-pointer px-3 py-1"
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
            <div key={index} className="glass-card h-64 animate-pulse rounded-2xl bg-muted/40" />
          ))
        ) : recipes.length === 0 ? (
          <div className="glass-card col-span-full rounded-2xl p-10 text-center text-muted-foreground">
            <Utensils className="mx-auto mb-3 h-8 w-8 opacity-30" />
            <p className="text-sm">暂无符合条件的菜品，换个关键词或标签试试。</p>
          </div>
        ) : (
          recipes.map((recipe) => {
            const selected = selectedItems.find((item) => item.recipe_id === recipe.id)

            const actionSlot = selected ? (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="h-7 w-7 rounded-full"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(recipe.id, -1); }}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-4 text-center text-sm font-semibold">{selected.quantity}</span>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="h-7 w-7 rounded-full"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(recipe.id, 1); }}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <Button type="button" size="sm" className="h-7 rounded-full px-3 text-xs" onClick={(e) => { e.preventDefault(); e.stopPropagation(); addRecipe(recipe); }}>
                加入清单
              </Button>
            )

            return (
              <RecipeCard key={recipe.id} recipe={recipe} actionSlot={actionSlot} />
            )
          })
        )}
      </div>

      {hasNextPage && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="gap-2"
          >
            {isFetchingNextPage && <Loader2 className="h-4 w-4 animate-spin" />}
            {isFetchingNextPage ? '加载中...' : '加载更多'}
          </Button>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-20 z-40 px-4 sm:bottom-6 pointer-events-none">
        <div className="mx-auto max-w-3xl rounded-2xl border bg-background/95 p-4 shadow-2xl backdrop-blur pointer-events-auto">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">待下单清单</p>
                  <p className="text-xs text-muted-foreground">
                    已选 {selectedItems.length} 道菜，共 {totalSelectedCount} 份
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={handleGoToOrder}
                  disabled={selectedItems.length === 0}
                >
                  去下单
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>

              {selectedItems.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedItems.map((item) => (
                    <div
                      key={item.recipe_id}
                      className="flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-xs"
                    >
                      <span className="max-w-[140px] truncate font-medium">{item.title}</span>
                      <span className="text-muted-foreground">x{item.quantity}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">先从上面的列表选择想吃的菜。</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
