import { useParams, useNavigate, Link } from 'react-router'
import { useRecipe, useDeleteRecipe } from '@/hooks/useRecipes'
import { useToggleFavorite } from '@/hooks/useFavorites'
import { useCookLogs, useCreateCookLog, useCreateRating, CookLogDetail, CookLogRating } from '@/hooks/useCookLogs'
import { Clock, Star, Users, Heart, Pencil, Trash2, ChevronLeft, ChevronRight, Calendar, Plus, MessageSquare } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Share2 } from 'lucide-react'
import { ShareDialog } from '@/components/share/ShareDialog'

function RatingStars({ score, onChange, readonly = false }: { score: number, onChange?: (s: number) => void, readonly?: boolean }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={`focus:outline-none ${readonly ? 'cursor-default' : 'cursor-pointer transition-transform hover:scale-110'}`}
        >
          <Star className={`h-5 w-5 ${score >= star ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
        </button>
      ))}
    </div>
  )
}

function CookLogsSection({ recipeId }: { recipeId: number }) {
  const { data: logs, isLoading } = useCookLogs(recipeId)
  const { mutate: createLog, isPending: isCreatingLog } = useCreateCookLog()
  const { mutate: createRating, isPending: isCreatingRating } = useCreateRating()
  const { toast } = useToast()

  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false)
  const [logNote, setLogNote] = useState('')
  const [cookedAt, setCookedAt] = useState(new Date().toISOString().slice(0, 10))

  const [ratingDrafts, setRatingDrafts] = useState<Record<number, { score: number, comment: string }>>({})

  const handleCreateLog = (e: React.FormEvent) => {
    e.preventDefault()
    createLog({ recipe_id: recipeId, cooked_at: cookedAt ? new Date(cookedAt).toISOString() : undefined, note: logNote }, {
      onSuccess: () => {
        toast({ title: '烹饪记录已添加' })
        setIsLogDialogOpen(false)
        setLogNote('')
      },
      onError: (err) => {
        toast({ title: '添加记录失败', description: err.message, variant: 'destructive' })
      }
    })
  }

  const handleRate = (logId: number) => {
    const draft = ratingDrafts[logId]
    if (!draft || draft.score === 0) return
    createRating({ cookLogId: logId, json: { score: draft.score, comment: draft.comment } }, {
      onSuccess: () => {
        toast({ title: '评分已添加' })
        setRatingDrafts(prev => {
          const next = { ...prev }
          delete next[logId]
          return next
        })
      },
      onError: (err) => {
        toast({ title: '评分失败', description: err.message, variant: 'destructive' })
      }
    })
  }

  return (
    <section className="glass-card p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-border/50 pb-3">
        <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          烹饪记录
        </h2>
        <Dialog open={isLogDialogOpen} onOpenChange={setIsLogDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8">
              <Plus className="h-4 w-4 mr-1" /> 记录
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-modal">
            <form onSubmit={handleCreateLog}>
              <DialogHeader>
                <DialogTitle>记录烹饪</DialogTitle>
                <DialogDescription>您今天做这道菜了吗？给家人留个便条吧。</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">日期</label>
                  <Input type="date" value={cookedAt} onChange={e => setCookedAt(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">便条（可选）</label>
                  <Textarea placeholder="做得怎么样？" value={logNote} onChange={e => setLogNote(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsLogDialogOpen(false)}>取消</Button>
                <Button type="submit" disabled={isCreatingLog}>保存记录</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="py-4 text-center text-sm text-muted-foreground animate-pulse">正在加载记录...</div>
      ) : !logs?.length ? (
        <p className="text-sm text-muted-foreground text-center py-4">暂无烹饪记录。</p>
      ) : (
        <div className="space-y-6">
          {logs?.map((log: CookLogDetail) => {
            const draft = ratingDrafts[log.id] || { score: 0, comment: '' }
            const hasRated = log.ratings && log.ratings.length > 0
            
            return (
              <div key={log.id} className="flex flex-col gap-3 p-4 rounded-xl bg-secondary/20 border border-border/50 shadow-sm relative overflow-hidden group">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-foreground/90">{log.cooked_by_name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {new Date(log.cooked_at).toLocaleDateString('zh-CN', { dateStyle: 'medium' })}
                    </div>
                  </div>
                  {log.avg_rating != null && log.avg_rating > 0 && (
                    <div className="flex items-center gap-1 bg-background/50 backdrop-blur-md px-2 py-1 rounded-full text-xs font-medium">
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      {log.avg_rating.toFixed(1)}
                    </div>
                  )}
                </div>
                
                {log.note && (
                  <p className="text-sm text-foreground/80 leading-relaxed bg-background/40 p-2.5 rounded-lg italic">
                    "{log.note}"
                  </p>
                )}

                {hasRated ? (
                  <div className="mt-2 space-y-2 border-t border-border/30 pt-3">
                    <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-2">
                      <MessageSquare className="h-3.5 w-3.5" /> 评分 ({log.rating_count})
                    </div>
                    {log.ratings.map((r: CookLogRating) => (
                      <div key={r.id} className="bg-background/60 rounded-lg p-2.5 text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-xs">{r.display_name}</span>
                          <RatingStars score={r.score} readonly />
                        </div>
                        {r.comment && <p className="text-muted-foreground text-xs mt-1">{r.comment}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-2 pt-3 border-t border-border/30 flex flex-col gap-2">
                    <p className="text-xs font-medium text-muted-foreground mb-1">为本次烹饪评分：</p>
                    <RatingStars 
                      score={draft.score} 
                      onChange={(s) => setRatingDrafts({ ...ratingDrafts, [log.id]: { ...draft, score: s } })} 
                    />
                    {draft.score > 0 && (
                      <div className="flex gap-2 mt-2 animate-in fade-in slide-in-from-top-2">
                        <Input 
                          size={1}
                          className="h-8 text-xs" 
                          placeholder="简短评论..." 
                          value={draft.comment} 
                          onChange={e => setRatingDrafts({ ...ratingDrafts, [log.id]: { ...draft, comment: e.target.value } })} 
                        />
                        <Button size="sm" className="h-8 text-xs" disabled={isCreatingRating} onClick={() => handleRate(log.id)}>
                          提交评分
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default function RecipeDetail() {
  const { id } = useParams()
  const recipeId = Number(id)
  const navigate = useNavigate()
  const { toast } = useToast()

  const { data: recipe, isLoading, error } = useRecipe(recipeId)
  const deleteMutation = useDeleteRecipe()
  const favoriteMutation = useToggleFavorite()

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)

  if (isLoading) {
    return <div className="p-8 text-center animate-pulse">正在加载菜谱...</div>
  }

  if (error || !recipe) {
    return (
      <div className="p-8 text-center text-destructive">
        加载菜谱失败或菜谱未找到。
        <br />
        <Button variant="link" asChild className="mt-4">
          <Link to="/">返回首页</Link>
        </Button>
      </div>
    )
  }

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(recipeId)
      toast({ title: '菜谱已删除', description: '您的菜谱已被移除。' })
      navigate('/')
    } catch (e: unknown) {
      toast({
        title: '错误',
        description: e instanceof Error ? e.message : '删除菜谱失败。',
        variant: 'destructive',
      })
    } finally {
      setIsDeleteDialogOpen(false)
    }
  }

  const toggleFavorite = () => {
    favoriteMutation.mutate({ recipeId, isFavorited: recipe.is_favorited })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
        <Link to="/" className="flex items-center hover:text-primary transition-colors">
          <ChevronLeft className="h-4 w-4 mr-1" />
          返回
        </Link>
      </div>

      <div className="glass-card overflow-hidden">
        {recipe.images && recipe.images.length > 0 ? (
          <div className="relative aspect-[21/9] w-full overflow-hidden bg-muted group">
            <img
              src={recipe.images[currentImageIndex].url}
               alt={`${recipe.title} - 第 ${currentImageIndex + 1} 张图片`}
              className="w-full h-full object-cover transition-opacity duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent pointer-events-none" />
            
            {recipe.images.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity rounded-full bg-background/50 backdrop-blur hover:bg-background/80 z-10"
                  onClick={() => setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : recipe.images.length - 1))}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity rounded-full bg-background/50 backdrop-blur hover:bg-background/80 z-10"
                  onClick={() => setCurrentImageIndex((prev) => (prev < recipe.images.length - 1 ? prev + 1 : 0))}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                  {recipe.images.map((_, idx) => (
                    <button
                      key={idx}
                      className={`w-2 h-2 rounded-full transition-all ${
                        idx === currentImageIndex ? 'bg-primary w-4' : 'bg-primary/40 hover:bg-primary/60'
                      }`}
                      onClick={() => setCurrentImageIndex(idx)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="h-32 bg-secondary/30 rounded-t-xl" />
        )}
        
        <div className="p-6 sm:p-8 -mt-16 sm:-mt-24 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 glass-modal p-6 rounded-2xl shadow-elevated">
            <div className="space-y-4 flex-1">
              <div className="flex flex-wrap gap-2">
                {recipe.tags.map((tag) => (
                  <Badge key={tag.id} variant="secondary" className="px-2 py-0.5 shadow-sm">
                    {tag.name}
                  </Badge>
                ))}
              </div>
              <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">
                {recipe.title}
              </h1>
              {recipe.description && (
                <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
                  {recipe.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-muted-foreground pt-4 border-t border-border/50">
                {recipe.cook_minutes && (
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-full bg-secondary/50">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <span>{recipe.cook_minutes} 分钟</span>
                  </div>
                )}
                {recipe.servings && (
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-full bg-secondary/50">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <span>{recipe.servings} 人份</span>
                  </div>
                )}
                {recipe.avg_rating != null && (
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-full bg-secondary/50">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    </div>
                    <span>{recipe.avg_rating.toFixed(1)} 分</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="icon"
                className={`rounded-full transition-colors ${recipe.is_favorited ? 'text-red-500 border-red-200 bg-red-50/50 dark:bg-red-950/20' : 'text-muted-foreground hover:text-red-500'}`}
                onClick={toggleFavorite}
                disabled={favoriteMutation.isPending}
              >
                <Heart className={`h-5 w-5 ${recipe.is_favorited ? 'fill-current' : ''}`} />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full" onClick={() => setShareDialogOpen(true)}>
                <Share2 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" asChild className="rounded-full">
                <Link to={`/recipe/${recipe.id}/edit`}>
                  <Pencil className="h-4 w-4" />
                </Link>
              </Button>
              <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full text-destructive hover:bg-destructive/10 border-destructive/20">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-modal sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>删除菜谱</DialogTitle>
                    <DialogDescription>
                      您确定要删除“{recipe.title}”吗？此操作无法撤销。
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)}>
                      取消
                    </Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
                      {deleteMutation.isPending ? '删除中...' : '删除菜谱'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <section className="glass-card p-6 sm:p-8 space-y-6">
            <h2 className="text-2xl font-semibold tracking-tight border-b border-border/50 pb-4">步骤</h2>
            <div className="space-y-6">
              {recipe.steps.map((step, idx) => (
                <div key={idx} className="flex gap-4 group">
                  <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm shadow-sm group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {idx + 1}
                  </div>
                  <p className="text-foreground/90 leading-relaxed pt-1 whitespace-pre-wrap">{step}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <CookLogsSection recipeId={recipeId} />
        </div>
      </div>

      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        title="分享这道菜"
        shareCardEndpoint={`/api/recipes/${recipeId}/share-card`}
        shareActionEndpoint={`/api/recipes/${recipeId}/share`}
        invalidateKeys={[["recipe", recipeId], ["recipes"]]}
      />
    </div>
  )
}
