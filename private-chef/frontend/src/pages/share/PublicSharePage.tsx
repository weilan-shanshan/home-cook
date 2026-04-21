import { useMemo } from 'react'
import { Link, useParams } from 'react-router'
import { Loader2, ChevronLeft, UserRound, ChefHat, Trophy, Utensils } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
      </div>
    )
  }

  if (shareQuery.error || !shareQuery.data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-muted/20">
        <Card className="max-w-md w-full rounded-3xl">
          <CardContent className="p-8 text-center space-y-4">
            <div className="text-xl font-semibold">分享页不存在或已失效</div>
            <p className="text-sm text-muted-foreground">请让分享者重新生成链接后再试。</p>
            <Button asChild variant="outline" className="rounded-2xl">
              <Link to="/login">返回应用</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const payload = shareQuery.data

  return (
    <div className={`min-h-screen bg-gradient-to-br ${backgroundClass}`}>
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10 space-y-6">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <Button asChild variant="ghost" className="rounded-full px-2">
            <Link to="/login">
              <ChevronLeft className="mr-1 h-4 w-4" />
              返回应用
            </Link>
          </Button>
          <div className="flex items-center gap-2 font-medium text-foreground/70">
            {heroIcon(payload.target_type)}
            <span>{payload.public_context.family_name || 'Private Chef 分享'}</span>
          </div>
        </div>

        <Card className="overflow-hidden rounded-[2rem] border-white/70 bg-white/90 shadow-xl">
          <CardContent className="p-0">
            {payload.cover_image_url ? (
              <div className="relative h-72 overflow-hidden sm:h-96">
                <img src={payload.cover_image_url} alt={payload.title} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white sm:p-8">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {payload.visual.chips.slice(0, 4).map((chip) => (
                      <Badge key={chip} variant="secondary" className="bg-white/20 text-white border-white/10">
                        {chip}
                      </Badge>
                    ))}
                  </div>
                  <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{payload.title}</h1>
                  <p className="mt-3 max-w-2xl text-sm text-white/90 sm:text-base">{payload.summary}</p>
                </div>
              </div>
            ) : (
              <div className="p-6 sm:p-8 border-b bg-gradient-to-br from-white to-muted/30">
                <div className="flex flex-wrap gap-2 mb-4">
                  {payload.visual.chips.slice(0, 4).map((chip) => (
                    <Badge key={chip} variant="secondary">{chip}</Badge>
                  ))}
                </div>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{payload.title}</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{payload.summary}</p>
              </div>
            )}

            <div className="p-6 sm:p-8 space-y-6">
              <div className="grid gap-3 sm:grid-cols-3">
                {payload.public_context.family_name ? (
                  <div className="rounded-2xl bg-muted/40 p-4">
                    <div className="text-xs text-muted-foreground">家庭</div>
                    <div className="mt-1 font-medium">{payload.public_context.family_name}</div>
                  </div>
                ) : null}
                {payload.public_context.requester_display_name ? (
                  <div className="rounded-2xl bg-muted/40 p-4">
                    <div className="text-xs text-muted-foreground flex items-center gap-1"><UserRound className="h-3.5 w-3.5" /> 点单人</div>
                    <div className="mt-1 font-medium">{payload.public_context.requester_display_name}</div>
                  </div>
                ) : null}
                {payload.public_context.cook_display_name ? (
                  <div className="rounded-2xl bg-muted/40 p-4">
                    <div className="text-xs text-muted-foreground flex items-center gap-1"><ChefHat className="h-3.5 w-3.5" /> 掌勺</div>
                    <div className="mt-1 font-medium">{payload.public_context.cook_display_name}</div>
                  </div>
                ) : null}
                {payload.public_context.featured_display_name ? (
                  <div className="rounded-2xl bg-muted/40 p-4">
                    <div className="text-xs text-muted-foreground">主角</div>
                    <div className="mt-1 font-medium">{payload.public_context.featured_display_name}</div>
                  </div>
                ) : null}
                {payload.public_context.date_label ? (
                  <div className="rounded-2xl bg-muted/40 p-4">
                    <div className="text-xs text-muted-foreground">日期</div>
                    <div className="mt-1 font-medium">{payload.public_context.date_label}</div>
                  </div>
                ) : null}
              </div>

              {payload.items && payload.items.length > 0 ? (
                <section className="space-y-3">
                  <h2 className="text-lg font-semibold">这份分享里有什么</h2>
                  <div className="grid gap-3">
                    {payload.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 rounded-2xl border bg-background/60 p-3">
                        {item.image?.thumbUrl || item.image?.url ? (
                          <img src={item.image.thumbUrl || item.image.url} alt={item.recipe_title} className="h-14 w-14 rounded-xl object-cover" />
                        ) : (
                          <div className="h-14 w-14 rounded-xl bg-muted" />
                        )}
                        <div className="flex-1">
                          <div className="font-medium">{item.recipe_title}</div>
                          <div className="text-sm text-muted-foreground">x{item.quantity}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {payload.daily_menu?.menu_items ? (
                <section className="space-y-3">
                  <h2 className="text-lg font-semibold">今日推荐组合</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {payload.daily_menu.menu_items.map((item) => (
                      <div key={`${item.recipe_id}-${item.title}`} className="rounded-2xl border bg-background/60 p-3 space-y-3">
                        {item.image?.thumbUrl || item.image?.url ? (
                          <img src={item.image.thumbUrl || item.image.url} alt={item.title} className="h-40 w-full rounded-xl object-cover" />
                        ) : null}
                        <div className="font-medium">{item.title}</div>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {payload.achievements ? (
                <section className="rounded-[1.75rem] border bg-background/60 p-6 space-y-4">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">本期成绩</div>
                      <div className="text-5xl font-semibold tracking-tight">#{payload.achievements.rank}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">成就分</div>
                      <div className="text-4xl font-semibold">{payload.achievements.score}</div>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-muted/40 p-4">
                      <div className="text-xs text-muted-foreground">成员数</div>
                      <div className="mt-1 font-medium">{payload.achievements.member_count}</div>
                    </div>
                    <div className="rounded-2xl bg-muted/40 p-4">
                      <div className="text-xs text-muted-foreground">订单数</div>
                      <div className="mt-1 font-medium">{payload.achievements.total_orders}</div>
                    </div>
                    <div className="rounded-2xl bg-muted/40 p-4">
                      <div className="text-xs text-muted-foreground">分享数</div>
                      <div className="mt-1 font-medium">{payload.achievements.total_shares}</div>
                    </div>
                  </div>
                </section>
              ) : null}

              {payload.facts.length > 0 ? (
                <section className="space-y-3">
                  <h2 className="text-lg font-semibold">分享亮点</h2>
                  <div className="rounded-[1.75rem] bg-muted/40 p-5 text-sm text-muted-foreground space-y-2">
                    {payload.facts.map((fact) => (
                      <div key={fact}>• {fact}</div>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
