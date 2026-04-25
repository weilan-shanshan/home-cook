import { useState } from 'react'
import { Link } from 'react-router'
import { useWishes, useCreateWish, useUpdateWishStatus } from '@/hooks/useWishes'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BookOpen, Plus, CheckCircle, XCircle } from 'lucide-react'

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
    <div className="space-y-8 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">许愿单</h1>
          <p className="text-muted-foreground text-sm font-medium">记录您的家人想吃的菜肴。</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full shadow-button bg-primary/10 text-primary hover:bg-primary/20 border-0">
              <Plus className="h-4 w-4 mr-1.5" />
              添加许愿
            </Button>
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
        
        <TabsContent value="pending" className="space-y-4">
          {isLoadingPending ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-5 animate-in fade-in zoom-in-95 duration-500">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                <div className="bg-white/80 dark:bg-black/50 p-4 rounded-3xl shadow-elevated relative">
                  <BookOpen className="h-8 w-8 animate-bounce text-primary/80" />
                </div>
              </div>
              <p className="text-sm font-medium tracking-wide">正在加载许愿单...</p>
            </div>
          ) : !pendingWishes?.length ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center text-muted-foreground animate-in fade-in zoom-in-95 duration-500">
                <div className="bg-secondary/50 p-6 rounded-full mb-6 border border-border/40 dark:border-white/5 shadow-sm">
                <BookOpen className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <p className="text-lg font-bold text-foreground mb-2">暂无待完成许愿</p>
              <p className="text-sm text-muted-foreground max-w-[250px] mx-auto mb-8 leading-relaxed">
                您的家人最近没有想吃的菜肴。在上面添加一个吧！
              </p>
              <Button onClick={() => setIsDialogOpen(true)} className="rounded-full shadow-button px-8">
                <Plus className="h-4 w-4 mr-2" />
                添加许愿
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingWishes.map((wish) => (
                <Card key={wish.id} className="glass-card rounded-2xl shadow-card border border-border/50 dark:border-white/5 flex flex-col gap-4 relative overflow-hidden transition-all duration-300 hover:shadow-elevated hover:border-primary/20 p-5 pb-4">
                  <div className="flex justify-between items-start gap-4">
                    <CardTitle className="text-xl font-bold tracking-tight text-foreground/90 line-clamp-1">{wish.dishName}</CardTitle>
                    <Badge variant="outline" className="shrink-0 bg-primary/5 text-primary border-primary/20 rounded-full px-2.5 font-semibold text-[10px] shadow-sm">待完成</Badge>
                  </div>
                  {wish.note && (
                    <CardDescription className="line-clamp-2 mt-1 text-[13px] bg-secondary/50 p-3 rounded-xl text-foreground/80 leading-relaxed border border-border/40 dark:border-white/5">{wish.note}</CardDescription>
                  )}
                  <div className="pt-3 border-t border-border/50 mt-1 flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 rounded-xl shadow-sm text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleStatusChange(wish.id, 'cancelled')}
                      disabled={isUpdating}
                    >
                      <XCircle className="h-4 w-4 mr-1.5" />
                      取消
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm"
                      className="flex-1 rounded-xl shadow-button font-bold"
                      onClick={() => handleStatusChange(wish.id, 'fulfilled')}
                      disabled={isUpdating}
                    >
                      <CheckCircle className="h-4 w-4 mr-1.5" />
                      完成
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="fulfilled" className="space-y-4">
          {isLoadingFulfilled ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-5 animate-in fade-in zoom-in-95 duration-500">
              <div className="relative">
                <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full" />
                <div className="bg-white/80 dark:bg-black/50 p-4 rounded-3xl shadow-elevated relative">
                  <CheckCircle className="h-8 w-8 animate-pulse text-green-500/80" />
                </div>
              </div>
              <p className="text-sm font-medium tracking-wide">正在加载已完成许愿...</p>
            </div>
          ) : !fulfilledWishes?.length ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center text-muted-foreground animate-in fade-in zoom-in-95 duration-500">
                <div className="bg-secondary/50 p-6 rounded-full mb-6 border border-border/40 dark:border-white/5 shadow-sm">
                <CheckCircle className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <p className="text-lg font-bold text-foreground mb-2">暂无已完成许愿</p>
              <p className="text-sm text-muted-foreground max-w-[250px] mx-auto leading-relaxed">
                这里会显示已经满足的愿望。
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {fulfilledWishes.map((wish) => (
                <Card key={wish.id} className="glass-card rounded-2xl shadow-card border border-border/50 dark:border-white/5 flex flex-col gap-4 relative overflow-hidden transition-all duration-300 hover:shadow-elevated hover:border-green-500/20 p-5 pb-4 opacity-90 hover:opacity-100 group">
                  <div className="flex justify-between items-start gap-4">
                    <CardTitle className="text-xl font-bold tracking-tight text-foreground/90 line-clamp-1">{wish.dishName}</CardTitle>
                    <Badge variant="outline" className="shrink-0 bg-green-500/10 text-green-700 border-green-200 rounded-full px-2.5 font-semibold text-[10px] shadow-sm">已完成</Badge>
                  </div>
                  {wish.note && (
                    <CardDescription className="line-clamp-2 mt-1 text-[13px] bg-secondary/50 p-3 rounded-xl text-foreground/80 leading-relaxed border border-border/40 dark:border-white/5">{wish.note}</CardDescription>
                  )}
                  <div className="pt-3 border-t border-border/50 mt-1 flex justify-end">
                    {wish.recipeId ? (
                      <Button variant="link" size="sm" asChild className="p-0 h-auto font-medium text-primary group-hover:text-primary/80 transition-colors">
                        <Link to={`/recipe/${wish.recipeId}`}>查看菜谱 →</Link>
                      </Button>
                    ) : (
                      <span className="text-sm text-muted-foreground/80 font-medium">未关联菜谱已完成</span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
