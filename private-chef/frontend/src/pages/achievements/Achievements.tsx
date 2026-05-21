import { useAchievementsSummary, useAchievementsLeaderboard } from '@/hooks/useAchievements'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Trophy, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ShareDialog } from '@/components/share/ShareDialog'
import { StatTile } from '@/components/home/StatTile'
import { useState } from 'react'

export default function Achievements() {
  const { data: summary, isLoading: isLoadingSummary } = useAchievementsSummary()
  const { data: leaderboard, isLoading: isLoadingLeaderboard } = useAchievementsLeaderboard()
  const [shareDialogOpen, setShareDialogOpen] = useState(false)

  if (isLoadingSummary || isLoadingLeaderboard) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-muted-foreground gap-5 animate-in fade-in zoom-in-95 duration-500">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
          <div className="bg-white/80 dark:bg-black/50 p-4 rounded-3xl shadow-elevated relative">
            <Trophy className="h-8 w-8 animate-bounce text-yellow-500" />
          </div>
        </div>
        <p className="text-sm font-medium tracking-wide">正在加载成就榜...</p>
      </div>
    )
  }

  if (!summary || !leaderboard) return null

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇'
      case 2: return '🥈'
      case 3: return '🥉'
      default: return `#${rank}`
    }
  }

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-600'
      case 2: return 'text-gray-500'
      case 3: return 'text-amber-600'
      default: return 'text-muted-foreground'
    }
  }

  return (
    <main className="space-y-4 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="font-serif text-3xl text-ink-900">成就</h1>
        <Button variant="inverse" size="sm" className="rounded-full" onClick={() => setShareDialogOpen(true)}>
          <Share2 className="mr-1.5 h-4 w-4" />
          分享
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatTile tone="mustard" label="总单数" value={summary.family.totalOrders} />
        <StatTile tone="sage" label="总掌勺" value={summary.family.totalCooks} />
      </div>


      <div className="space-y-3">
        {leaderboard.leaderboard.map((entry) => {
          const initials = (entry.displayName || 'U').substring(0, 2).toUpperCase()
          return (
            <div
              key={entry.userId}
              className="surface-card p-4 flex items-center gap-3"
            >
              <div className={`text-lg font-black min-w-[1.5rem] text-center ${getRankColor(entry.rank)}`}>
                {getRankIcon(entry.rank)}
              </div>
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarFallback className="text-xs font-bold bg-brand text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-ink-900 truncate">{entry.displayName}</div>
                <div className="text-xs text-ink-500 mt-0.5">成就分: {entry.score}</div>
              </div>
              <span className="rounded-full bg-cream-100 text-ink-700 text-xs px-2.5 py-1 whitespace-nowrap">掌勺 {entry.cookCount}</span>
            </div>
          )
        })}
      </div>

      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        title="分享这段时间的家庭成就"
        shareCardEndpoint="/api/achievements/share-card"
        shareActionEndpoint="/api/achievements/share"
        invalidateKeys={[["achievements-summary"], ["achievements-leaderboard"]]}
      />
    </main>
  )
}
