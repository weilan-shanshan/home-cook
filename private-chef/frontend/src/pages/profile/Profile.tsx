import { Link, useNavigate } from 'react-router'
import { useCurrentUser, useLogout } from '@/hooks/useAuth'
import { useProfileSummary } from '@/hooks/useProfileSummary'
import { useHomeSummary } from '@/hooks/useHomeSummary'
import { useFavorites } from '@/hooks/useFavorites'
import { useAchievementsSummary } from '@/hooks/useAchievementsSummary'
import { useCookLogs } from '@/hooks/useCookLogs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { StatTile } from '@/components/home/StatTile'
import { HomeRecentComments } from '@/components/home/HomeRecentComments'
import { InstallEntryCard } from '@/components/pwa/InstallEntryCard'
import { DishThumb } from '@/components/recipe/DishThumb'
import { Heart, ListChecks, Trophy, Bell, LogOut, ChevronRight, Loader2, Star } from 'lucide-react'
import type { CookLogsListRes } from '@/hooks/useCookLogs'

const LINKS = [
  { to: '/favorites',    label: '收藏',   icon: Heart },
  { to: '/wishes',       label: '心愿单', icon: ListChecks },
  { to: '/achievements', label: '成就',   icon: Trophy },
  { to: '/profile/notifications', label: '通知设置', icon: Bell },
] as const

function nextMilestone(n: number): number {
  const steps = [10, 50, 100, 200, 500]
  for (const s of steps) if (n < s) return s
  return Math.ceil((n + 1) / 100) * 100
}

function MiniProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-ink-700 w-20 shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-cream-200 overflow-hidden">
        <div
          className="h-full rounded-full bg-brand transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[11px] text-ink-400 w-12 text-right shrink-0">{value} / {max}</span>
    </div>
  )
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const d = Math.floor(diff / 86_400_000)
  if (d === 0) return '今天'
  if (d === 1) return '昨天'
  if (d < 7) return `${d} 天前`
  return `${Math.floor(d / 7)} 周前`
}

export default function Profile() {
  const navigate = useNavigate()
  const { data: user, isLoading: isLoadingUser } = useCurrentUser()
  const { data: summary, isLoading: isLoadingSummary } = useProfileSummary()
  const { data: home, isLoading: isLoadingHome } = useHomeSummary()
  const { data: favorites = [] } = useFavorites()
  const { data: achievementsSummary } = useAchievementsSummary()
  const { data: cookLogsRaw } = useCookLogs(undefined)
  const { mutate: logout, isPending: isLoggingOut } = useLogout()

  const handleLogout = () => {
    logout(undefined, {
      onSuccess: () => navigate('/login', { replace: true }),
    })
  }

  if (isLoadingUser || isLoadingSummary || isLoadingHome) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-muted-foreground gap-5">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
        <p className="text-sm">正在加载资料...</p>
      </div>
    )
  }

  if (!user || !summary) return null

  const displayName = user.display_name || user.username
  const initial = displayName.charAt(0).toUpperCase()
  const roleLabel = user.role === 'admin' ? '管理员' : user.role === 'member' ? '成员' : user.role
  const familyName = summary.family.name

  // Stats: totalCooks from achievementSummary (home); rest from profileSummary
  const totalOrders = summary.myOrderStats.total
  const pending = summary.myOrderStats.pending
  const favoritesCount = summary.myFavoritesCount
  const totalCooks = home?.achievementSummary.totalCooks ?? 0

  const recentComments = home?.recentComments ?? []

  // 6.1 — 本月足迹 data
  const myStats = achievementsSummary?.me?.stats
  const orderMilestone = nextMilestone(myStats?.orderCount ?? totalOrders)
  const cookMilestone = nextMilestone(myStats?.cookCount ?? totalCooks)
  const favMilestone = nextMilestone(myStats?.favoriteCount ?? favoritesCount)

  // 6.2 — 收藏精选
  const favPreview = favorites.slice(0, 4)

  // 6.3 — 成就预览
  const myScore = achievementsSummary?.me?.score ?? 0
  const myRank = achievementsSummary?.me?.rank ?? 0

  // 6.4 — 近期烹饪
  const cookLogs = (() => {
    const raw = cookLogsRaw as CookLogsListRes | undefined
    return raw?.data?.slice(0, 3) ?? []
  })()

  return (
    <main className="space-y-5 pb-20">
      <InstallEntryCard />

      {/* User card */}
      <header className="surface-card p-4 flex items-center gap-3">
        <Avatar className="w-14 h-14">
          <AvatarFallback className="bg-brand-100 text-brand-700 text-lg font-semibold">
            {initial}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="font-serif text-lg text-ink-900 truncate">{displayName}</div>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="rounded-full bg-cream-100 px-2 py-0.5 text-xs text-ink-600">
              {roleLabel}
            </span>
            <span className="text-xs text-ink-500 truncate">{familyName}</span>
          </div>
        </div>
        {myRank > 0 && (
          <div className="flex flex-col items-center shrink-0">
            <Star className="w-4 h-4 text-honey-500 fill-honey-500 mb-0.5" />
            <div className="text-xs font-semibold text-ink-700">#{myRank}</div>
          </div>
        )}
      </header>

      {/* 2×2 StatTile grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatTile tone="cream"  label="累计点单" value={totalOrders} />
        <StatTile tone="sage"   label="累计掌勺" value={totalCooks} />
        <StatTile tone="sky"    label="待接单"   value={pending} />
        <StatTile tone="butter" label="收藏菜谱" value={favoritesCount} />
      </div>

      {/* 2-col Bento entry grid */}
      <section className="grid grid-cols-2 gap-3">
        {LINKS.map((l) => {
          const Icon = l.icon
          return (
            <Link
              key={l.to}
              to={l.to}
              className="surface-card p-4 flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-brand" />
                <span className="text-sm text-ink-900">{l.label}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-ink-400 shrink-0" />
            </Link>
          )
        })}
      </section>

      {/* 6.1 — 本月足迹 */}
      <section className="surface-card p-5">
        <div className="flex items-end justify-between mb-4">
          <h2 className="font-serif text-lg text-ink-900">本月足迹</h2>
          <Link to="/achievements" className="text-xs text-brand">成就 →</Link>
        </div>
        <div className="space-y-3">
          <MiniProgressBar
            value={myStats?.orderCount ?? totalOrders}
            max={orderMilestone}
            label="点单"
          />
          <MiniProgressBar
            value={myStats?.cookCount ?? totalCooks}
            max={cookMilestone}
            label="掌勺"
          />
          <MiniProgressBar
            value={myStats?.favoriteCount ?? favoritesCount}
            max={favMilestone}
            label="收藏"
          />
        </div>
        {myScore > 0 && (
          <div className="mt-4 text-center text-[11px] text-ink-400">
            总积分 <span className="font-semibold text-ink-700">{myScore}</span>
          </div>
        )}
      </section>

      {/* 6.2 — 收藏精选 */}
      {favPreview.length > 0 && (
        <section>
          <div className="flex items-end justify-between mb-3">
            <h2 className="font-serif text-lg text-ink-900">收藏精选</h2>
            <Link to="/favorites" className="text-xs text-brand">全部 →</Link>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {favPreview.map((fav) => {
              const src = fav.first_image?.thumb_url ?? fav.first_image?.url ?? undefined
              return (
                <Link key={fav.id} to={`/recipe/${fav.id}`} className="flex flex-col gap-1">
                  <DishThumb
                    id={fav.id}
                    name={fav.title}
                    src={src}
                    className="w-full aspect-square"
                    rounded="lg"
                  />
                  <div className="text-[10px] text-ink-700 truncate">{fav.title}</div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* 6.3 — 成就预览 */}
      {achievementsSummary && (
        <section className="surface-card p-5">
          <div className="flex items-end justify-between mb-4">
            <h2 className="font-serif text-lg text-ink-900">已解锁成就</h2>
            <Link to="/achievements" className="text-xs text-brand">全部 →</Link>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-honey-100 text-honey-600 flex items-center justify-center text-sm shrink-0">🍳</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-ink-900">点单达人</div>
                <div className="text-[11px] text-ink-400">累计点单 {achievementsSummary.me.stats.orderCount} 次</div>
              </div>
              <span className="text-[10px] rounded-full bg-honey-100 text-honey-600 px-2 py-0.5 shrink-0">已解锁</span>
            </div>
            {achievementsSummary.me.stats.cookCount > 0 && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-sm shrink-0">👨‍🍳</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-ink-900">家庭掌勺</div>
                  <div className="text-[11px] text-ink-400">累计掌勺 {achievementsSummary.me.stats.cookCount} 次</div>
                </div>
                <span className="text-[10px] rounded-full bg-brand-50 text-brand-600 px-2 py-0.5 shrink-0">已解锁</span>
              </div>
            )}
            {achievementsSummary.me.stats.favoriteCount > 0 && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center text-sm shrink-0">❤️</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-ink-900">收藏爱好者</div>
                  <div className="text-[11px] text-ink-400">已收藏 {achievementsSummary.me.stats.favoriteCount} 道菜</div>
                </div>
                <span className="text-[10px] rounded-full bg-rose-100 text-rose-500 px-2 py-0.5 shrink-0">已解锁</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 6.4 — 近期烹饪 */}
      {cookLogs.length > 0 && (
        <section>
          <div className="flex items-end justify-between mb-3">
            <h2 className="font-serif text-lg text-ink-900">近期烹饪</h2>
          </div>
          <div className="surface-card divide-y divide-cream-100">
            {cookLogs.map((log) => (
              <div key={log.id} className="flex items-center gap-3 p-4">
                <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-semibold shrink-0">
                  {(log.cooked_by_name ?? '?').charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-ink-900 font-medium truncate">
                    {log.recipe_title ?? `菜谱 #${log.recipe_id}`}
                  </div>
                  <div className="text-[11px] text-ink-400 mt-0.5">
                    {log.cooked_by_name} · {relativeTime(log.cooked_at)}
                  </div>
                </div>
                {log.avg_rating != null && log.avg_rating > 0 && (
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Star className="w-3 h-3 fill-honey-400 text-honey-400" />
                    <span className="text-[11px] text-ink-600">{log.avg_rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 最近备注 */}
      {recentComments.length > 0 && (
        <section className="surface-card p-4">
          <HomeRecentComments comments={recentComments} />
        </section>
      )}

      {/* Sign-out */}
      <button
        type="button"
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="w-full surface-card p-4 flex items-center justify-center gap-2 text-rose-500 cursor-pointer disabled:opacity-50"
      >
        {isLoggingOut
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <LogOut className="w-4 h-4" />}
        退出登录
      </button>
    </main>
  )
}
