import { useEffect, useMemo, useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router'
import { useRecipes } from '@/hooks/useRecipes'
import { useCreateOrder, useOrder, CreateOrderParams, MealType } from '@/hooks/useOrders'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { Badge } from '@/components/ui/badge'
import { Plus, Minus, X, ChevronLeft, Search, Loader2, Utensils } from 'lucide-react'

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
    setSelectedItems((prev) => {
      return prev.map((item) => {
        if (item.recipe_id === recipeId) {
          const newQ = item.quantity + delta
          return newQ > 0 ? { ...item, quantity: newQ } : item
        }
        return item
      })
    })
  }

  const handleRemoveItem = (recipeId: number) => {
    setSelectedItems((prev) => prev.filter((item) => item.recipe_id !== recipeId))
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
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
        <Link to="/orders" className="flex items-center hover:text-primary transition-colors">
          <ChevronLeft className="h-4 w-4 mr-1" />
          返回订单列表
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-card p-6 sm:p-8 rounded-2xl shadow-elevated">
            <h1 className="text-3xl font-bold tracking-tight mb-8">创建订单</h1>
            <form id="order-form" onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="meal_type">用餐类型</Label>
                  <Select value={mealType} onValueChange={(val: MealType) => setMealType(val)}>
                    <SelectTrigger id="meal_type">
                        <SelectValue placeholder="请选择类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="breakfast">早餐</SelectItem>
                      <SelectItem value="lunch">午餐</SelectItem>
                      <SelectItem value="dinner">晚餐</SelectItem>
                      <SelectItem value="snack">加餐</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meal_date">日期</Label>
                  <Input
                    id="meal_date"
                    type="date"
                    required
                    value={mealDate}
                    onChange={(e) => setMealDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="note">备注（可选）</Label>
                  <Textarea
                    id="note"
                    placeholder="有任何特殊要求或说明吗？"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="resize-y min-h-[80px]"
                  />
                </div>
              </div>
            </form>
          </div>

          <div className="glass-card p-6 sm:p-8 rounded-2xl shadow-elevated flex flex-col h-[500px]">
            <h2 className="text-xl font-bold tracking-tight mb-4">浏览菜谱</h2>
            <div className="relative mb-4">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="搜索以添加..."
                className="pl-9 pr-4 bg-background/50 backdrop-blur-sm border-muted-foreground/20 focus-visible:ring-primary/50"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
              {isLoadingRecipes ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-primary/60" />
                </div>
              ) : recipes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center">
                  <Utensils className="h-8 w-8 opacity-20 mb-2" />
                  <p className="text-sm">未找到符合您搜索的菜谱。</p>
                </div>
              ) : (
                recipes.map((recipe) => {
                  const thumbUrl = recipe.first_image?.thumb_url || recipe.first_image?.url || null
                  return (
                    <div key={recipe.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/40 hover:border-primary/40 bg-card/50 transition-colors">
                      {thumbUrl ? (
                        <img src={thumbUrl} alt={recipe.title} className="w-12 h-12 rounded-md object-cover bg-muted" />
                      ) : (
                        <div className="w-12 h-12 rounded-md bg-secondary/50 flex items-center justify-center text-muted-foreground">
                          <Utensils className="h-5 w-5 opacity-40" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm line-clamp-1">{recipe.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {recipe.tags?.slice(0, 2).map((t: { id: number, name: string }) => (
                            <Badge key={t.id} variant="secondary" className="text-[9px] px-1 py-0">{t.name}</Badge>
                          ))}
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="shrink-0"
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
        </div>

        <div className="lg:col-span-5">
          <div className="glass-card p-6 sm:p-8 rounded-2xl shadow-elevated sticky top-24">
            <h2 className="text-xl font-bold tracking-tight mb-6">已选项</h2>
            
            {selectedItems.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-border/60 rounded-xl text-muted-foreground bg-muted/20">
                <Utensils className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">您的订单为空。</p>
                <p className="text-xs mt-1">从列表中选择菜谱以添加。</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 mb-6">
                {selectedItems.map((item) => (
                  <div key={item.recipe_id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm line-clamp-1">{item.title}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleUpdateQuantity(item.recipe_id, -1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm w-4 text-center font-medium">{item.quantity}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleUpdateQuantity(item.recipe_id, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 ml-1"
                        onClick={() => handleRemoveItem(item.recipe_id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="pt-4 border-t border-border/50 space-y-4">
              <div className="flex justify-between text-sm font-medium">
                <span>总项目数</span>
                <span>{selectedItems.reduce((acc, item) => acc + item.quantity, 0)}</span>
              </div>
              <Button
                type="submit"
                form="order-form"
                className="w-full"
                size="lg"
                disabled={createOrder.isPending || selectedItems.length === 0}
              >
                {createOrder.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    正在创建订单...
                  </>
                ) : (
                  '提交订单'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
