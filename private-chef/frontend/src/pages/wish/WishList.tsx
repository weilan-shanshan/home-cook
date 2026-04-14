import { useState } from 'react'
import { Link } from 'react-router'
import { useWishes, useCreateWish, useUpdateWishStatus } from '@/hooks/useWishes'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">许愿单</h1>
          <p className="text-muted-foreground mt-1">记录您的家人想吃的菜肴。</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
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
            <div className="flex items-center justify-center py-12 text-muted-foreground">正在加载...</div>
          ) : !pendingWishes?.length ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-medium">暂无待完成许愿</h3>
                <p className="text-muted-foreground mt-1 max-w-sm">
                  您的家人最近没有想吃的菜肴。在上面添加一个吧！
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingWishes.map((wish) => (
                <Card key={wish.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start gap-4">
                      <CardTitle className="text-xl line-clamp-1">{wish.dishName}</CardTitle>
                      <Badge variant="secondary" className="shrink-0">待完成</Badge>
                    </div>
                    {wish.note && (
                      <CardDescription className="line-clamp-2 mt-1">{wish.note}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pt-2 flex justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleStatusChange(wish.id, 'cancelled')}
                      disabled={isUpdating}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      取消
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => handleStatusChange(wish.id, 'fulfilled')}
                      disabled={isUpdating}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      完成
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="fulfilled" className="space-y-4">
          {isLoadingFulfilled ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">正在加载...</div>
          ) : !fulfilledWishes?.length ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-medium">暂无已完成许愿</h3>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {fulfilledWishes.map((wish) => (
                <Card key={wish.id} className="opacity-80 hover:opacity-100 transition-opacity">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start gap-4">
                      <CardTitle className="text-xl line-clamp-1">{wish.dishName}</CardTitle>
                      <Badge variant="outline" className="shrink-0 bg-green-500/10 text-green-700 border-green-200">已完成</Badge>
                    </div>
                    {wish.note && (
                      <CardDescription className="line-clamp-2 mt-1">{wish.note}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pt-2">
                    {wish.recipeId ? (
                      <Button variant="link" size="sm" asChild className="p-0 h-auto">
                        <Link to={`/recipe/${wish.recipeId}`}>查看菜谱 →</Link>
                      </Button>
                    ) : (
                      <span className="text-sm text-muted-foreground">未关联菜谱已完成</span>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
