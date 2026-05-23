import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router'
import { ArrowLeft, Heart, MessageCircle, Copy, Loader2, Send } from 'lucide-react'
import {
  useSquareRecipe,
  useToggleSquareLike,
  useAddSquareComment,
  useCloneSquareRecipe,
} from '@/hooks/useSquare'
import { DishThumb } from '@/components/recipe/DishThumb'
import { TagChip } from '@/components/recipe/TagChip'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { ImageLightbox } from '@/components/recipe/ImageLightbox'

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return '刚刚'
  if (m < 60) return `${m} 分钟前`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} 小时前`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d} 天前`
  return new Date(iso).toLocaleDateString('zh-CN')
}

export default function SquareRecipeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const recipeId = Number(id)

  const { data, isLoading } = useSquareRecipe(recipeId)
  const toggleLike = useToggleSquareLike()
  const addComment = useAddSquareComment()
  const cloneRecipe = useCloneSquareRecipe()

  const [commentDraft, setCommentDraft] = useState('')
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [imageIndex, setImageIndex] = useState(0)

  if (isLoading) {
    return <div className="p-8 text-center animate-pulse">加载中…</div>
  }
  if (!data) {
    return (
      <div className="p-8 text-center text-ink-500">
        菜品不存在或未公开
        <br />
        <Link to="/square" className="text-brand text-sm mt-2 inline-block">
          返回广场
        </Link>
      </div>
    )
  }

  const heroSrc =
    data.images[imageIndex]?.thumb_url ?? data.images[imageIndex]?.url ?? null

  const handleClone = async () => {
    try {
      const created = await cloneRecipe.mutateAsync(recipeId)
      toast({
        title: '已复制到本家',
        description: `「${created.title}」已加入本家菜谱`,
      })
      navigate(`/recipe/${created.id}`)
    } catch (err) {
      toast({
        title: '复制失败',
        description: err instanceof Error ? err.message : '请重试',
        variant: 'destructive',
      })
    }
  }

  const handleSendComment = async () => {
    const c = commentDraft.trim()
    if (!c) return
    try {
      await addComment.mutateAsync({ recipeId, content: c })
      setCommentDraft('')
    } catch (err) {
      toast({
        description: err instanceof Error ? err.message : '评论失败',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="-mx-4 -mt-[var(--app-shell-top-padding)] pb-32 animate-in fade-in duration-500">
      <div className="relative bg-brand aspect-square flex items-center justify-center overflow-hidden">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="返回"
          className="absolute top-12 left-4 w-10 h-10 rounded-full bg-white/90 text-ink-900 flex items-center justify-center cursor-pointer z-10"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        {heroSrc ? (
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            aria-label="查看大图"
            className="w-full h-full"
          >
            <img src={heroSrc} alt={data.title} className="w-full h-full object-cover" />
          </button>
        ) : (
          <DishThumb id={data.id} name={data.title} size="lg" className="w-32 h-32" />
        )}
        {data.images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {data.images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setImageIndex(i)
                }}
                aria-label={`图片 ${i + 1}`}
                className={`rounded-full transition-all ${i === imageIndex ? 'w-2 h-2 bg-white' : 'w-2 h-2 bg-white/40'}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="relative -mt-8 mx-4 surface-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1.5">
            {data.tags.length > 0 ? (
              data.tags.map((t) => <TagChip key={t.id} name={t.name} />)
            ) : (
              <span className="text-xs text-ink-400">家常</span>
            )}
          </div>
          <button
            type="button"
            aria-label={data.liked_by_me ? '取消点赞' : '点赞'}
            disabled={toggleLike.isPending}
            onClick={() => toggleLike.mutate(recipeId)}
            className="inline-flex items-center gap-1 text-sm text-ink-600 cursor-pointer"
          >
            <Heart
              className={`w-5 h-5 transition-colors ${
                data.liked_by_me ? 'fill-rose-500 text-rose-500' : 'text-ink-400'
              }`}
            />
            <span>{data.like_count}</span>
          </button>
        </div>

        <h1 className="font-serif text-2xl text-ink-900">{data.title}</h1>
        <p className="text-xs text-ink-500">
          来自 <span className="font-medium">{data.family.name}</span>
          {data.cook_minutes && ` · ⏱ ${data.cook_minutes} 分钟`}
          {data.servings && ` · ${data.servings} 人份`}
        </p>
        {data.description && (
          <p className="text-sm text-ink-700 font-serif leading-relaxed">
            {data.description}
          </p>
        )}
      </div>

      {data.steps.length > 0 && (
        <div className="mx-4 mt-5">
          <h2 className="text-sm text-ink-500 mb-3">步骤</h2>
          <ol className="space-y-3">
            {data.steps.map((step, i) => (
              <li key={i} className="surface-card p-4 flex gap-3">
                <span className="shrink-0 w-7 h-7 rounded-full bg-brand text-white text-sm flex items-center justify-center font-medium">
                  {i + 1}
                </span>
                <p className="text-sm text-ink-900 leading-relaxed whitespace-pre-line">
                  {step}
                </p>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Comments */}
      <section className="mx-4 mt-6 surface-card p-5 space-y-3">
        <h2 className="text-sm font-semibold text-ink-900 flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-brand" />
          评论
          {data.comments.length > 0 && (
            <span className="text-xs font-normal text-ink-500">
              ({data.comments.length})
            </span>
          )}
        </h2>
        <div className="flex gap-2">
          <Input
            placeholder="说点什么…"
            value={commentDraft}
            onChange={(e) => setCommentDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void handleSendComment()
              }
            }}
            className="h-9 text-sm"
          />
          <Button
            type="button"
            size="sm"
            className="shrink-0"
            disabled={!commentDraft.trim() || addComment.isPending}
            onClick={() => void handleSendComment()}
          >
            {addComment.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        {data.comments.length === 0 ? (
          <p className="text-xs text-ink-400 text-center py-3">还没有评论</p>
        ) : (
          <div className="space-y-3">
            {data.comments.map((c) => (
              <div key={c.id} className="text-sm">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-medium text-ink-900 text-xs">{c.user.name}</span>
                  <span className="text-[10px] text-ink-400">{relativeTime(c.created_at)}</span>
                </div>
                <p className="text-ink-700 text-xs leading-relaxed">{c.content}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <ImageLightbox
        open={lightboxOpen}
        images={data.images.map((i) => ({ id: i.id, url: i.url }))}
        startIndex={imageIndex}
        onClose={() => setLightboxOpen(false)}
      />

      {/* Fixed bottom CTA */}
      <div
        className="fixed left-1/2 -translate-x-1/2 w-full max-w-[28rem] px-4 pt-3 pb-3 bg-cream-50/95 backdrop-blur border-t border-cream-200 flex items-center gap-3 z-30"
        style={{ bottom: 'calc(var(--app-tabbar-height) + env(safe-area-inset-bottom))' }}
      >
        {data.is_own_family ? (
          <Button
            variant="outline"
            size="pill"
            className="flex-1"
            onClick={() => navigate(`/recipe/${recipeId}`)}
          >
            这是本家菜，去管理
          </Button>
        ) : (
          <Button
            size="pill"
            className="flex-1"
            disabled={cloneRecipe.isPending}
            onClick={() => void handleClone()}
          >
            {cloneRecipe.isPending ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Copy className="w-4 h-4 mr-1" />
            )}
            复制到本家菜谱
          </Button>
        )}
      </div>
    </div>
  )
}
