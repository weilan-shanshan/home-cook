import { Link, useNavigate } from 'react-router'
import { useCurrentUser, useLogout } from '@/hooks/useAuth'
import { useProfileSummary } from '@/hooks/useProfileSummary'
import { useHomeSummary } from '@/hooks/useHomeSummary'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { StatTile } from '@/components/home/StatTile'
import { HomeRecentComments } from '@/components/home/HomeRecentComments'
import { InstallEntryCard } from '@/components/pwa/InstallEntryCard'
import { Heart, ListChecks, Trophy, Bell, LogOut, ChevronRight, Loader2 } from 'lucide-react'

const LINKS = [
  { to: '/favorites',    label: '收藏',   icon: Heart },
  { to: '/wishes',       label: '心愿单', icon: ListChecks },
  { to: '/achievements', label: '成就',   icon: Trophy },
  { to: '/profile/notifications', label: '通知设置', icon: Bell },
] as const

export default function Profile() {
  const navigate = useNavigate()
  const { data: user, isLoading: isLoadingUser } = useCurrentUser()
  const { data: summary, isLoading: isLoadingSummary } = useProfileSummary()
  const { data: home, isLoading: isLoadingHome } = useHomeSummary()
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
  const favorites = summary.myFavoritesCount
  const totalCooks = home?.achievementSummary.totalCooks ?? 0 // TODO(profile-stats): consider dedicated endpoint

  const recentComments = home?.recentComments ?? []

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
      </header>

      {/* 2×2 StatTile grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatTile tone="cream"  label="累计点单" value={totalOrders} />
        <StatTile tone="sage"   label="累计掌勺" value={totalCooks} />
        <StatTile tone="sky"    label="待接单"   value={pending} />
        <StatTile tone="butter" label="收藏菜谱" value={favorites} />
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
