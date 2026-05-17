import { Link } from 'react-router'
import { useHomeSummary, type ActiveOrderSummary } from '@/hooks/useHomeSummary'
import { useCurrentUser } from '@/hooks/useAuth'
import { useUpdateOrderStatus } from '@/hooks/useOrders'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Utensils,
  ClipboardList,
  Heart,
  PlusCircle,
  Star,
  ChefHat,
  MessageSquare,
  Clock,
  Share2,
  Sparkles,
  AlertCircle,
  HandPlatter,
  Hand,
  CookingPot,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ShareDialog } from '@/components/share/ShareDialog'
import { useState } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { useQueryClient } from '@tanstack/react-query'

function formatRelativeTime(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return '刚刚'

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) return `${diffInMinutes}分钟前`

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}小时前`

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) return `${diffInDays}天前`

  return date.toLocaleDateString('zh-CN')
}

function mealTypeLabel(mealType: string) {
  switch (mealType) {
    case 'breakfast':
      return '早餐'
    case 'lunch':
      return '午餐'
    case 'dinner':
      return '晚餐'
    case 'snack':
      return '加餐'
    default:
      return mealType
  }
}

function statusLabel(status: string) {
  switch (status) {
    case 'submitted':
    case 'pending':
      return '待接单'
    case 'confirmed':
      return '已接单'
    case 'preparing':
      return '制作中'
    default:
      return status
  }
}

function statusTone(status: string) {
  switch (status) {
    case 'submitted':
    case 'pending':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300'
    case 'confirmed':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300'
    case 'preparing':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300'
    default:
      return 'bg-muted text-foreground/70'
  }
}

function ActiveOrderCard({
  order,
  currentUserId,
  onUpdateStatus,
  isUpdating,
}: {
  order: ActiveOrderSummary
  currentUserId: number | null
  onUpdateStatus: (orderId: number, next: 'confirmed' | 'preparing' | 'completed') => void
  isUpdating: boolean
}) {
  const previewItems = order.items.slice(0, 4)
  const remainingCount = Math.max(order.items.length - previewItems.length, 0)

  // Once an order leaves the "submitted" stage, advancing it is a family-wide
  // affordance — any member can push it forward, not only the cook. The
  // backend's status-update endpoint already accepts any family member.
  let primaryAction: { label: string; icon: React.ReactNode; next: 'confirmed' | 'preparing' | 'completed' } | null =
    null
  if (order.canAccept) {
    primaryAction = { label: '我来接单', icon: <Hand className="h-4 w-4" />, next: 'confirmed' }
  } else if (order.status === 'confirmed') {
    primaryAction = { label: '去制作', icon: <CookingPot className="h-4 w-4" />, next: 'preparing' }
  } else if (order.status === 'preparing') {
    primaryAction = { label: '出锅完成', icon: <CheckCircle2 className="h-4 w-4" />, next: 'completed' }
  }

  return (
    <div className="glass-card rounded-2xl p-4 shadow-card border border-border/50 dark:border-white/5 group transition-all duration-300 hover:border-primary/20">
      <div className="flex items-center gap-2 flex-wrap mb-3">
        {order.isMine && (
          <Badge className="rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-primary/15 text-primary border-0">
            我的点单
          </Badge>
        )}
        {!order.isMine && order.canAccept && (
          <Badge className="rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-orange-500/15 text-orange-600 border-0">
            等你接单
          </Badge>
        )}
        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${statusTone(order.status)}`}>
          {statusLabel(order.status)}
        </span>
        <span className="text-[11px] font-medium text-muted-foreground ml-auto">
          {formatRelativeTime(order.createdAt)}
        </span>
      </div>

      <Link to={`/orders/${order.id}`} className="block group">
        <div className="flex items-center gap-2 mb-2.5">
          <span className="text-base font-extrabold text-foreground tracking-tight">
            {mealTypeLabel(order.mealType)}
          </span>
          <span className="text-[11px] font-semibold text-muted-foreground bg-secondary/60 px-2 py-0.5 rounded-full">
            #{order.id}
          </span>
          <span className="text-[11px] font-medium text-muted-foreground">{order.mealDate}</span>
        </div>

        {previewItems.length > 0 && (
          <div className="flex gap-2 overflow-hidden mb-3">
            {previewItems.map((item) => (
              <div key={item.recipeId} className="flex-none w-16">
                <div className="aspect-square rounded-xl bg-secondary/60 overflow-hidden border border-black/5 dark:border-white/5">
                  {item.image ? (
                    <img
                      src={item.image.thumbUrl || item.image.url}
                      alt={item.recipeTitle}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
                      <Utensils className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <p className="mt-1 text-[10px] font-semibold text-foreground/80 line-clamp-1">{item.recipeTitle}</p>
              </div>
            ))}
            {remainingCount > 0 && (
              <div className="flex-none w-16 aspect-square rounded-xl bg-secondary/40 flex items-center justify-center text-[11px] font-bold text-muted-foreground border border-dashed border-border">
                +{remainingCount}
              </div>
            )}
          </div>
        )}

        <p className="text-[12px] font-medium text-muted-foreground line-clamp-1">
          <span className="text-foreground/80 font-semibold">{order.requester.displayName}</span> 点单
          {order.cook ? (
            <>
              <span className="mx-1.5 text-muted-foreground/50">·</span>
              <span className="text-foreground/80 font-semibold">{order.cook.displayName}</span> 掌勺
            </>
          ) : (
            <span className="ml-1.5 text-orange-600 font-semibold">尚无大厨</span>
          )}
        </p>
      </Link>

      {primaryAction && currentUserId !== null && (
        <div className="mt-3 pt-3 border-t border-border/50 flex">
          <Button
            size="sm"
            disabled={isUpdating}
            onClick={() => onUpdateStatus(order.id, primaryAction!.next)}
            className="flex-1 rounded-xl shadow-button font-bold gap-1.5"
          >
            {primaryAction.icon}
            {primaryAction.label}
          </Button>
        </div>
      )}
    </div>
  )
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
    next: 'confirmed' | 'preparing' | 'completed',
  ) => {
    updateStatus(
      { id: orderId, status: next },
      {
        onSuccess: () => {
          const labelMap: Record<string, string> = {
            confirmed: '已接单',
            preparing: '已开火',
            completed: '已完成',
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
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-muted-foreground gap-5 animate-in fade-in zoom-in-95 duration-500">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
          <div className="bg-white/80 dark:bg-black/50 p-4 rounded-3xl shadow-elevated relative">
            <Utensils className="h-8 w-8 animate-bounce text-primary/80" />
          </div>
        </div>
        <p className="text-sm font-medium tracking-wide">正在准备今日菜单...</p>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 animate-in fade-in zoom-in-95 duration-500 px-6 text-center">
        <div className="bg-destructive/10 p-4 rounded-3xl text-destructive mb-2">
          <AlertCircle className="h-8 w-8" />
        </div>
        <p className="text-base font-semibold text-foreground">哎呀，加载失败了</p>
        <p className="text-sm text-muted-foreground mb-4">可能是网络开小差了，请刷新重试</p>
        <Button variant="outline" className="rounded-full shadow-button px-8" onClick={() => window.location.reload()}>
          重新加载
        </Button>
      </div>
    )
  }

  const currentUserId = currentUser?.id ?? null
  const myActiveOrders = data.activeOrders.filter((order) => order.isMine)
  const acceptableOrders = data.activeOrders.filter((order) => order.canAccept)
  const otherActiveOrders = data.activeOrders.filter(
    (order) => !order.isMine && !order.canAccept,
  )
  const hasAnyActive = data.activeOrders.length > 0

  return (
    <div className="space-y-8 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col gap-5 pt-2">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              私厨 <Sparkles className="h-6 w-6 text-primary fill-primary/20" />
            </h1>
            <p className="text-muted-foreground text-sm font-medium">
              {currentUser?.display_name ? `${currentUser.display_name}，` : ''}今天想吃点什么？
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full shadow-button bg-white/50 backdrop-blur-md border-primary/10 hover:bg-primary/5 text-primary"
            onClick={() => setShareDialogOpen(true)}
          >
            <Share2 className="mr-1.5 h-4 w-4" />
            分享菜单
          </Button>
        </div>
      </div>

      {/* Active orders — surfaced as the first thing the family sees */}
      {hasAnyActive && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-primary/15 p-1.5 rounded-lg">
                <HandPlatter className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl font-bold tracking-tight">进行中的点单</h2>
              <span className="text-xs font-semibold text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">
                {data.activeOrders.length}
              </span>
            </div>
            <Link
              to="/orders"
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors bg-primary/5 px-3 py-1 rounded-full"
            >
              全部
            </Link>
          </div>

          {myActiveOrders.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">我的点单</p>
              {myActiveOrders.map((order) => (
                <ActiveOrderCard
                  key={order.id}
                  order={order}
                  currentUserId={currentUserId}
                  onUpdateStatus={handleUpdateStatus}
                  isUpdating={isUpdating}
                />
              ))}
            </div>
          )}

          {acceptableOrders.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-orange-600">等你接单</p>
              {acceptableOrders.map((order) => (
                <ActiveOrderCard
                  key={order.id}
                  order={order}
                  currentUserId={currentUserId}
                  onUpdateStatus={handleUpdateStatus}
                  isUpdating={isUpdating}
                />
              ))}
            </div>
          )}

          {otherActiveOrders.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">家人的点单</p>
              {otherActiveOrders.map((order) => (
                <ActiveOrderCard
                  key={order.id}
                  order={order}
                  currentUserId={currentUserId}
                  onUpdateStatus={handleUpdateStatus}
                  isUpdating={isUpdating}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Achievements */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card rounded-[var(--radius-card)] p-4 shadow-card border border-border/50 dark:border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 group-hover:opacity-20 transition-all duration-500">
            <Utensils className="h-16 w-16 text-primary" />
          </div>
          <div className="relative z-10 flex flex-col gap-1.5">
            <div className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center mb-1">
              <Utensils className="h-4 w-4 text-primary" />
            </div>
            <span className="text-2xl font-black">{data.achievementSummary.totalOrders}</span>
            <p className="text-xs font-semibold text-muted-foreground">总点餐数</p>
          </div>
        </div>
        <div className="glass-card rounded-[var(--radius-card)] p-4 shadow-card border border-border/50 dark:border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 group-hover:opacity-20 transition-all duration-500">
            <ChefHat className="h-16 w-16 text-secondary-foreground" />
          </div>
          <div className="relative z-10 flex flex-col gap-1.5">
            <div className="bg-secondary w-8 h-8 rounded-full flex items-center justify-center mb-1">
              <ChefHat className="h-4 w-4 text-secondary-foreground" />
            </div>
            <span className="text-2xl font-black">{data.achievementSummary.totalCooks}</span>
            <p className="text-xs font-semibold text-muted-foreground">被掌勺数</p>
          </div>
        </div>
      </div>

      {/* Shortcuts */}
      <div className="grid grid-cols-4 gap-3">
        <Link to="/menu" className="flex flex-col items-center gap-2.5 p-3 rounded-2xl hover:bg-white/60 dark:hover:bg-white/5 transition-colors active:scale-95 duration-200">
          <div className="bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-800/20 p-3.5 rounded-[1.25rem] text-blue-600 dark:text-blue-400 shadow-sm border border-blue-200/50 dark:border-blue-700/30">
            <Utensils className="h-6 w-6" />
          </div>
          <span className="text-xs font-semibold text-foreground/80">点菜</span>
        </Link>
        <Link to="/orders" className="flex flex-col items-center gap-2.5 p-3 rounded-2xl hover:bg-white/60 dark:hover:bg-white/5 transition-colors active:scale-95 duration-200">
          <div className="bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-900/40 dark:to-orange-800/20 p-3.5 rounded-[1.25rem] text-orange-600 dark:text-orange-400 shadow-sm border border-orange-200/50 dark:border-orange-700/30">
            <ClipboardList className="h-6 w-6" />
          </div>
          <span className="text-xs font-semibold text-foreground/80">我的订单</span>
        </Link>
        <Link to="/favorites" className="flex flex-col items-center gap-2.5 p-3 rounded-2xl hover:bg-white/60 dark:hover:bg-white/5 transition-colors active:scale-95 duration-200">
          <div className="bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/40 dark:to-red-800/20 p-3.5 rounded-[1.25rem] text-red-600 dark:text-red-400 shadow-sm border border-red-200/50 dark:border-red-700/30">
            <Heart className="h-6 w-6" />
          </div>
          <span className="text-xs font-semibold text-foreground/80">收藏</span>
        </Link>
        <Link to="/recipe/new" className="flex flex-col items-center gap-2.5 p-3 rounded-2xl hover:bg-white/60 dark:hover:bg-white/5 transition-colors active:scale-95 duration-200">
          <div className="bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/40 dark:to-green-800/20 p-3.5 rounded-[1.25rem] text-green-600 dark:text-green-400 shadow-sm border border-green-200/50 dark:border-green-700/30">
            <PlusCircle className="h-6 w-6" />
          </div>
          <span className="text-xs font-semibold text-foreground/80">发布菜品</span>
        </Link>
      </div>

      {/* Recommended Recipes */}
      {data.recommendedRecipes.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="bg-yellow-100/50 dark:bg-yellow-500/10 p-1.5 rounded-lg">
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">今日推荐</h2>
          </div>
          <div className="flex overflow-x-auto pb-4 -mx-4 px-4 gap-4 snap-x snap-mandatory hide-scrollbar">
            {data.recommendedRecipes.map((recipe) => (
              <Link
                key={recipe.recipeId}
                to={`/recipe/${recipe.recipeId}`}
                className="flex-none w-[160px] snap-center group"
              >
                <div className="aspect-[4/5] rounded-[1.5rem] bg-secondary/50 overflow-hidden mb-3 relative shadow-sm border border-black/5 dark:border-white/5">
                  {recipe.image ? (
                    <img
                      src={recipe.image.thumbUrl || recipe.image.url}
                      alt={recipe.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted/30 text-muted-foreground/30">
                      <Utensils className="h-10 w-10" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <h3 className="font-bold line-clamp-1 group-hover:text-primary transition-colors text-foreground/90">{recipe.title}</h3>
                <p className="text-[11px] font-medium text-muted-foreground mt-0.5">点过 {recipe.orderCount} 次</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Frequent Recipes */}
      {data.frequentRecipes.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="bg-red-100/50 dark:bg-red-500/10 p-1.5 rounded-lg">
              <Heart className="h-5 w-5 text-red-500 fill-red-500" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">常点好菜</h2>
          </div>
          <div className="flex overflow-x-auto pb-4 -mx-4 px-4 gap-4 snap-x snap-mandatory hide-scrollbar">
            {data.frequentRecipes.map((recipe) => (
              <Link
                key={recipe.recipeId}
                to={`/recipe/${recipe.recipeId}`}
                className="flex-none w-[200px] snap-center group"
              >
                <div className="aspect-[16/10] rounded-[1.5rem] bg-secondary/50 overflow-hidden mb-3 relative shadow-sm border border-black/5 dark:border-white/5">
                  {recipe.image ? (
                    <img
                      src={recipe.image.thumbUrl || recipe.image.url}
                      alt={recipe.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted/30 text-muted-foreground/30">
                      <Utensils className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-sm line-clamp-1 group-hover:text-primary transition-colors text-foreground/90">{recipe.title}</h3>
                <p className="text-[11px] font-medium text-muted-foreground mt-0.5">累计 {recipe.orderCount} 次</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders */}
      {data.recentOrders.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-blue-100/50 dark:bg-blue-500/10 p-1.5 rounded-lg">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <h2 className="text-xl font-bold tracking-tight">最近订单动态</h2>
            </div>
            <Link to="/orders" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors bg-primary/5 px-3 py-1 rounded-full">
              全部
            </Link>
          </div>
          <div className="grid gap-3">
            {data.recentOrders.map((order) => (
              <Link key={order.id} to={`/orders/${order.id}`} className="block group">
                <div className="glass-card rounded-2xl p-4 shadow-card border border-border/50 dark:border-white/5 group-hover:border-primary/20 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant={order.status === 'completed' ? 'default' : 'secondary'} className="rounded-full px-2.5 py-0.5 font-semibold text-[10px] shadow-sm">
                      {order.status === 'completed' ? '已完成' :
                       order.status === 'confirmed' ? '已接单' :
                       order.status === 'submitted' ? '待处理' : '已取消'}
                    </Badge>
                    <span className="text-xs font-medium text-muted-foreground">
                      {formatRelativeTime(order.createdAt)}
                    </span>
                  </div>
                  <p className="font-bold text-[15px] leading-snug line-clamp-1 mb-1.5 group-hover:text-primary transition-colors">
                    {order.recipeTitles.join('、') || '无菜品'}
                  </p>
                  <p className="text-[13px] font-medium text-muted-foreground">
                    <span className="text-foreground/80">{order.requester.displayName}</span> 点了 {mealTypeLabel(order.mealType)} ({order.mealDate})
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Comments */}
      {data.recentComments.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="bg-green-100/50 dark:bg-green-500/10 p-1.5 rounded-lg">
              <MessageSquare className="h-5 w-5 text-green-500" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">最新评论</h2>
          </div>
          <div className="grid gap-3">
            {data.recentComments.map((comment) => (
              <Link key={comment.id} to={`/orders/${comment.orderId}`} className="block group">
                <div className="glass-card rounded-2xl p-4 shadow-card border border-border/50 dark:border-white/5 group-hover:border-primary/20 transition-all duration-300">
                  <div className="flex items-start gap-3.5">
                    <Avatar className="h-10 w-10 border-2 border-background shadow-sm ring-1 ring-black/5">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">{comment.displayName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[15px] font-bold">{comment.displayName}</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4.5 rounded-full border-primary/20 text-primary/80 bg-primary/5">
                            {comment.roleType === 'cook' ? '大厨' : '食客'}
                          </Badge>
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">
                          {formatRelativeTime(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-[14px] leading-relaxed text-foreground/80 line-clamp-2">
                        {comment.contentPreview}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        title="分享今日菜单"
        shareCardEndpoint="/api/home/share-card"
        shareActionEndpoint="/api/home/share"
        invalidateKeys={[["home-summary"]]}
      />
    </div>
  )
}
