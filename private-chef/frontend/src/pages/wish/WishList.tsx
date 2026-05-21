import { useState } from 'react'
import { Link } from 'react-router'
import { useWishes, useCreateWish, useUpdateWishStatus } from '@/hooks/useWishes'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle, XCircle } from 'lucide-react'

export default function WishList() {
  const { data: pendingWishes, isLoading: isLoadingPending } = useWishes('pending')
  const { data: fulfilledWishes, isLoading: isLoadingFulfilled } = useWishes('fulfilled')
  
  const { mutate: createWish, isPending: isCreating } = useCreateWish()
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateWishStatus()
  
  const { toast } = useToast()
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dishName, setDishName] = useState('')
  const [note, setNote] = useState('')

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!dishName.trim()) return
    
    createWish({ dish_name: dishName, note }, {
      onSuccess: () => {
        toast({ title: '许愿添加成功' })
        setIsDialogOpen(false)
        setDishName('')
        setNote('')
      },
      onError: (err) => {
        toast({ title: '添加许愿失败', description: err.message, variant: 'destructive' })
      }
    })
  }

  const handleStatusChange = (id: number, status: 'fulfilled' | 'cancelled') => {
    updateStatus({ id, json: { status } }, {
      onSuccess: () => {
        toast({ title: `许愿已标记为 ${status === 'fulfilled' ? '已完成' : '已取消'}` })
      },
      onError: (err) => {
        toast({ title: '更新许愿失败', description: err.message, variant: 'destructive' })
      }
    })
  }

  return (
    <main className="space-y-4 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="font-serif text-3xl text-ink-900">心愿单</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="inverse" size="sm" className="rounded-full">+ 新增</Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>添加新许愿</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="dishName" className="text-sm font-medium">菜名</label>
                  <Input 
                    id="dishName" 
                    value={dishName} 
                    onChange={(e) => setDishName(e.target.value)} 
                    placeholder="例如：麻婆豆腐"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="note" className="text-sm font-medium">备注（可选）</label>
                  <Textarea 
                    id="note" 
                    value={note} 
                    onChange={(e) => setNote(e.target.value)} 
                    placeholder="任何特殊要求或偏好..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>取消</Button>
                <Button type="submit" disabled={isCreating || !dishName.trim()}>保存</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="pending">待完成</TabsTrigger>
          <TabsTrigger value="fulfilled">已完成</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="space-y-3">
          {isLoadingPending ? (
            <div className="surface-card p-6 text-center text-ink-500 text-sm">正在加载...</div>
          ) : !pendingWishes?.length ? (
            <div className="surface-card p-6 text-center text-ink-500 text-sm">暂无待完成心愿</div>
          ) : (
            <div className="space-y-3">
              {pendingWishes.map((wish) => (
                <div key={wish.id} className="surface-card p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-ink-900">{wish.dishName}</div>
                      {wish.note && <div className="text-xs text-ink-500 mt-1">{wish.note}</div>}
                    </div>
                    <span className="rounded-full bg-honey-100 text-honey-700 text-xs px-2.5 py-1 whitespace-nowrap">待实现</span>
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-cream-200">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleStatusChange(wish.id, 'cancelled')}
                      disabled={isUpdating}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      取消
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleStatusChange(wish.id, 'fulfilled')}
                      disabled={isUpdating}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      完成
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="fulfilled" className="space-y-3">
          {isLoadingFulfilled ? (
            <div className="surface-card p-6 text-center text-ink-500 text-sm">正在加载...</div>
          ) : !fulfilledWishes?.length ? (
            <div className="surface-card p-6 text-center text-ink-500 text-sm">暂无已完成心愿</div>
          ) : (
            <div className="space-y-3">
              {fulfilledWishes.map((wish) => (
                <div key={wish.id} className="surface-card p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-ink-900">{wish.dishName}</div>
                      {wish.note && <div className="text-xs text-ink-500 mt-1">{wish.note}</div>}
                    </div>
                    <span className="rounded-full bg-sky-100 text-sky-700 text-xs px-2.5 py-1 whitespace-nowrap">已实现</span>
                  </div>
                  {wish.recipeId && (
                    <div className="pt-2 border-t border-cream-200">
                      <Button variant="link" size="sm" asChild className="p-0 h-auto">
                        <Link to={`/recipe/${wish.recipeId}`} className="text-xs text-brand">查看菜谱 →</Link>
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </main>
  )
}
