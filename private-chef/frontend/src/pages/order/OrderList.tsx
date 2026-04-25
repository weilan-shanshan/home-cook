import { useOrders, useUpdateOrderStatus, Order } from '@/hooks/useOrders'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Link } from 'react-router'
import { Plus, Check, CheckCircle2, Utensils, Calendar as CalendarIcon, FileText, ClipboardList, AlertCircle } from 'lucide-react'

function statusColor(status: Order['status']) {
  switch (status) {
    case 'pending':
      return 'outline'
    case 'confirmed':
      return 'default'
    case 'completed':
      return 'secondary'
    default:
      return 'outline'
  }
}

function mealTypeLabel(type: Order['mealType']) {
  switch (type) {
    case 'breakfast': return '早餐'
    case 'lunch': return '午餐'
    case 'dinner': return '晚餐'
    case 'snack': return '加餐'
    default: return type
  }
}

function formatMealDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('zh-CN', { dateStyle: 'medium' })
}

export default function OrderList() {
  const { data: orders, isLoading, isError } = useOrders()
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateOrderStatus()
  const { toast } = useToast()

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-muted-foreground gap-5 animate-in fade-in zoom-in-95 duration-500">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
          <div className="bg-white/80 dark:bg-black/50 p-4 rounded-3xl shadow-elevated relative">
            <ClipboardList className="h-8 w-8 animate-bounce text-primary/80" />
          </div>
        </div>
        <p className="text-sm font-medium tracking-wide">正在拉取订单...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 animate-in fade-in zoom-in-95 duration-500 px-6 text-center">
        <div className="bg-destructive/10 p-4 rounded-3xl text-destructive mb-2">
          <AlertCircle className="h-8 w-8" />
        </div>
        <p className="text-base font-semibold text-foreground">哎呀，订单加载失败了</p>
        <p className="text-sm text-muted-foreground mb-4">可能是网络开小差了，请重试</p>
        <Button variant="outline" className="rounded-full shadow-button px-8" onClick={() => window.location.reload()}>
          重新加载
        </Button>
      </div>
    )
  }

  const handleUpdateStatus = (id: number, status: 'confirmed' | 'completed') => {
    updateStatus({ id, status }, {
      onSuccess: () => {
        toast({
          title: '订单已更新',
          description: `订单状态已标记为 ${status === 'confirmed' ? '已确认' : '已完成'}。`,
        })
      },
      onError: (err) => {
        toast({
          variant: 'destructive',
          title: '更新失败',
          description: err.message,
        })
      }
    })
  }

  const groupedOrders = (orders || []).reduce((acc, order) => {
    const date = order.mealDate
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(order)
    return acc
  }, {} as Record<string, Order[]>)

  const sortedDates = Object.keys(groupedOrders).sort((a, b) => b.localeCompare(a))

  return (
    <div className="space-y-8 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between pt-2">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            订单
          </h1>
          <p className="text-muted-foreground text-sm font-medium">管理您的用餐计划和订单请求。</p>
        </div>
        <Button asChild className="rounded-full shadow-button bg-primary/10 text-primary hover:bg-primary/20 border-0">
          <Link to="/order/create">
            <Plus className="h-4 w-4 mr-1.5" />
            新建订单
          </Link>
        </Button>
      </div>

      {sortedDates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center text-muted-foreground animate-in fade-in zoom-in-95 duration-500">
            <div className="bg-secondary/50 p-6 rounded-full mb-6 border border-border/40 dark:border-white/5 shadow-sm">
            <Utensils className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <p className="text-lg font-bold text-foreground mb-2">暂无订单</p>
          <p className="text-sm text-muted-foreground max-w-[250px] mx-auto mb-8 leading-relaxed">
            创建一个订单以开始安排您的用餐计划，或是等待家人点单。
          </p>
          <Button asChild className="rounded-full shadow-button px-8">
            <Link to="/order/create">
              <Plus className="h-4 w-4 mr-2" />
              去点单
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-10">
          {sortedDates.map((date) => (
            <div key={date} className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-orange-100/50 dark:bg-orange-500/10 p-1.5 rounded-lg">
                  <CalendarIcon className="h-5 w-5 text-orange-500" />
                </div>
                <h2 className="text-xl font-bold tracking-tight">{formatMealDate(date)}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedOrders[date].map((order) => (
                  <div key={order.id} className="glass-card rounded-2xl p-5 shadow-card border border-border/50 dark:border-white/5 flex flex-col gap-4 relative overflow-hidden group transition-all duration-300 hover:shadow-elevated hover:border-primary/20">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-black text-foreground/90 tracking-tight">{mealTypeLabel(order.mealType)}</span>
                          <span className="text-[11px] font-bold text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">#{order.id}</span>
                        </div>
                      </div>
                      <Badge variant={statusColor(order.status)} className="rounded-full px-2.5 py-0.5 font-semibold text-[10px] shadow-sm">
                        {order.status === 'pending' ? '待确认' : order.status === 'confirmed' ? '已确认' : '已完成'}
                      </Badge>
                    </div>

                    <div className="space-y-3 flex-1">
                      {order.note && (
                        <div className="text-[13px] text-foreground/80 bg-orange-50/50 dark:bg-orange-900/10 p-3 rounded-xl flex items-start gap-2.5 border border-orange-100/50 dark:border-orange-800/30">
                          <FileText className="h-4 w-4 shrink-0 mt-0.5 text-orange-500/70" />
                          <p className="leading-relaxed">{order.note}</p>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <ul className="space-y-2.5 mt-2">
                          {order.items.map((item) => (
                            <li key={item.id} className="flex items-start justify-between text-[14px] gap-3">
                              <span className="font-semibold text-foreground/90 truncate flex-1">{item.recipeTitle}</span>
                              <span className="font-bold text-primary/80 shrink-0 bg-primary/5 px-2 py-0.5 rounded-md text-[13px]">x{item.quantity}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    {(order.status === 'pending' || order.status === 'confirmed') && (
                      <div className="pt-3 border-t border-border/50 mt-1 flex gap-2">
                        {order.status === 'pending' && (
                          <Button 
                            variant="outline" 
                            className="flex-1 rounded-xl shadow-sm border-primary/20 text-primary hover:bg-primary/5" 
                            size="sm"
                            disabled={isUpdating}
                            onClick={() => handleUpdateStatus(order.id, 'confirmed')}
                          >
                            <Check className="h-4 w-4 mr-1.5" />
                            确认订单
                          </Button>
                        )}
                        {order.status === 'confirmed' && (
                          <Button 
                            variant="default" 
                            className="flex-1 rounded-xl shadow-button font-bold" 
                            size="sm"
                            disabled={isUpdating}
                            onClick={() => handleUpdateStatus(order.id, 'completed')}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1.5" />
                            标记为已完成
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
