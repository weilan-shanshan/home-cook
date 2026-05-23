import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Sparkles, Loader2, Plus } from 'lucide-react'
import { useAiQuota, useWishRecommend, type AiRecommendation } from '@/hooks/useAi'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { DishThumb } from '@/components/recipe/DishThumb'

const QUICK_PROMPTS = [
  '今晚清淡一点',
  '想吃肉',
  '想吃辣',
  '半小时内能做好的',
  '小朋友爱吃的',
  '解馋的',
]

export function WishAiPanel() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { data: quota, isLoading: quotaLoading } = useAiQuota()
  const recommendMutation = useWishRecommend()
  const [prompt, setPrompt] = useState('')
  const [picks, setPicks] = useState<Set<number>>(new Set())

  const result = recommendMutation.data
  const recommendations = result?.recommendations ?? []
  const remaining = result?.quota.remaining ?? quota?.remaining ?? 0
  const available = quota?.available ?? false
  const isExhausted = !quotaLoading && remaining <= 0

  const togglePick = (id: number) => {
    setPicks((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSubmit = async () => {
    const p = prompt.trim()
    if (!p) {
      toast({ description: '说一下想吃啥嘛', variant: 'destructive' })
      return
    }
    try {
      await recommendMutation.mutateAsync(p)
      setPicks(new Set())
    } catch (err) {
      toast({
        title: 'AI 推荐失败',
        description: err instanceof Error ? err.message : '请重试',
        variant: 'destructive',
      })
    }
  }

  const handleOrderPicks = () => {
    if (picks.size === 0) return
    const ids = Array.from(picks).join(',')
    navigate(`/order/create?ids=${ids}`)
  }

  const intro = useMemo(() => result?.intro?.trim() ?? '', [result])

  if (!available && !quotaLoading) {
    // AI 不可用 — 隐藏整个面板，避免误导用户。
    return null
  }

  return (
    <section className="surface-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <div className="w-9 h-9 rounded-full bg-honey-100 text-honey-700 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-serif text-base text-ink-900">AI 帮我选今晚吃啥</h2>
            <p className="text-[11px] text-ink-500 mt-0.5">
              说说你想吃啥味，从本家菜里挑几道给你
            </p>
          </div>
        </div>
        <span className="shrink-0 text-[10px] text-ink-400 whitespace-nowrap">
          {quotaLoading ? '…' : `本月剩 ${remaining}/${quota?.monthly_quota ?? 8}`}
        </span>
      </div>

      <div className="space-y-2">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="例：今晚想清淡一点，最好半小时能搞定"
          className="resize-none h-20 text-sm"
          disabled={recommendMutation.isPending || isExhausted}
        />
        <div className="flex flex-wrap gap-1.5">
          {QUICK_PROMPTS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setPrompt((prev) => (prev ? `${prev}，${q}` : q))}
              disabled={recommendMutation.isPending || isExhausted}
              className="text-[11px] rounded-full bg-cream-100 text-ink-700 px-2.5 py-1 hover:bg-cream-200 transition-colors cursor-pointer disabled:opacity-40"
            >
              {q}
            </button>
          ))}
        </div>
        <Button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={recommendMutation.isPending || !prompt.trim() || isExhausted}
          className="w-full rounded-full"
        >
          {recommendMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              AI 思考中…
            </>
          ) : isExhausted ? (
            '本月额度已用完，下月再来'
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              开始推荐
            </>
          )}
        </Button>
      </div>

      {/* Results */}
      {recommendations.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-cream-200">
          {intro && (
            <p className="text-xs text-ink-600 italic">「{intro}」</p>
          )}
          <ul className="space-y-2">
            {recommendations.map((rec: AiRecommendation) => {
              const picked = picks.has(rec.recipe_id)
              const src = rec.first_image?.thumb_url ?? rec.first_image?.url ?? null
              return (
                <li
                  key={rec.recipe_id}
                  className={`flex items-start gap-3 rounded-2xl p-3 border transition-colors ${
                    picked
                      ? 'bg-brand-50 border-brand-300'
                      : 'bg-cream-50 border-cream-200'
                  }`}
                >
                  <DishThumb
                    id={rec.recipe_id}
                    name={rec.title}
                    src={src}
                    size="md"
                    rounded="lg"
                  />
                  <div className="flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => navigate(`/recipe/${rec.recipe_id}`)}
                      className="font-medium text-sm text-ink-900 hover:text-brand cursor-pointer"
                    >
                      {rec.title}
                    </button>
                    <p className="text-[11px] text-ink-600 mt-0.5 leading-relaxed">
                      {rec.reason}
                    </p>
                    {rec.cook_minutes != null && (
                      <p className="text-[10px] text-ink-400 mt-0.5">
                        ⏱ {rec.cook_minutes} 分钟
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    aria-label={picked ? '取消选中' : '加入点单'}
                    onClick={() => togglePick(rec.recipe_id)}
                    className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                      picked
                        ? 'bg-ink-900 text-white'
                        : 'bg-brand text-white'
                    }`}
                  >
                    {picked ? '✓' : <Plus className="w-4 h-4" />}
                  </button>
                </li>
              )
            })}
          </ul>
          {picks.size > 0 && (
            <Button
              type="button"
              className="w-full rounded-full"
              onClick={handleOrderPicks}
            >
              加入点单（{picks.size}）→
            </Button>
          )}
        </div>
      )}
    </section>
  )
}
