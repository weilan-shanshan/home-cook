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
import { DishThumb } from '@/components/recipe/DishThumb'
import { ArrowLeft, Search, Loader2, Utensils } from 'lucide-react'

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

  // Resolve ?ids= CSV param → pre-fill selected items once recipes load
  const idsParam = searchParams.get('ids') ?? ''
  const initialIds = useMemo(
    () => idsParam.split(',').map(s => s.trim()).filter(Boolean),
    [idsParam],
  )

  const recipes = useMemo(() => {
    return recipesData?.pages.flatMap((page) => page.data) || []
  }, [recipesData])

  // Pre-fill from ?ids= (runs once recipes are available)
  useEffect(() => {
    if (!initialIds.length || !recipes.length) return
    setSelectedItems(prev => {
      if (prev.length > 0) return prev // already seeded
      const matched = initialIds.flatMap(idStr => {
        const r = recipes.find(x => String(x.id) === idStr)
        if (!r) return []
        return [{
          recipe_id: r.id,
          quantity: 1,
          title: r.title,
          thumb_url: r.first_image?.thumb_url ?? r.first_image?.url ?? null,
        }]
      })
      return matched
    })
  }, [initialIds, recipes])

  // Pre-fill from legacy ?items=JSON param
  useEffect(() => {
    const rawItems = searchParams.get('items')
    if (!rawItems) return
    try {
      const parsed = JSON.parse(rawItems) as SelectedItem[]
      if (Array.isArray(parsed) && parsed.length > 0) {
        setSelectedItems(parsed)
      }
    } catch {
      // ignore malformed query payloads
    }
  }, [searchParams])

  // Pre-fill from ?from= (repeat order)
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

  const inc = (id: number) =>
    setSelectedItems(prev =>
      prev.map(x => x.recipe_id === id ? { ...x, quantity: x.quantity + 1 } : x)
    )

  const dec = (id: number) =>
    setSelectedItems(prev =>
      prev.flatMap(x => {
        if (x.recipe_id !== id) return [x]
        const next = x.quantity - 1
        return next <= 0 ? [] : [{ ...x, quantity: next }]
      })
    )

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

  const totalServings = selectedItems.reduce((s, i) => s + i.quantity, 0)

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-28">
      {/* Header */}
      <header className="flex items-center gap-3 -mt-1">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="返回"
          className="w-9 h-9 rounded-full bg-cream-100 flex items-center justify-center cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 text-ink-700" />
        </button>
        <h1 className="font-serif text-2xl text-ink-900">提交点单</h1>
      </header>

      {/* Meal info */}
      <section className="surface-card p-4 space-y-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-ink-400">用餐信息</div>

        <div className="space-y-2">
          <Label className="text-sm text-ink-700">用餐类型</Label>
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
                className="cursor-pointer px-3 py-1.5 rounded-full text-sm"
              >
                {label}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="meal_date" className="text-sm text-ink-700">日期</Label>
          <Input
            id="meal_date"
            type="date"
            required
            value={mealDate}
            onChange={(e) => setMealDate(e.target.value)}
          />
        </div>
      </section>

      {/* Selected dishes */}
      <section className="surface-card p-4">
        <div className="text-sm text-ink-500 mb-3">
          {selectedItems.length > 0 ? `${selectedItems.length} 道菜` : '还没选菜'}
        </div>

        {selectedItems.length === 0 ? (
          <div className="text-center text-ink-400 text-sm py-4">
            从下方浏览或{' '}
            <Link to="/menu" className="text-brand font-medium">
              去菜单页点菜
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {selectedItems.map((item) => (
              <li key={item.recipe_id} className="flex items-center gap-3">
                <DishThumb
                  id={item.recipe_id}
                  name={item.title}
                  src={item.thumb_url ?? undefined}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-ink-900 truncate">{item.title}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => dec(item.recipe_id)}
                    aria-label="减少"
                    className="w-7 h-7 rounded-full bg-cream-100 text-ink-700 flex items-center justify-center cursor-pointer"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => inc(item.recipe_id)}
                    aria-label="增加"
                    className="w-7 h-7 rounded-full bg-brand text-white flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Note */}
      <section className="space-y-2">
        <label className="text-sm text-ink-700 px-1">备注（可选）</label>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="有任何特殊要求或说明吗？"
          className="resize-y min-h-[80px]"
        />
      </section>

      {/* Recipe browser */}
      <section className="surface-card p-4 space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-ink-400">浏览菜谱</div>

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
                  <DishThumb
                    id={recipe.id}
                    name={recipe.title}
                    src={thumbUrl ?? undefined}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-ink-900 line-clamp-1">{recipe.title}</p>
                    {recipe.cook_minutes ? (
                      <p className="text-[11px] text-ink-400">{recipe.cook_minutes} min</p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="shrink-0 rounded-full"
                    onClick={() => handleAddItem(recipe.id, recipe.title, thumbUrl)}
                  >
                    添加
                  </Button>
                </div>
              )
            })
          )}
        </div>
      </section>

      {/* Sticky submit bar */}
      <div className="fixed left-1/2 -translate-x-1/2 bottom-0 w-full max-w-[28rem] px-4 pb-safe pt-3 bg-cream-50/95 backdrop-blur border-t border-cream-200 z-30">
        <Button
          type="submit"
          variant="default"
          size="pill"
          className="w-full"
          disabled={createOrder.isPending || selectedItems.length === 0}
        >
          {createOrder.isPending
            ? '提交中…'
            : `提交点单${totalServings > 0 ? `（${totalServings} 份）` : ''}`}
        </Button>
      </div>
    </form>
  )
}
