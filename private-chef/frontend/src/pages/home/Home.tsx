import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { AlertCircle, Loader2 } from 'lucide-react'
import { useHomeSummary } from '@/hooks/useHomeSummary'
import { useCurrentUser } from '@/hooks/useAuth'
import { useUpdateOrderStatus } from '@/hooks/useOrders'
import { useFavorites } from '@/hooks/useFavorites'
import { useRecipes } from '@/hooks/useRecipes'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { StatTile } from '@/components/home/StatTile'
import { HomeHeroCTA } from '@/components/home/HomeHeroCTA'
import { HomeActiveOrdersCard } from '@/components/home/HomeActiveOrdersCard'
import { HomeCommentsCard } from '@/components/home/HomeCommentsCard'
import { HomeWishCard } from '@/components/home/HomeWishCard'
import { HomeAchievementProgressCard } from '@/components/home/HomeAchievementProgressCard'
import { HomeRecommendedGrid } from '@/components/home/HomeRecommendedGrid'
import { HomeFrequentList } from '@/components/home/HomeFrequentList'
import { HomeRecentCooksCard } from '@/components/home/HomeRecentCooksCard'
import { HomeNewRecipesCard } from '@/components/home/HomeNewRecipesCard'

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 6) return '深夜好'
  if (h < 11) return '早上好'
  if (h < 13) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
}

export default function Home() {
  const { data, isLoading, isError } = useHomeSummary()
  const { data: currentUser } = useCurrentUser()
  const { data: favorites = [] } = useFavorites()
  const { data: recipesData } = useRecipes({ limit: 50 })
  const { mutate: updateStatus } = useUpdateOrderStatus()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const allRecipes = useMemo(
    () => recipesData?.pages.flatMap((p) => p.data) ?? [],
    [recipesData],
  )

  // Build recipeId → tags map for cross-reference enrichment
  const recipeTagsMap = useMemo(() => {
    const m = new Map<number, import('@/hooks/useRecipes').RecipeTag[]>()
    for (const r of allRecipes) {
      if (r.tags.length > 0) m.set(r.id, r.tags)
    }
    return m
  }, [allRecipes])

  const handleAccept = (orderId: number) => {
    updateStatus(
      { id: orderId, status: 'confirmed' },
      {
        onSuccess: () => {
          toast({ title: '已接单', description: '订单状态已更新为已接单。' })
          queryClient.invalidateQueries({ queryKey: ['home-summary'] })
        },
        onError: (err) => {
          toast({
            variant: 'destructive',
            title: '操作失败',
            description: (err as Error).message,
          })
        },
      },
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-ink-500 gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
        <p className="text-sm font-medium">正在准备今日菜单...</p>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 px-6 text-center">
        <div className="bg-rose-100 text-rose-500 p-4 rounded-3xl mb-2">
          <AlertCircle className="h-8 w-8" />
        </div>
        <p className="text-base font-semibold text-ink-900">哎呀，加载失败了</p>
        <p className="text-sm text-ink-500 mb-4">可能是网络开小差了，请刷新重试</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          重新加载
        </Button>
      </div>
    )
  }

  const displayName = currentUser?.display_name ?? currentUser?.username ?? null

  // Stats
  const totalOrders = data.achievementSummary.totalOrders
  const totalCooks = data.achievementSummary.totalCooks
  const favCount = favorites.length
  const recommendedCount = data.recommendedRecipes.length

  return (
    <div className="space-y-5 pb-12 animate-in fade-in duration-500">
      {/* 1. Header row */}
      <div className="flex items-start justify-between pt-2">
        <div>
          <div className="text-xs text-ink-500">{getGreeting()}</div>
          <div className="font-serif text-3xl leading-tight text-ink-900">
            {displayName ?? '朋友'}
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/profile')}
          aria-label="个人中心"
          className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-semibold cursor-pointer"
        >
          厨
        </button>
      </div>

      {/* 2. Hero CTA */}
      <HomeHeroCTA />

      {/* 3. Active orders — hidden when empty */}
      <HomeActiveOrdersCard orders={data.activeOrders} onAccept={handleAccept} />

      {/* 4. Stats 2×2 */}
      <div className="grid grid-cols-2 gap-3">
        <StatTile tone="mustard" label="累计点单" value={`${totalOrders}`} hint="单" />
        <StatTile tone="sage"    label="累计掌勺" value={`${totalCooks}`}  hint="次" />
        <StatTile tone="cream"   label="收藏菜"   value={`${favCount}`}    hint="道" />
        <StatTile tone="cream"   label="今日推荐" value={`${recommendedCount}`} hint="道菜" />
      </div>

      {/* 5. 今日推荐 2×2 grid */}
      <HomeRecommendedGrid dishes={data.recommendedRecipes} tagsMap={recipeTagsMap} />

      {/* 6. 家里常点 vertical list */}
      <HomeFrequentList dishes={data.frequentRecipes} tagsMap={recipeTagsMap} />

      {/* 6b. 最近烹饪 — completed orders only */}
      <HomeRecentCooksCard orders={data.recentOrders} />

      {/* 6c. 新菜来啦 — newest recipes */}
      <HomeNewRecipesCard recipes={allRecipes} />

      {/* 7. Recent comments */}
      <HomeCommentsCard comments={data.recentComments} />

      {/* 8a. 心愿单 (full width) */}
      <HomeWishCard />

      {/* 8b. 成就 (full width) */}
      <HomeAchievementProgressCard summary={data.achievementSummary} />
    </div>
  )
}
