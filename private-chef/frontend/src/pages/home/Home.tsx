import { useState } from 'react'
import { Link } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { Star, ChefHat, HandPlatter, ClipboardList, AlertCircle, Loader2 } from 'lucide-react'
import { useHomeSummary, type ActiveOrderSummary, type RecentOrderSummary } from '@/hooks/useHomeSummary'
import { useCurrentUser } from '@/hooks/useAuth'
import { useUpdateOrderStatus, type OrderStatus } from '@/hooks/useOrders'
import { OrderCard, type OrderCardData } from '@/components/order/OrderCard'
import { Button } from '@/components/ui/button'
import { ShareDialog } from '@/components/share/ShareDialog'
import { useToast } from '@/components/ui/use-toast'
import { HomeHeader } from '@/components/home/HomeHeader'
import { AchievementStats } from '@/components/home/AchievementStats'
import { HomeShortcuts } from '@/components/home/HomeShortcuts'
import { HomeRecipeRail } from '@/components/home/HomeRecipeRail'
import { HomeRecentComments } from '@/components/home/HomeRecentComments'

function activeToCardData(order: ActiveOrderSummary): OrderCardData {
  return {
    id: order.id,
    status: order.status as OrderStatus,
    mealType: order.mealType,
    mealDate: order.mealDate,
    createdAt: order.createdAt,
    isMine: order.isMine,
    hasCook: order.cook != null,
    cookUserId: order.cook?.userId ?? null,
    cookDisplayName: order.cook?.displayName ?? null,
    requesterDisplayName: order.requester.displayName,
    items: order.items.map((it) => ({
      recipeId: it.recipeId,
      recipeTitle: it.recipeTitle,
      image: it.image,
    })),
  }
}

function recentToCardData(order: RecentOrderSummary, currentUserId: number | null): OrderCardData {
  return {
    id: order.id,
    status: order.status as OrderStatus,
    mealType: order.mealType,
    mealDate: order.mealDate,
    createdAt: order.createdAt,
    isMine: !!currentUserId && order.requester.userId === currentUserId,
    hasCook: false,
    cookUserId: null,
    cookDisplayName: null,
    requesterDisplayName: order.requester.displayName,
    items: order.recipeTitles.map((title, idx) => ({
      recipeId: idx,
      recipeTitle: title,
      image: null,
    })),
  }
}

export default function Home() {
  const { data, isLoading, isError } = useHomeSummary()
  const { data: currentUser } = useCurrentUser()
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateOrderStatus()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [shareDialogOpen, setShareDialogOpen] = useState(false)

  const handleUpdateStatus = (
    orderId: number,
    next: 'confirmed' | 'preparing' | 'completed' | 'cancelled',
  ) => {
    updateStatus(
      { id: orderId, status: next },
      {
        onSuccess: () => {
          const labelMap: Record<string, string> = {
            confirmed: '已接单',
            preparing: '已开火',
            completed: '已完成',
            cancelled: '已取消',
          }
          toast({
            title: '订单已更新',
            description: `状态已更新为 ${labelMap[next] ?? next}。`,
          })
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

  const myActiveOrders = data.activeOrders.filter((order) => order.isMine)
  const acceptableOrders = data.activeOrders.filter((order) => order.canAccept)
  const otherActiveOrders = data.activeOrders.filter(
    (order) => !order.isMine && !order.canAccept,
  )
  const hasAnyActive = data.activeOrders.length > 0

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <HomeHeader
        displayName={currentUser?.display_name ?? null}
        onShareMenu={() => setShareDialogOpen(true)}
      />

      {hasAnyActive && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-brand-100 text-brand-700">
                <HandPlatter className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-ink-900">进行中的点单</h2>
              <span className="text-xs font-semibold text-ink-500 bg-cream-100 px-2 py-0.5 rounded-full">
                {data.activeOrders.length}
              </span>
            </div>
            <Link
              to="/orders"
              className="text-sm font-medium text-brand-700 hover:text-brand bg-brand-100 px-3 py-1 rounded-full transition-colors"
            >
              全部
            </Link>
          </div>

          {myActiveOrders.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-ink-500">我的点单</p>
              {myActiveOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={activeToCardData(order)}
                  currentUserId={currentUser?.id ?? null}
                  mode="compact"
                  onAction={handleUpdateStatus}
                  isPending={isUpdating}
                />
              ))}
            </div>
          )}

          {acceptableOrders.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-ink-500">等你接单</p>
              {acceptableOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={activeToCardData(order)}
                  currentUserId={currentUser?.id ?? null}
                  mode="compact"
                  onAction={handleUpdateStatus}
                  isPending={isUpdating}
                />
              ))}
            </div>
          )}

          {otherActiveOrders.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-ink-500">家人的点单</p>
              {otherActiveOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={activeToCardData(order)}
                  currentUserId={currentUser?.id ?? null}
                  mode="compact"
                  onAction={handleUpdateStatus}
                  isPending={isUpdating}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <AchievementStats
        totalOrders={data.achievementSummary.totalOrders}
        totalCooks={data.achievementSummary.totalCooks}
      />

      <HomeShortcuts />

      <HomeRecipeRail
        title="今日推荐"
        icon={<Star className="w-5 h-5 fill-current" />}
        iconClassName="bg-amber-100 text-amber-500"
        recipes={data.recommendedRecipes}
        countLabel={(n) => `点过 ${n} 次`}
      />

      <HomeRecipeRail
        title="常点好菜"
        icon={<ChefHat className="w-5 h-5" />}
        iconClassName="bg-brand-100 text-brand-700"
        recipes={data.frequentRecipes}
        countLabel={(n) => `做过 ${n} 次`}
      />

      {data.recentOrders.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cream-200 text-ink-700">
              <ClipboardList className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-ink-900">最近订单动态</h2>
          </div>
          <div className="space-y-2">
            {data.recentOrders.slice(0, 3).map((order) => (
              <OrderCard
                key={order.id}
                order={recentToCardData(order, currentUser?.id ?? null)}
                currentUserId={currentUser?.id ?? null}
                mode="default"
                onAction={handleUpdateStatus}
                isPending={isUpdating}
              />
            ))}
          </div>
        </div>
      )}

      <HomeRecentComments comments={data.recentComments} />

      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        title="分享今日菜单"
        shareCardEndpoint="/api/home/share-card"
        shareActionEndpoint="/api/home/share"
        invalidateKeys={[['home-summary']]}
      />
    </div>
  )
}
