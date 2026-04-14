import { useState, useMemo } from 'react'
import { useRecipes, useTags } from '@/hooks/useRecipes'
import { RecipeCard } from '@/components/recipe/RecipeCard'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Search, Filter, Loader2, X } from 'lucide-react'

export default function Home() {
  const [q, setQ] = useState('')
  const [tag, setTag] = useState<number | undefined>()

  const {
    data: recipesData,
    isLoading: isLoadingRecipes,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useRecipes({
    limit: 20,
    q,
    tag,
  })

  const { data: tagsData } = useTags()

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
  }

  const handleTagToggle = (id: number) => {
    setTag((prev) => (prev === id ? undefined : id))
  }

  const handleClearFilters = () => {
    setQ('')
    setTag(undefined)
  }

  const recipes = useMemo(() => {
    return recipesData?.pages.flatMap((page) => page.data) || []
  }, [recipesData])

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">您的菜谱</h1>
        
        <form onSubmit={handleSearch} className="flex gap-2 max-w-sm w-full relative">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="搜索菜谱..."
              className="pl-9 pr-4 bg-background/50 backdrop-blur-sm border-muted-foreground/20 focus-visible:ring-primary/50"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </form>
      </div>

      {(tagsData && tagsData.length > 0) || tag || q ? (
        <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-border/40">
          <Filter className="h-4 w-4 text-muted-foreground mr-2" />
          <span className="text-sm text-muted-foreground mr-2">标签：</span>
          {tagsData?.map((t) => (
            <Badge
              key={t.id}
              variant={tag === t.id ? 'default' : 'outline'}
              className="cursor-pointer transition-colors hover:bg-secondary"
              onClick={() => handleTagToggle(t.id)}
            >
              {t.name}
            </Badge>
          ))}
          {(tag || q) && (
            <Button variant="ghost" size="sm" onClick={handleClearFilters} className="ml-auto text-muted-foreground h-8 px-2 text-xs">
              <X className="h-3 w-3 mr-1" />
              清除筛选
            </Button>
          )}
        </div>
      ) : null}

      {isLoadingRecipes ? (
        <div className="flex items-center justify-center min-h-[400px] w-full">
          <div className="flex flex-col items-center gap-4 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
            <p className="text-sm font-medium">正在加载菜谱...</p>
          </div>
        </div>
      ) : recipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center glass-card border-dashed">
          <div className="rounded-full bg-secondary p-4 mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">未找到菜谱</h3>
          <p className="text-muted-foreground mb-6 max-w-[400px]">
            {q || tag ? '尝试调整您的搜索或筛选条件以查找您想要的内容。' : '从创建您的第一个菜谱开始。'}
          </p>
          {!(q || tag) && (
            <Button asChild>
              <a href="/recipe/new">创建菜谱</a>
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
          {hasNextPage && (
            <div className="flex justify-center pt-4 pb-8">
              <Button
                variant="outline"
                size="lg"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="w-full sm:w-auto min-w-[200px] glass-card hover:bg-secondary/50"
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    正在加载...
                  </>
                ) : (
                  '加载更多'
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
