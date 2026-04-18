import { Link } from 'react-router'
import { useHomeSummary } from '@/hooks/useHomeSummary'
import { Card, CardContent, } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Loader2, Utensils, ClipboardList, Heart, PlusCircle, Star, ChefHat, MessageSquare, Clock } from 'lucide-react'

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

export default function Home() {
  const { data, isLoading, isError } = useHomeSummary()

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-muted-foreground gap-4 animate-in fade-in">
        <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
        <p className="text-sm font-medium">加载主页中...</p>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-muted-foreground gap-4 animate-in fade-in">
        <p className="text-sm font-medium text-destructive">加载失败，请刷新重试</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header / Achievements */}
      <div className="flex flex-col gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">私厨</h1>
          <p className="text-muted-foreground text-sm">今天想吃点什么？</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-primary/5 border-primary/20 shadow-none">
            <CardContent className="p-3 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <Utensils className="h-4 w-4 text-primary" />
                <span className="text-xl font-bold">{data.achievementSummary.totalOrders}</span>
              </div>
              <p className="text-xs font-medium text-muted-foreground">总点餐数</p>
            </CardContent>
          </Card>
          <Card className="bg-secondary/30 border-secondary shadow-none">
            <CardContent className="p-3 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <ChefHat className="h-4 w-4 text-secondary-foreground" />
                <span className="text-xl font-bold">{data.achievementSummary.totalCooks}</span>
              </div>
              <p className="text-xs font-medium text-muted-foreground">被掌勺数</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Shortcuts */}
      <div className="grid grid-cols-4 gap-2">
        <Link to="/menu" className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-secondary/50 transition-colors">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full text-blue-600 dark:text-blue-400">
            <Utensils className="h-6 w-6" />
          </div>
          <span className="text-xs font-medium">点菜</span>
        </Link>
        <Link to="/orders" className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-secondary/50 transition-colors">
          <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-full text-orange-600 dark:text-orange-400">
            <ClipboardList className="h-6 w-6" />
          </div>
          <span className="text-xs font-medium">我的订单</span>
        </Link>
        <Link to="/favorites" className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-secondary/50 transition-colors">
          <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full text-red-600 dark:text-red-400">
            <Heart className="h-6 w-6" />
          </div>
          <span className="text-xs font-medium">收藏</span>
        </Link>
        <Link to="/recipe/new" className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-secondary/50 transition-colors">
          <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full text-green-600 dark:text-green-400">
            <PlusCircle className="h-6 w-6" />
          </div>
          <span className="text-xs font-medium">发布菜品</span>
        </Link>
      </div>

      {/* Recommended Recipes */}
      {data.recommendedRecipes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            <h2 className="text-lg font-semibold">今日推荐</h2>
          </div>
          <div className="flex overflow-x-auto pb-4 -mx-4 px-4 gap-4 snap-x snap-mandatory hide-scrollbar">
            {data.recommendedRecipes.map((recipe) => (
              <Link 
                key={recipe.recipeId} 
                to={`/recipe/${recipe.recipeId}`}
                className="flex-none w-[160px] snap-center group"
              >
                <div className="aspect-square rounded-xl bg-secondary/50 overflow-hidden mb-2 relative">
                  {recipe.image ? (
                    <img 
                      src={recipe.image.thumbUrl || recipe.image.url} 
                      alt={recipe.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                      <Utensils className="h-10 w-10" />
                    </div>
                  )}
                </div>
                <h3 className="font-medium line-clamp-1 group-hover:text-primary transition-colors">{recipe.title}</h3>
                <p className="text-xs text-muted-foreground">点过 {recipe.orderCount} 次</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Frequent Recipes */}
      {data.frequentRecipes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500 fill-red-500" />
            <h2 className="text-lg font-semibold">常点好菜</h2>
          </div>
          <div className="flex overflow-x-auto pb-4 -mx-4 px-4 gap-4 snap-x snap-mandatory hide-scrollbar">
            {data.frequentRecipes.map((recipe) => (
              <Link 
                key={recipe.recipeId} 
                to={`/recipe/${recipe.recipeId}`}
                className="flex-none w-[160px] snap-center group"
              >
                <div className="aspect-[4/3] rounded-xl bg-secondary/50 overflow-hidden mb-2 relative">
                  {recipe.image ? (
                    <img 
                      src={recipe.image.thumbUrl || recipe.image.url} 
                      alt={recipe.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                      <Utensils className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <h3 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">{recipe.title}</h3>
                <p className="text-xs text-muted-foreground">累计 {recipe.orderCount} 次</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders */}
      {data.recentOrders.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-semibold">最近订单动态</h2>
            </div>
            <Link to="/orders" className="text-sm text-primary hover:underline">
              全部
            </Link>
          </div>
          <div className="grid gap-3">
            {data.recentOrders.map((order) => (
              <Link key={order.id} to={`/orders/${order.id}`}>
                <Card className="hover:bg-secondary/20 transition-colors">
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={order.status === 'completed' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">
                          {order.status === 'completed' ? '已完成' : 
                           order.status === 'confirmed' ? '已接单' : 
                           order.status === 'submitted' ? '待处理' : '已取消'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(order.createdAt)}
                        </span>
                      </div>
                      <p className="font-medium text-sm line-clamp-1">
                        {order.recipeTitles.join('、') || '无菜品'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {order.requester.displayName} 点了 {order.mealType === 'lunch' ? '午餐' : order.mealType === 'dinner' ? '晚餐' : order.mealType} ({order.mealDate})
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Comments */}
      {data.recentComments.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-500" />
            <h2 className="text-lg font-semibold">最新评论</h2>
          </div>
          <div className="grid gap-3">
            {data.recentComments.map((comment) => (
              <Link key={comment.id} to={`/orders/${comment.orderId}`}>
                <Card className="hover:bg-secondary/20 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{comment.displayName[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium">{comment.displayName}</span>
                            <Badge variant="outline" className="text-[9px] px-1 h-4">
                              {comment.roleType === 'cook' ? '大厨' : '食客'}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {comment.contentPreview}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
