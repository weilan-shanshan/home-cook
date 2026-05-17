import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { useOrders, useUpdateOrderStatus, type Order, type OrderStatus } from '@/hooks/useOrders'
import { useCurrentUser } from '@/hooks/useAuth'
import { useToast } from '@/components/ui/use-toast'
import { OrderCard, type OrderCardData } from '@/components/order/OrderCard'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const STATUS_FILTERS: Array<{ key: 'all' | OrderStatus; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'submitted', label: '待接单' },
  { key: 'confirmed', label: '已接单' },
  { key: 'preparing', label: '制作中' },
  { key: 'completed', label: '已完成' },
  { key: 'cancelled', label: '已取消' },
]

function toCardData(order: Order, currentUserId: number | null): OrderCardData {
  return {
    id: order.id,
    status: order.status,
    mealType: order.mealType,
    mealDate: order.mealDate,
    createdAt: order.createdAt,
    isMine: !!currentUserId && order.userId === currentUserId,
    hasCook: order.cookUserId != null,
    cookDisplayName: null,
    requesterDisplayName: order.userId === currentUserId ? '我' : '家人',
    items: order.items.map((it) => ({
      recipeId: it.recipeId,
      recipeTitle: it.recipeTitle,
      image: it.image,
    })),
  }
}

export default function OrderList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const recipeIdParam = searchParams.get('recipeId')
  const recipeIdFilter = recipeIdParam ? Number(recipeIdParam) : undefined
  const statusParam = searchParams.get('status') as OrderStatus | null
  const statusFilter = statusParam && statusParam !== ('all' as OrderStatus) ? statusParam : undefined

  const { data: orders, isLoading, isError } = useOrders({ recipeId: recipeIdFilter, status: statusFilter })
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateOrderStatus()
  const { data: currentUser } = useCurrentUser()
  const { toast } = useToast()

  const counts = useMemo(() => {
    const map: Partial<Record<OrderStatus | 'all', number>> = { all: orders?.length ?? 0 }
    orders?.forEach((o) => {
      map[o.status] = (map[o.status] ?? 0) + 1
    })
    return map
  }, [orders])

  const handleAction = (orderId: number, next: 'confirmed' | 'preparing' | 'completed' | 'cancelled') => {
    updateStatus(
      { id: orderId, status: next },
      {
        onError: (err) => {
          toast({
            title: '状态更新失败',
            description: err instanceof Error ? err.message : '请重试',
            variant: 'destructive',
          })
        },
      },
    )
  }

  const setStatus = (next: 'all' | OrderStatus) => {
    const params = new URLSearchParams(searchParams)
    if (next === 'all') params.delete('status')
    else params.set('status', next)
    setSearchParams(params)
  }

  const clearRecipeFilter = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('recipeId')
    setSearchParams(next)
  }

  const activeStatus: 'all' | OrderStatus = statusFilter ?? 'all'

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 pt-2">
        {recipeIdFilter && (
          <Link to="/orders" className="flex items-center text-sm text-ink-500 hover:text-ink-900">
            <ChevronLeft className="h-4 w-4 mr-1" />
            返回
          </Link>
        )}
        <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">订单</h1>
      </div>

      {recipeIdFilter && (
        <div>
          <div className="inline-flex items-center gap-2 bg-brand-100 text-brand-700 px-3 py-1.5 rounded-full text-xs font-bold">
            <span>筛选：包含菜品 #{recipeIdFilter}</span>
            <button
              type="button"
              aria-label="清除筛选"
              onClick={clearRecipeFilter}
              className="w-4 h-4 rounded-full bg-brand-700 text-white flex items-center justify-center text-[10px]"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1">
        {STATUS_FILTERS.map((f) => {
          const n = counts[f.key] ?? 0
          if (f.key !== 'all' && n === 0) return null
          const active = activeStatus === f.key
          return (
            <Badge
              key={f.key}
              variant={active ? 'default' : 'outline'}
              onClick={() => setStatus(f.key)}
              className={cn(
                'cursor-pointer flex-none px-3 py-1.5 rounded-full text-xs font-bold',
                active && 'bg-ink-900 text-white',
              )}
            >
              {f.label} {n > 0 && <span className="ml-1 opacity-80">{n}</span>}
            </Badge>
          )
        })}
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-ink-500">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm">正在加载订单...</span>
        </div>
      )}

      {isError && (
        <div className="text-center text-rose-500 text-sm py-12">订单加载失败</div>
      )}

      {!isLoading && !isError && (orders?.length ?? 0) === 0 && (
        <div className="text-center text-ink-500 text-sm py-12">
          还没有订单 — 去 <Link to="/menu" className="text-brand font-bold">点菜</Link> 吧
        </div>
      )}

      <div className="space-y-3">
        {orders?.map((o) => (
          <OrderCard
            key={o.id}
            order={toCardData(o, currentUser?.id ?? null)}
            currentUserId={currentUser?.id ?? null}
            mode="default"
            onAction={handleAction}
            isPending={isUpdating}
          />
        ))}
      </div>
    </div>
  )
}
