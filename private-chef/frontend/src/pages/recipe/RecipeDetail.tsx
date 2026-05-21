import { useParams, useNavigate } from 'react-router'
import { useRecipe, useDeleteRecipe, DeleteRecipeError } from '@/hooks/useRecipes'
import { useToggleFavorite } from '@/hooks/useFavorites'
import { useCookLogs, useCreateCookLog, useCreateRating, CookLogDetail, CookLogRating } from '@/hooks/useCookLogs'
import { Star, Heart, ArrowLeft, Calendar, Plus, MessageSquare, Pencil } from 'lucide-react'
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
import { RecipeReferencedDialog } from '@/components/recipe/RecipeReferencedDialog'
import { DishThumb } from '@/components/recipe/DishThumb'
import { Link } from 'react-router'

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
    <section className="mx-4 surface-card p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink-900 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-brand" />
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
        <div className="space-y-4">
          {logs?.map((log: CookLogDetail) => {
            const draft = ratingDrafts[log.id] || { score: 0, comment: '' }
            const hasRated = log.ratings && log.ratings.length > 0

            return (
              <div key={log.id} className="flex flex-col gap-3 p-4 rounded-2xl bg-cream-100 border border-cream-200">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-sm text-ink-900">{log.cooked_by_name}</div>
                    <div className="text-xs text-ink-500 mt-0.5">
                      {new Date(log.cooked_at).toLocaleDateString('zh-CN', { dateStyle: 'medium' })}
                    </div>
                  </div>
                  {log.avg_rating != null && log.avg_rating > 0 && (
                    <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-full text-xs font-medium">
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      {log.avg_rating.toFixed(1)}
                    </div>
                  )}
                </div>

                {log.note && (
                  <p className="text-sm text-ink-700 leading-relaxed bg-white border border-cream-200 p-2.5 rounded-xl italic">
                    "{log.note}"
                  </p>
                )}

                {hasRated ? (
                  <div className="mt-1 space-y-2 border-t border-cream-200 pt-3">
                    <div className="text-xs font-semibold text-ink-500 flex items-center gap-1.5 mb-2">
                      <MessageSquare className="h-3.5 w-3.5" /> 评分 ({log.rating_count})
                    </div>
                    {log.ratings.map((r: CookLogRating) => (
                      <div key={r.id} className="bg-white border border-cream-200 rounded-xl p-2.5 text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-xs">{r.display_name}</span>
                          <RatingStars score={r.score} readonly />
                        </div>
                        {r.comment && <p className="text-ink-500 text-xs mt-1">{r.comment}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-1 pt-3 border-t border-cream-200 flex flex-col gap-2">
                    <p className="text-xs font-medium text-ink-500 mb-1">为本次烹饪评分：</p>
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
  const [referencedBlock, setReferencedBlock] = useState<{
    referencingOrders: Array<{ id: number; meal_date: string; meal_type: string; status: string }>
    referencingOrderCount: number
  } | null>(null)
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
      if (e instanceof DeleteRecipeError && e.body.error === 'RECIPE_REFERENCED_BY_ORDERS') {
        setReferencedBlock({
          referencingOrders: e.body.referencingOrders ?? [],
          referencingOrderCount: e.body.referencingOrderCount ?? 0,
        })
        return
      }
      toast({
        title: '错误',
        description: e instanceof Error ? e.message : '删除菜谱失败。',
        variant: 'destructive',
      })
      setIsDeleteDialogOpen(false)
    }
  }

  const toggleFavorite = () => {
    favoriteMutation.mutate({ recipeId, isFavorited: recipe.is_favorited })
  }

  const currentImage = recipe.images?.[currentImageIndex]?.url ?? null

  return (
    // Full-bleed: negate the px-4 padding from app-shell and the top padding
    <div className="-mx-4 -mt-[var(--app-shell-top-padding)] pb-32 animate-in fade-in duration-500">

      {/* Hero */}
      <div className="relative bg-brand aspect-[3/4] flex items-center justify-center overflow-hidden">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="返回"
          className="absolute top-12 left-4 w-10 h-10 rounded-full bg-white/90 text-ink-900 flex items-center justify-center cursor-pointer z-10"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => setShareDialogOpen(true)}
          aria-label="分享"
          className="absolute top-12 right-4 w-10 h-10 rounded-full bg-white/90 text-ink-900 flex items-center justify-center cursor-pointer z-10"
        >
          <Share2 className="w-5 h-5" />
        </button>

        {currentImage ? (
          <img
            src={currentImage}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <DishThumb id={recipe.id} name={recipe.title} size="lg" className="w-32 h-32" />
        )}

        {/* Pagination dots */}
        {recipe.images && recipe.images.length > 1 ? (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {recipe.images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentImageIndex(i)}
                aria-label={`图片 ${i + 1}`}
                className={`rounded-full transition-all ${i === currentImageIndex ? 'w-2 h-2 bg-white' : 'w-2 h-2 bg-white/40'}`}
              />
            ))}
          </div>
        ) : (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
            <span className="w-2 h-2 rounded-full bg-white/90" />
            <span className="w-2 h-2 rounded-full bg-white/40" />
          </div>
        )}
      </div>

      {/* Content card overlapping hero */}
      <div className="relative -mt-8 mx-4 surface-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-ink-500">
            {recipe.tags && recipe.tags.length > 0 ? (
              recipe.tags.map((t, i) => (
                <span key={t.id}>
                  {i > 0 && <span className="mr-2">·</span>}
                  <span className="rounded-full bg-cream-100 px-2.5 py-1">{t.name}</span>
                </span>
              ))
            ) : (
              <span className="rounded-full bg-cream-100 px-2.5 py-1">家常</span>
            )}
          </div>
          <button
            type="button"
            aria-label={recipe.is_favorited ? '取消收藏' : '收藏'}
            className="w-8 h-8 rounded-full bg-cream-100 text-brand flex items-center justify-center cursor-pointer"
            onClick={toggleFavorite}
          >
            <Heart className={recipe.is_favorited ? 'w-4 h-4 fill-current' : 'w-4 h-4'} />
          </button>
        </div>

        <h1 className="font-serif text-3xl text-ink-900">{recipe.title}</h1>

        <div className="flex items-center gap-2 text-xs flex-wrap">
          {recipe.cook_minutes != null && (
            <span className="rounded-full bg-cream-100 px-2.5 py-1">⏱ {recipe.cook_minutes} 分钟</span>
          )}
          {recipe.servings != null && (
            <span className="rounded-full bg-cream-100 px-2.5 py-1">{recipe.servings} 人份</span>
          )}
          {recipe.recent_cook_logs != null && recipe.recent_cook_logs.length > 0 && (
            <span className="rounded-full bg-cream-100 px-2.5 py-1">已做 {recipe.recent_cook_logs.length} 次</span>
          )}
        </div>

        {recipe.description && (
          <p className="font-serif text-sm text-ink-700 leading-relaxed">{recipe.description}</p>
        )}
      </div>

      {/* Steps */}
      <div className="mx-4 mt-5">
        <h2 className="text-sm text-ink-500 mb-3">步骤</h2>
        <ol className="space-y-3">
          {recipe.steps.map((step, i) => (
            <li key={i} className="surface-card p-4 flex gap-3">
              <span className="shrink-0 w-7 h-7 rounded-full bg-brand text-white text-sm flex items-center justify-center font-medium">
                {i + 1}
              </span>
              <p className="text-sm text-ink-900 leading-relaxed whitespace-pre-line">{step}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* Cook logs */}
      <div className="mt-6">
        <CookLogsSection recipeId={recipeId} />
      </div>

      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        title="分享这道菜"
        shareCardEndpoint={`/api/recipes/${recipeId}/share-card`}
        shareActionEndpoint={`/api/recipes/${recipeId}/share`}
        invalidateKeys={[["recipe", recipeId], ["recipes"]]}
      />

      <RecipeReferencedDialog
        open={isDeleteDialogOpen}
        onOpenChange={(o) => {
          setIsDeleteDialogOpen(o)
          if (!o) setReferencedBlock(null)
        }}
        blockedBy={
          referencedBlock
            ? {
                recipeTitle: recipe.title,
                recipeId,
                referencingOrders: referencedBlock.referencingOrders,
                referencingOrderCount: referencedBlock.referencingOrderCount,
              }
            : null
        }
        onConfirmDelete={handleDelete}
        recipeTitleForConfirm={recipe.title}
        isDeleting={deleteMutation.isPending}
      />

      {/* Fixed bottom action bar */}
      <div className="fixed left-1/2 -translate-x-1/2 bottom-0 w-full max-w-[28rem] px-4 pt-3 bg-cream-50/95 backdrop-blur border-t border-cream-200 flex items-center gap-3 z-30"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0.75rem)' }}
      >
        <Button
          variant="outline"
          size="lg"
          className="rounded-full"
          onClick={() => navigate(`/recipe/${recipeId}/edit`)}
        >
          <Pencil className="w-4 h-4 mr-1" /> 编辑
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="rounded-full text-rose-500 border-rose-500/30 hover:bg-rose-50"
          onClick={() => setIsDeleteDialogOpen(true)}
        >
          删除
        </Button>
        <Button
          size="pill"
          className="flex-1"
          onClick={() => navigate(`/order/create?ids=${recipeId}`)}
        >
          + 加入点单
        </Button>
      </div>
    </div>
  )
}
