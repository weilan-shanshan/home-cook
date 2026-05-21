import { useState, useMemo } from 'react'
import { Loader2 } from 'lucide-react'
import { Link } from 'react-router'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { OrderCard, type OrderCardData } from '@/components/order/OrderCard'
import { useOrders, useUpdateOrderStatus, type Order } from '@/hooks/useOrders'
import { useCurrentUser } from '@/hooks/useAuth'
import { useToast } from '@/components/ui/use-toast'
import { mealTypeLabel } from '@/lib/order-status'

const TABS = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '等接手' },
  { value: 'cooking', label: '正在做' },
  { value: 'done', label: '已完成' },
] as const
type TabKey = (typeof TABS)[number]['value']

function formatRelativeTime(iso: string): string {
  const ts = new Date(iso.replace(' ', 'T')).getTime()
  const diffMin = Math.floor((Date.now() - ts) / 60000)
  if (diffMin < 1) return '刚刚'
  if (diffMin < 60) return `${diffMin} 分钟前`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH} 小时前`
  return new Date(ts).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

function mapStatus(o: Order): 'pending' | 'cooking' | 'done' {
  switch (o.status) {
    case 'pending':
    case 'submitted':
      return 'pending'
    case 'confirmed':
    case 'preparing':
      return 'cooking'
    case 'completed':
    case 'cancelled':
    default:
      return 'done'
  }
}

export default function OrderList() {
  const [tab, setTab] = useState<TabKey>('all')

  const { data: orders = [], isLoading, isError } = useOrders()
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateOrderStatus()
  const { data: currentUser } = useCurrentUser()
  const { toast } = useToast()

  const currentUserId = currentUser?.id ?? null

  function toCardData(o: Order): OrderCardData {
    const uiStatus = mapStatus(o)
    const requesterName = o.userId === currentUserId ? '我' : '家人'
    const cookName = o.cookUserId != null ? '掌勺人' : null
    const meta = cookName
      ? `${requesterName} 想吃 · ${cookName}`
      : `${requesterName} 想吃 · 还没人接手`

    return {
      id: o.id,
      no: `${mealTypeLabel(o.mealType)} #${o.id}`,
      meta,
      agoLabel: formatRelativeTime(o.createdAt),
      status: uiStatus,
      note: o.note ?? null,
      items: o.items.map((it) => ({
        id: it.id,
        recipeId: it.recipeId,
        name: it.recipeTitle,
        cover: it.image?.thumbUrl ?? it.image?.url ?? null,
        quantity: it.quantity,
        // avgRating / ratingCount / favorited / durationMin not available from useOrders()
        // — RatingBadge and heart button hide gracefully when undefined
      })),
    }
  }

  function handlePrimary(o: Order) {
    const next =
      o.status === 'submitted' || o.status === 'pending'
        ? 'confirmed'
        : o.status === 'confirmed'
          ? 'preparing'
          : 'completed'

    updateStatus(
      { id: o.id, status: next },
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

  const counts: Record<TabKey, number> = useMemo(
    () => ({
      all: orders.length,
      pending: orders.filter((o) => mapStatus(o) === 'pending').length,
      cooking: orders.filter((o) => mapStatus(o) === 'cooking').length,
      done: orders.filter((o) => mapStatus(o) === 'done').length,
    }),
    [orders],
  )

  const groups: Record<TabKey, Order[]> = useMemo(
    () => ({
      all: orders,
      pending: orders.filter((o) => mapStatus(o) === 'pending'),
      cooking: orders.filter((o) => mapStatus(o) === 'cooking'),
      done: orders.filter((o) => mapStatus(o) === 'done'),
    }),
    [orders],
  )

  return (
    <main className="space-y-4 pb-20">
      <header>
        <h1 className="font-serif text-3xl text-ink-900">订单</h1>
      </header>

      {isLoading && (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-ink-500">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm">正在加载订单...</span>
        </div>
      )}

      {isError && (
        <div className="text-center text-rose-500 text-sm py-12">订单加载失败</div>
      )}

      {!isLoading && !isError && orders.length === 0 && (
        <div className="text-center text-ink-500 text-sm py-12">
          还没有订单 — 去{' '}
          <Link to="/menu" className="text-brand font-bold">
            点菜
          </Link>{' '}
          吧
        </div>
      )}

      {!isLoading && !isError && orders.length > 0 && (
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
          <TabsList className="bg-transparent p-0 gap-2 overflow-x-auto -mx-4 px-4 justify-start h-auto">
            {TABS.map((t) => {
              const active = tab === t.value
              const count = counts[t.value]
              return (
                <TabsTrigger
                  key={t.value}
                  value={t.value}
                  className="rounded-full h-9 px-3.5 text-sm data-[state=active]:bg-ink-900 data-[state=active]:text-white data-[state=active]:shadow-none bg-cream-100 text-ink-700 cursor-pointer"
                >
                  {t.label}
                  {count > 0 && (
                    <span
                      className={`ml-1.5 inline-flex items-center justify-center min-w-[20px] h-5 rounded-full px-1 text-[11px] ${active ? 'bg-white/20 text-white' : 'bg-ink-900 text-white'}`}
                    >
                      {count}
                    </span>
                  )}
                </TabsTrigger>
              )
            })}
          </TabsList>
          {TABS.map((t) => (
            <TabsContent key={t.value} value={t.value} className="space-y-3 mt-4">
              {groups[t.value].map((o) => {
                const uiStatus = mapStatus(o)
                return (
                  <OrderCard
                    key={o.id}
                    {...toCardData(o)}
                    primaryDisabled={isUpdating}
                    onPrimary={uiStatus !== 'done' ? () => handlePrimary(o) : undefined}
                  />
                )
              })}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </main>
  )
}
