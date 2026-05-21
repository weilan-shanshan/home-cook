import { useMemo } from 'react'
import { Link, useParams } from 'react-router'
import { Loader2, ChevronLeft, UserRound, ChefHat, Trophy, Utensils } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DishThumb } from '@/components/recipe/DishThumb'
import { usePublicShare } from '@/hooks/useSharing'

function accentClasses(accent: 'amber' | 'tomato' | 'champagne' | 'sage') {
  switch (accent) {
    case 'amber':
      return 'from-amber-50 via-orange-50 to-stone-100'
    case 'tomato':
      return 'from-rose-50 via-orange-50 to-amber-50'
    case 'champagne':
      return 'from-stone-50 via-violet-50 to-slate-100'
    case 'sage':
      return 'from-emerald-50 via-lime-50 to-stone-100'
  }
}

function heroIcon(targetType: string) {
  switch (targetType) {
    case 'achievements':
      return <Trophy className="h-5 w-5" />
    case 'daily_menu':
      return <Utensils className="h-5 w-5" />
    default:
      return <ChefHat className="h-5 w-5" />
  }
}

export default function PublicSharePage() {
  const params = useParams()
  const token = params.token ?? ''
  const shareQuery = usePublicShare(token)

  const backgroundClass = useMemo(
    () => accentClasses(shareQuery.data?.visual.accent ?? 'amber'),
    [shareQuery.data?.visual.accent],
  )

  if (shareQuery.isLoading) {
    return (
      <div className="min-h-dvh bg-cream-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand/70" />
      </div>
    )
  }

  if (shareQuery.error || !shareQuery.data) {
    return (
      <div className="min-h-dvh bg-cream-50 flex items-center justify-center p-6">
        <div className="surface-card p-6 text-center max-w-sm w-full space-y-3">
          <div className="text-ink-900 font-serif text-xl">分享页不存在或已失效</div>
          <p className="text-sm text-ink-500">请让分享者重新生成链接后再试。</p>
          <Button asChild variant="outline" size="pill" className="mt-2">
            <Link to="/login">返回应用</Link>
          </Button>
        </div>
      </div>
    )
  }

  const payload = shareQuery.data

  return (
    <div className={`min-h-dvh bg-gradient-to-br ${backgroundClass}`}>
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10 space-y-5">

        {/* Nav bar */}
        <div className="flex items-center justify-between text-sm text-ink-500">
          <Button asChild variant="ghost" className="rounded-full px-2">
            <Link to="/login">
              <ChevronLeft className="mr-1 h-4 w-4" />
              返回应用
            </Link>
          </Button>
          <div className="flex items-center gap-2 font-medium text-ink-700">
            {heroIcon(payload.target_type)}
            <span>{payload.public_context.family_name || 'Private Chef 分享'}</span>
          </div>
        </div>

        {/* Hero / title card */}
        <div className="surface-card overflow-hidden">
          {payload.cover_image_url ? (
            <div className="relative h-64 overflow-hidden sm:h-80">
              <img src={payload.cover_image_url} alt={payload.title} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 text-white sm:p-7">
                <div className="flex flex-wrap gap-2 mb-3">
                  {payload.visual.chips.slice(0, 4).map((chip) => (
                    <Badge key={chip} variant="secondary" className="bg-white/20 text-white border-white/10">
                      {chip}
                    </Badge>
                  ))}
                </div>
                <h1 className="font-serif text-3xl text-white sm:text-4xl">{payload.title}</h1>
                <p className="mt-2 text-sm text-white/85 sm:text-base">{payload.summary}</p>
              </div>
            </div>
          ) : (
            <div className="p-5 sm:p-7 space-y-3">
              <div className="flex flex-wrap gap-2">
                {payload.visual.chips.slice(0, 4).map((chip) => (
                  <Badge key={chip} variant="secondary">{chip}</Badge>
                ))}
              </div>
              <h1 className="font-serif text-3xl text-ink-900 sm:text-4xl">{payload.title}</h1>
              <p className="text-sm text-ink-500 leading-6 sm:text-base">{payload.summary}</p>
            </div>
          )}
        </div>

        {/* Context grid */}
        {(payload.public_context.family_name ||
          payload.public_context.requester_display_name ||
          payload.public_context.cook_display_name ||
          payload.public_context.featured_display_name ||
          payload.public_context.date_label) ? (
          <div className="grid gap-3 sm:grid-cols-3">
            {payload.public_context.family_name ? (
              <div className="surface-card p-4">
                <div className="text-xs text-ink-400">家庭</div>
                <div className="mt-1 font-medium text-ink-900">{payload.public_context.family_name}</div>
              </div>
            ) : null}
            {payload.public_context.requester_display_name ? (
              <div className="surface-card p-4">
                <div className="text-xs text-ink-400 flex items-center gap-1">
                  <UserRound className="h-3.5 w-3.5" /> 点单人
                </div>
                <div className="mt-1 font-medium text-ink-900">{payload.public_context.requester_display_name}</div>
              </div>
            ) : null}
            {payload.public_context.cook_display_name ? (
              <div className="surface-card p-4">
                <div className="text-xs text-ink-400 flex items-center gap-1">
                  <ChefHat className="h-3.5 w-3.5" /> 掌勺
                </div>
                <div className="mt-1 font-medium text-ink-900">{payload.public_context.cook_display_name}</div>
              </div>
            ) : null}
            {payload.public_context.featured_display_name ? (
              <div className="surface-card p-4">
                <div className="text-xs text-ink-400">主角</div>
                <div className="mt-1 font-medium text-ink-900">{payload.public_context.featured_display_name}</div>
              </div>
            ) : null}
            {payload.public_context.date_label ? (
              <div className="surface-card p-4">
                <div className="text-xs text-ink-400">日期</div>
                <div className="mt-1 font-medium text-ink-900">{payload.public_context.date_label}</div>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Order items */}
        {payload.items && payload.items.length > 0 ? (
          <section className="surface-card p-4 space-y-3">
            <h2 className="font-serif text-lg text-ink-900">这份分享里有什么</h2>
            <ul className="space-y-3">
              {payload.items.map((item) => (
                <li key={item.id} className="flex items-center gap-3">
                  <DishThumb
                    id={item.recipe_id}
                    name={item.recipe_title}
                    src={item.image?.thumbUrl ?? item.image?.url ?? undefined}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-ink-900 truncate">{item.recipe_title}</div>
                    <div className="text-sm text-ink-400">×{item.quantity}</div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* Daily menu */}
        {payload.daily_menu?.menu_items ? (
          <section className="space-y-3">
            <h2 className="font-serif text-lg text-ink-900 px-1">今日推荐组合</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {payload.daily_menu.menu_items.map((item) => (
                <div key={`${item.recipe_id}-${item.title}`} className="surface-card p-3 space-y-3">
                  {item.image?.thumbUrl || item.image?.url ? (
                    <img
                      src={item.image.thumbUrl || item.image.url}
                      alt={item.title}
                      className="h-40 w-full rounded-2xl object-cover"
                    />
                  ) : (
                    <DishThumb
                      id={item.recipe_id}
                      name={item.title}
                      size="lg"
                      rounded="2xl"
                      className="w-full h-40"
                    />
                  )}
                  <div className="font-medium text-ink-900">{item.title}</div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Achievements */}
        {payload.achievements ? (
          <section className="surface-card p-5 space-y-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="text-sm text-ink-400">本期成绩</div>
                <div className="font-serif text-5xl text-ink-900 tracking-tight">#{payload.achievements.rank}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-ink-400">成就分</div>
                <div className="font-serif text-4xl text-ink-900">{payload.achievements.score}</div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="bg-cream-100 rounded-2xl p-4">
                <div className="text-xs text-ink-400">成员数</div>
                <div className="mt-1 font-medium text-ink-900">{payload.achievements.member_count}</div>
              </div>
              <div className="bg-cream-100 rounded-2xl p-4">
                <div className="text-xs text-ink-400">订单数</div>
                <div className="mt-1 font-medium text-ink-900">{payload.achievements.total_orders}</div>
              </div>
              <div className="bg-cream-100 rounded-2xl p-4">
                <div className="text-xs text-ink-400">分享数</div>
                <div className="mt-1 font-medium text-ink-900">{payload.achievements.total_shares}</div>
              </div>
            </div>
          </section>
        ) : null}

        {/* Facts */}
        {payload.facts.length > 0 ? (
          <section className="space-y-2">
            <h2 className="font-serif text-lg text-ink-900 px-1">分享亮点</h2>
            <div className="surface-card p-5 text-sm text-ink-500 space-y-2">
              {payload.facts.map((fact) => (
                <div key={fact}>• {fact}</div>
              ))}
            </div>
          </section>
        ) : null}

      </div>
    </div>
  )
}
