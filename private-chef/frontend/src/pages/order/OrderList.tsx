import { useOrders, useUpdateOrderStatus, Order } from '@/hooks/useOrders'
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Link } from 'react-router'
import { Plus, Check, CheckCircle2, Utensils, Calendar as CalendarIcon, FileText } from 'lucide-react'

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
    return <div className="text-center py-12">正在加载订单...</div>
  }

  if (isError) {
    return <div className="text-center py-12 text-destructive">加载订单失败。</div>
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">订单</h1>
          <p className="text-muted-foreground mt-1">管理您的用餐计划和订单请求。</p>
        </div>
        <Button asChild>
          <Link to="/order/create">
            <Plus className="h-4 w-4 mr-2" />
            新建订单
          </Link>
        </Button>
      </div>

      {sortedDates.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border-dashed">
          <Utensils className="h-12 w-12 mb-4 opacity-20" />
          <p className="text-lg font-medium">暂无订单</p>
          <p className="text-sm">创建一个订单以开始安排您的用餐计划。</p>
        </Card>
      ) : (
        <div className="space-y-10">
          {sortedDates.map((date) => (
            <div key={date} className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-xl font-semibold">{formatMealDate(date)}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedOrders[date].map((order) => (
                  <Card key={order.id} className="flex flex-col">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            {mealTypeLabel(order.mealType)}
                          </CardTitle>
                          <CardDescription>订单 #{order.id}</CardDescription>
                        </div>
                        <Badge variant={statusColor(order.status)}>
                          {order.status === 'pending' ? '待确认' : order.status === 'confirmed' ? '已确认' : '已完成'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                      {order.note && (
                        <div className="text-sm text-muted-foreground bg-muted p-2 rounded-md flex items-start gap-2">
                          <FileText className="h-4 w-4 shrink-0 mt-0.5" />
                          <p>{order.note}</p>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium border-b pb-1">菜品</h4>
                        <ul className="space-y-2">
                          {order.items.map((item) => (
                            <li key={item.id} className="flex items-start justify-between text-sm gap-2">
                              <span className="truncate flex-1">{item.recipeTitle}</span>
                              <span className="font-medium text-muted-foreground shrink-0">x{item.quantity}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                    
                    {(order.status === 'pending' || order.status === 'confirmed') && (
                      <CardFooter className="pt-2">
                        {order.status === 'pending' && (
                          <Button 
                            variant="outline" 
                            className="w-full" 
                            size="sm"
                            disabled={isUpdating}
                            onClick={() => handleUpdateStatus(order.id, 'confirmed')}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            确认订单
                          </Button>
                        )}
                        {order.status === 'confirmed' && (
                          <Button 
                            variant="default" 
                            className="w-full" 
                            size="sm"
                            disabled={isUpdating}
                            onClick={() => handleUpdateStatus(order.id, 'completed')}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            标记为已完成
                          </Button>
                        )}
                      </CardFooter>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
