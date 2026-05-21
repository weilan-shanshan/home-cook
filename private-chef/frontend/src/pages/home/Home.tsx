import { useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { AlertCircle, Loader2 } from 'lucide-react'
import { useHomeSummary } from '@/hooks/useHomeSummary'
import { useCurrentUser } from '@/hooks/useAuth'
import { useUpdateOrderStatus } from '@/hooks/useOrders'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { StatTile } from '@/components/home/StatTile'
import { HomeHeroCTA } from '@/components/home/HomeHeroCTA'
import { HomeActiveOrdersCard } from '@/components/home/HomeActiveOrdersCard'
import { HomeCommentsCard } from '@/components/home/HomeCommentsCard'
import { HomeWishCard } from '@/components/home/HomeWishCard'
import { HomeAchievementProgressCard } from '@/components/home/HomeAchievementProgressCard'
import { RecentDishRail, type RailDish } from '@/components/home/RecentDishRail'

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
  const { mutate: updateStatus } = useUpdateOrderStatus()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // Keep accept logic for active orders that canAccept
  const handleAccept = (orderId: string | number) => {
    updateStatus(
      { id: orderId as number, status: 'confirmed' },
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
  // handleAccept is kept for potential future CTA; suppress unused warning
  void handleAccept

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

  // "今日推荐" rail — recommendedRecipes
  const recommendedDishes: RailDish[] = data.recommendedRecipes.map((r) => ({
    id: r.recipeId,
    name: r.title,
    cover: r.image?.thumbUrl ?? r.image?.url ?? null,
    // avg_rating not in RecipeCardSummary — leave undefined; RatingBadge hides gracefully
  }))

  // "家里常点" rail — frequentRecipes with orderCount as subtitle
  const frequentDishes: RailDish[] = data.frequentRecipes.map((r) => ({
    id: r.recipeId,
    name: r.title,
    cover: r.image?.thumbUrl ?? r.image?.url ?? null,
    subtitle: `${r.orderCount} 次`,
  }))

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
      <HomeActiveOrdersCard orders={data.activeOrders} />

      {/* 4. Stats 2-col */}
      <div className="grid grid-cols-2 gap-3">
        <StatTile tone="mustard" label="全部点单" value={`${totalOrders} 单`} hint="累计点单数" />
        <StatTile tone="sage" label="掌勺" value={`${totalCooks} 次`} hint="累计主厨次数" />
      </div>

      {/* 5. 今日推荐 */}
      {recommendedDishes.length > 0 && (
        <RecentDishRail title="今日推荐" dishes={recommendedDishes} viewAllPath="/menu" />
      )}

      {/* 6. 家里常点 */}
      {frequentDishes.length > 0 && (
        <RecentDishRail title="家里常点" dishes={frequentDishes} viewAllPath="/menu" />
      )}

      {/* 7. Recent comments */}
      <HomeCommentsCard comments={data.recentComments} />

      {/* 8. Wish card — hides itself when empty */}
      <HomeWishCard />

      {/* 9. Achievement progress */}
      <HomeAchievementProgressCard summary={data.achievementSummary} />
    </div>
  )
}
