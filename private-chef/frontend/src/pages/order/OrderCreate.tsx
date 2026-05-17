import { useEffect, useMemo, useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router'
import { useRecipes } from '@/hooks/useRecipes'
import { useCreateOrder, useOrder, CreateOrderParams, MealType } from '@/hooks/useOrders'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, Search, Loader2, Utensils } from 'lucide-react'
import { OrderItemRow } from '@/components/order/OrderItemRow'

interface SelectedItem {
  recipe_id: number
  quantity: number
  title: string
  thumb_url: string | null
}

export default function OrderCreate() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { toast } = useToast()
  const createOrder = useCreateOrder()

  const today = new Date().toISOString().split('T')[0]

  const [mealType, setMealType] = useState<MealType>('lunch')
  const [mealDate, setMealDate] = useState(today)
  const [note, setNote] = useState('')
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([])

  const [q, setQ] = useState('')
  const { data: recipesData, isLoading: isLoadingRecipes } = useRecipes({
    limit: 50,
    q,
  })

  const fromOrderId = Number(searchParams.get('from')) || 0
  const { data: previousOrder } = useOrder(fromOrderId)

  useEffect(() => {
    if (previousOrder && previousOrder.items) {
      setSelectedItems(
        previousOrder.items.map((item) => ({
          recipe_id: item.recipeId,
          quantity: item.quantity,
          title: item.recipeTitle,
          thumb_url: item.image?.thumbUrl || item.image?.url || null,
        }))
      )
      setMealType(previousOrder.mealType)
      setNote(previousOrder.note || '')
    }
  }, [previousOrder])

  const recipes = useMemo(() => {
    return recipesData?.pages.flatMap((page) => page.data) || []
  }, [recipesData])

  useEffect(() => {
    const rawItems = searchParams.get('items')
    if (!rawItems) {
      return
    }

    try {
      const parsed = JSON.parse(rawItems) as SelectedItem[]
      if (Array.isArray(parsed) && parsed.length > 0) {
        setSelectedItems(parsed)
      }
    } catch {
      // ignore malformed query payloads
    }
  }, [searchParams])

  const handleAddItem = (recipeId: number, title: string, thumbUrl: string | null) => {
    setSelectedItems((prev) => {
      const existing = prev.find((item) => item.recipe_id === recipeId)
      if (existing) {
        return prev.map((item) =>
          item.recipe_id === recipeId ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prev, { recipe_id: recipeId, quantity: 1, title, thumb_url: thumbUrl }]
    })
  }

  const handleUpdateQuantity = (recipeId: number, delta: number) => {
    setSelectedItems((prev) =>
      prev
        .map((item) =>
          item.recipe_id === recipeId
            ? { ...item, quantity: item.quantity + delta }
            : item,
        )
        .filter((item) => item.quantity > 0),
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedItems.length === 0) {
      toast({
        title: '校验错误',
        description: '请至少为订单选择一个菜谱。',
        variant: 'destructive',
      })
      return
    }

    const payload: CreateOrderParams = {
      meal_type: mealType,
      meal_date: mealDate,
      note: note.trim() || undefined,
      items: selectedItems.map((item) => ({
        recipe_id: item.recipe_id,
        quantity: item.quantity,
      })),
    }

    try {
      const createdOrder = await createOrder.mutateAsync(payload)
      toast({ title: '订单创建成功！' })
      navigate(`/orders/${createdOrder.id}`)
    } catch (err: unknown) {
      let errorMessage = '发生意外错误。'
      if (err instanceof Error) {
        errorMessage = err.message
      }
      toast({
        title: '创建订单时出错',
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-32 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-cream-100 flex items-center justify-center text-ink-900"
          aria-label="返回"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-900">新建订单</h1>
      </div>

      {/* Meal type + date */}
      <div className="bg-white rounded-3xl border border-cream-300 p-4 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-ink-500">用餐信息</h3>

        <div className="space-y-2">
          <Label className="text-ink-700 text-sm">用餐类型</Label>
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'breakfast', label: '早餐' },
              { key: 'lunch', label: '午餐' },
              { key: 'dinner', label: '晚餐' },
              { key: 'snack', label: '加餐' },
            ].map(({ key, label }) => (
              <Badge
                key={key}
                variant={mealType === key ? 'default' : 'outline'}
                onClick={() => setMealType(key as MealType)}
                className="cursor-pointer px-3 py-1.5 rounded-full text-sm font-bold"
              >
                {label}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="meal_date" className="text-ink-700 text-sm">日期</Label>
          <Input
            id="meal_date"
            type="date"
            required
            value={mealDate}
            onChange={(e) => setMealDate(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="note" className="text-ink-700 text-sm">备注（可选）</Label>
          <Textarea
            id="note"
            placeholder="有任何特殊要求或说明吗？"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="resize-y min-h-[80px]"
          />
        </div>
      </div>

      {/* Selected items */}
      <div className="bg-white rounded-3xl border border-cream-300 p-4 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-ink-500">已选菜品</h3>

        {selectedItems.length === 0 ? (
          <div className="text-center text-ink-500 text-sm py-6">
            还没选菜 —{' '}
            <Link to="/menu" className="text-brand font-bold">
              去点菜
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-cream-300">
            {selectedItems.map((item) => (
              <OrderItemRow
                key={item.recipe_id}
                item={{
                  recipeId: item.recipe_id,
                  recipeTitle: item.title,
                  quantity: item.quantity,
                  image: item.thumb_url
                    ? { url: item.thumb_url, thumbUrl: item.thumb_url }
                    : null,
                }}
                editable
                onQuantityChange={(delta) => handleUpdateQuantity(item.recipe_id, delta)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recipe browser */}
      <div className="bg-white rounded-3xl border border-cream-300 p-4 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-ink-500">浏览菜谱</h3>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-ink-400" />
          <Input
            type="search"
            placeholder="搜索以添加..."
            className="pl-9 pr-4"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          {isLoadingRecipes ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-brand" />
            </div>
          ) : recipes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-ink-500 text-center">
              <Utensils className="h-8 w-8 opacity-20 mb-2" />
              <p className="text-sm">未找到符合您搜索的菜谱。</p>
            </div>
          ) : (
            recipes.map((recipe) => {
              const thumbUrl = recipe.first_image?.thumb_url || recipe.first_image?.url || null
              return (
                <div
                  key={recipe.id}
                  className="flex items-center gap-3 p-3 rounded-2xl border border-cream-200 hover:border-brand/40 bg-cream-50 transition-colors"
                >
                  {thumbUrl ? (
                    <img
                      src={thumbUrl}
                      alt={recipe.title}
                      className="w-12 h-12 rounded-xl object-cover bg-cream-100 flex-none"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-cream-100 flex items-center justify-center text-ink-400 flex-none">
                      <Utensils className="h-5 w-5 opacity-40" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-ink-900 line-clamp-1">{recipe.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {recipe.tags?.slice(0, 2).map((t: { id: number; name: string }) => (
                        <Badge key={t.id} variant="secondary" className="text-[9px] px-1 py-0">
                          {t.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="shrink-0 rounded-full font-bold"
                    onClick={() => handleAddItem(recipe.id, recipe.title, thumbUrl)}
                  >
                    添加
                  </Button>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Sticky submit bar */}
      <div
        className="fixed left-0 right-0 z-30 px-4 py-3 bg-white/95 backdrop-blur border-t border-cream-300 max-w-md mx-auto"
        style={{ bottom: 'var(--app-tabbar-height, 4rem)' }}
      >
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            取消
          </Button>
          <Button
            type="submit"
            disabled={createOrder.isPending || selectedItems.length === 0}
            className="flex-1"
          >
            {createOrder.isPending ? '提交中...' : '提交点单'}
          </Button>
        </div>
      </div>
    </form>
  )
}
