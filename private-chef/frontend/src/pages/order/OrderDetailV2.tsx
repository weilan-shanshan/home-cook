import { useParams, useNavigate } from 'react-router'
import { useOrder, OrderItem, OrderStatusEvent, OrderStatus, useUpdateOrderStatus } from '@/hooks/useOrders'
import { useToggleOrderLike } from '@/hooks/useOrderInteractions'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'
import { OrderCommentThread } from '@/components/comment/OrderCommentThread'
import { OrderReviewCard } from '@/components/comment/OrderReviewCard'
import { Heart, Share2, Copy, Calendar as CalendarIcon, Clock, User } from 'lucide-react'
import { ShareDialog } from '@/components/share/ShareDialog'
import { useState } from 'react'

function statusColor(status: string) {
  switch (status) {
    case 'pending':
    case 'submitted': return 'outline'
    case 'confirmed': 
    case 'preparing': return 'default'
    case 'completed': return 'secondary'
    case 'cancelled': return 'destructive'
    default: return 'outline'
  }
}

function mealTypeLabel(type: string) {
  switch (type) {
    case 'breakfast': return '早餐'
    case 'lunch': return '午餐'
    case 'dinner': return '晚餐'
    case 'snack': return '加餐'
    default: return type
  }
}

function statusLabel(status: string) {
  switch (status) {
    case 'pending': return '待确认'
    case 'submitted': return '已提交'
    case 'confirmed': return '已确认'
    case 'preparing': return '制作中'
    case 'completed': return '已完成'
    case 'cancelled': return '已取消'
    default: return status
  }
}

const formatDate = (dateString: string) => {
  const d = new Date(dateString)
  return `${d.getMonth() + 1}-${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

export default function OrderDetailV2() {
  const { id } = useParams()
  const orderId = Number(id)
  const navigate = useNavigate()
  const { toast } = useToast()

  const { data: order, isLoading, error } = useOrder(orderId)
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateOrderStatus()
  const { mutate: toggleLike, isPending: isLikePending } = useToggleOrderLike(orderId)
  const isSharePending = false
  const [shareDialogOpen, setShareDialogOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="p-4 space-y-4 max-w-2xl mx-auto animate-pulse">
        <div className="h-40 w-full bg-muted rounded-xl" />
        <div className="h-64 w-full bg-muted rounded-xl" />
        <div className="h-32 w-full bg-muted rounded-xl" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>无法加载订单详情</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/orders')}>返回列表</Button>
      </div>
    )
  }

  const handleUpdateStatus = (nextStatus: OrderStatus) => {
    updateStatus({ id: orderId, status: nextStatus }, {
      onSuccess: () => {
        toast({ title: '订单状态已更新' })
      }
    })
  }

  const handleLike = () => {
    toggleLike({ isLikedByMe: order.isLikedByMe })
  }

  const handleShare = () => {
    setShareDialogOpen(true)
  }

  const handleReorder = () => {
    navigate(`/menu/create-order?from=${orderId}`)
  }

  const renderActionButtons = () => {
    if (order.status === 'pending' || order.status === 'submitted') {
      return <Button className="w-full mt-4" onClick={() => handleUpdateStatus('confirmed')} disabled={isUpdating}>确认订单</Button>
    }
    if (order.status === 'confirmed') {
      return <Button className="w-full mt-4" onClick={() => handleUpdateStatus('preparing')} disabled={isUpdating}>开始制作</Button>
    }
    if (order.status === 'preparing') {
      return <Button className="w-full mt-4" onClick={() => handleUpdateStatus('completed')} disabled={isUpdating}>完成订单</Button>
    }
    return null
  }

  return (
      <div className="p-4 max-w-2xl mx-auto pb-24 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">
            {mealTypeLabel(order.mealType)}
            <span className="text-muted-foreground font-normal ml-2 text-lg">
              {new Date(order.mealDate).toLocaleDateString()}
            </span>
          </h1>
          <div className="flex items-center text-sm text-muted-foreground gap-4">
            <span className="flex items-center gap-1"><CalendarIcon className="w-4 h-4" /> {order.createdAt.substring(0, 10)} 下单</span>
          </div>
        </div>
        <Badge variant={statusColor(order.status) as "default" | "secondary" | "outline" | "destructive"} className="text-sm py-1">
          {statusLabel(order.status)}
        </Badge>
      </div>

      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">点单人</p>
                  <p className="text-muted-foreground">{order.requester?.displayName || `用户 ${order.requester?.userId}`}</p>
                </div>
              </div>
              
              {order.cook && (
                <div className="flex items-center gap-2 text-sm text-right">
                  <div>
                    <p className="font-medium text-foreground">大厨</p>
                    <p className="text-muted-foreground">{order.cook.displayName || `用户 ${order.cook.userId}`}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-secondary-foreground" />
                  </div>
                </div>
              )}
            </div>
            {renderActionButtons()}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">菜品清单</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {order.items.map((item: OrderItem) => (
              <li key={item.id} className="flex justify-between items-center text-sm rounded-xl border border-border/40 bg-background/60 px-3 py-2.5">
                <div className="flex items-center gap-3">
                  {item.image?.thumbUrl ? (
                    <img src={item.image.thumbUrl} alt={item.recipeTitle} className="w-12 h-12 object-cover rounded-md shadow-sm" />
                  ) : (
                    <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground shadow-sm">暂无图</div>
                  )}
                  <span className="font-medium text-base">{item.recipeTitle || `菜品 #${item.recipeId}`}</span>
                </div>
                <span className="text-muted-foreground font-medium">x{item.quantity}</span>
              </li>
            ))}
          </ul>
          {order.note && (
            <>
              <Separator className="my-4" />
              <div className="text-sm">
                <span className="font-medium text-foreground">备注：</span>
                <p className="mt-1 text-muted-foreground">{order.note}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {order.statusTimeline && order.statusTimeline.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">状态追踪</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              {order.statusTimeline.map((event: OrderStatusEvent, index: number) => (
                <div key={event.id} className="relative flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 border-2 border-background shrink-0 z-10">
                      <Clock className="w-3 h-3 text-primary" />
                    </div>
                    {index !== order.statusTimeline.length - 1 && (
                      <div className="w-px h-full bg-border my-1 -ml-px absolute top-6 bottom-0 left-3" />
                    )}
                  </div>
                  <div className="flex-1 pb-6">
                    <p className="text-sm font-medium text-foreground">
                      {statusLabel(event.toStatus)}
                      {event.operatorDisplayName && <span className="font-normal text-muted-foreground ml-2">by {event.operatorDisplayName}</span>}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(event.createdAt)}</p>
                     {event.note && <p className="text-sm mt-2 text-muted-foreground bg-muted/70 p-2.5 rounded-lg border border-border/40">{event.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {order.status === 'completed' && <OrderReviewCard orderId={orderId} />}

      <OrderCommentThread orderId={orderId} />

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-md border-t border-border/60 flex items-center justify-around gap-2 pb-safe z-10">
        <Button 
          variant={order.isLikedByMe ? "default" : "outline"}
          className={`flex-1 ${order.isLikedByMe ? 'bg-rose-500 hover:bg-rose-600 border-rose-500 text-white' : ''}`}
          onClick={handleLike}
          disabled={isLikePending}
        >
          <Heart className={`w-4 h-4 mr-2 ${order.isLikedByMe ? 'fill-current text-white' : ''}`} />
          {order.likeCount > 0 ? `赞 (${order.likeCount})` : '点赞'}
        </Button>
        <Button variant="outline" className="flex-1" onClick={handleShare} disabled={isSharePending}>
          <Share2 className="w-4 h-4 mr-2" />
          {order.shareCount > 0 ? `分享 (${order.shareCount})` : '分享'}
        </Button>
        <Button className="flex-1" onClick={handleReorder}>
          <Copy className="w-4 h-4 mr-2" />
          再来一单
        </Button>
      </div>

      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        title="分享这份订单"
        shareCardEndpoint={`/api/orders/${orderId}/share-card`}
        shareActionEndpoint={`/api/orders/${orderId}/share`}
        invalidateKeys={[["order", orderId], ["orders"]]}
      />
    </div>
  )
}
