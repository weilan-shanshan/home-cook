import { useAchievementsSummary, useAchievementsLeaderboard } from '@/hooks/useAchievements'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Trophy, Users, ChefHat, MessageSquare, Heart, Share2, Award, Utensils } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ShareDialog } from '@/components/share/ShareDialog'
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
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col gap-5 pt-2">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              家庭成就 <Trophy className="h-6 w-6 text-yellow-500" />
            </h1>
            <p className="text-muted-foreground text-sm font-medium">记录我们的美食旅程</p>
          </div>
          <Button variant="outline" size="sm" className="rounded-full shadow-button bg-white/50 backdrop-blur-md border-primary/10 hover:bg-primary/5 text-primary" onClick={() => setShareDialogOpen(true)}>
            <Share2 className="mr-1.5 h-4 w-4" />
            分享成就卡
          </Button>
        </div>
      </div>

      {/* Family Summary */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 dark:bg-primary/20 p-1.5 rounded-lg">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">家庭概览</h2>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="glass-card rounded-[var(--radius-card)] p-4 shadow-card border border-white/40 dark:border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 group-hover:opacity-20 transition-all duration-500">
              <Users className="h-16 w-16 text-primary" />
            </div>
            <div className="relative z-10 flex flex-col gap-1.5">
              <div className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center mb-1">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <span className="text-2xl font-black text-primary">{summary.family.memberCount}</span>
              <p className="text-xs font-semibold text-muted-foreground">家庭成员</p>
            </div>
          </div>
          <div className="glass-card rounded-[var(--radius-card)] p-4 shadow-card border border-white/40 dark:border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 group-hover:opacity-20 transition-all duration-500">
              <Heart className="h-16 w-16 text-orange-500" />
            </div>
            <div className="relative z-10 flex flex-col gap-1.5">
              <div className="bg-orange-500/10 w-8 h-8 rounded-full flex items-center justify-center mb-1">
                <Heart className="h-4 w-4 text-orange-500" />
              </div>
              <span className="text-2xl font-black text-orange-500">{summary.family.activeMembers}</span>
              <p className="text-xs font-semibold text-muted-foreground">活跃成员</p>
            </div>
          </div>
          <div className="glass-card rounded-[var(--radius-card)] p-4 shadow-card border border-white/40 dark:border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 group-hover:opacity-20 transition-all duration-500">
              <Utensils className="h-16 w-16 text-blue-500" />
            </div>
            <div className="relative z-10 flex flex-col gap-1.5">
              <div className="bg-blue-500/10 w-8 h-8 rounded-full flex items-center justify-center mb-1">
                <Utensils className="h-4 w-4 text-blue-500" />
              </div>
              <span className="text-2xl font-black text-blue-500">{summary.family.totalOrders}</span>
              <p className="text-xs font-semibold text-muted-foreground">总点餐数</p>
            </div>
          </div>
          <div className="glass-card rounded-[var(--radius-card)] p-4 shadow-card border border-white/40 dark:border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 group-hover:opacity-20 transition-all duration-500">
              <ChefHat className="h-16 w-16 text-green-500" />
            </div>
            <div className="relative z-10 flex flex-col gap-1.5">
              <div className="bg-green-500/10 w-8 h-8 rounded-full flex items-center justify-center mb-1">
                <ChefHat className="h-4 w-4 text-green-500" />
              </div>
              <span className="text-2xl font-black text-green-500">{summary.family.totalCooks}</span>
              <p className="text-xs font-semibold text-muted-foreground">总掌勺数</p>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Rank */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center gap-2">
          <div className="bg-purple-100/50 dark:bg-purple-500/10 p-1.5 rounded-lg">
            <Award className="h-5 w-5 text-purple-500" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">我的排名</h2>
        </div>
        
        <div className="glass-card rounded-[var(--radius-card)] shadow-card border border-white/40 dark:border-white/5 p-5 relative overflow-hidden">
          <div className="flex items-center gap-4">
            <div className={`text-4xl font-black drop-shadow-sm ${getRankColor(summary.me.rank)}`}>
              {getRankIcon(summary.me.rank)}
            </div>
            <div className="flex-1">
              <div className="font-bold text-lg">{summary.me.displayName}</div>
              <div className="text-sm font-medium text-muted-foreground mt-0.5">成就分: <span className="text-foreground/90 font-bold">{summary.me.score}</span>（点餐 + 掌勺）</div>
            </div>
            <Badge variant="secondary" className="capitalize rounded-full px-3 py-1 font-semibold">
              {summary.me.role === 'admin' ? '管理员' : '成员'}
            </Badge>
          </div>
          
          <div className="grid grid-cols-4 gap-3 mt-5">
            <div className="flex flex-col items-center p-3 rounded-2xl bg-orange-50/50 dark:bg-orange-500/5 border border-orange-100 dark:border-orange-500/10">
              <ChefHat className="w-5 h-5 text-orange-500 mb-1.5" />
              <div className="text-base font-bold text-foreground/90">{summary.me.stats.cookCount}</div>
              <div className="text-[10px] font-semibold text-muted-foreground">掌勺</div>
            </div>
            <div className="flex flex-col items-center p-3 rounded-2xl bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10">
              <MessageSquare className="w-5 h-5 text-blue-500 mb-1.5" />
              <div className="text-base font-bold text-foreground/90">{summary.me.stats.commentCount}</div>
              <div className="text-[10px] font-semibold text-muted-foreground">评论</div>
            </div>
            <div className="flex flex-col items-center p-3 rounded-2xl bg-red-50/50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/10">
              <Heart className="w-5 h-5 text-red-500 mb-1.5" />
              <div className="text-base font-bold text-foreground/90">{summary.me.stats.likeCount}</div>
              <div className="text-[10px] font-semibold text-muted-foreground">点赞</div>
            </div>
            <div className="flex flex-col items-center p-3 rounded-2xl bg-green-50/50 dark:bg-green-500/5 border border-green-100 dark:border-green-500/10">
              <Share2 className="w-5 h-5 text-green-500 mb-1.5" />
              <div className="text-base font-bold text-foreground/90">{summary.me.stats.shareCount}</div>
              <div className="text-[10px] font-semibold text-muted-foreground">分享</div>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center gap-2">
          <div className="bg-yellow-100/50 dark:bg-yellow-500/10 p-1.5 rounded-lg">
            <Trophy className="h-5 w-5 text-yellow-500" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">排行榜</h2>
        </div>
        
        <div className="grid gap-3">
          {leaderboard.leaderboard.map((entry) => {
            const initials = (entry.displayName || 'U').substring(0, 2).toUpperCase()
            return (
              <div 
                key={entry.userId} 
                className="flex items-center gap-4 p-4 glass-card rounded-2xl shadow-card border border-white/40 dark:border-white/5 hover:border-primary/20 transition-all duration-300 group"
              >
                <div className={`text-2xl font-black min-w-[2rem] text-center drop-shadow-sm ${getRankColor(entry.rank)}`}>
                  {getRankIcon(entry.rank)}
                </div>
                <Avatar className="h-12 w-12 border-2 border-background shadow-sm ring-1 ring-black/5">
                  <AvatarFallback className="text-sm font-bold bg-primary/10 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[15px] truncate mb-0.5 group-hover:text-primary transition-colors">{entry.displayName}</div>
                  <div className="text-[13px] font-medium text-muted-foreground mb-2">成就分: <span className="text-foreground/80 font-bold">{entry.score}</span></div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="rounded-full px-2 py-0 h-5 text-[10px] font-medium border-primary/10 bg-primary/5 text-primary/80">点餐 {entry.orderCount}</Badge>
                    <Badge variant="outline" className="rounded-full px-2 py-0 h-5 text-[10px] font-medium border-orange-500/10 bg-orange-500/5 text-orange-600">掌勺 {entry.cookCount}</Badge>
                    <Badge variant="outline" className="rounded-full px-2 py-0 h-5 text-[10px] font-medium border-blue-500/10 bg-blue-500/5 text-blue-600">互动 {entry.commentCount + entry.likeCount}</Badge>
                  </div>
                </div>
                <Badge variant={entry.role === 'admin' ? 'default' : 'secondary'} className="capitalize text-[10px] rounded-full px-2.5 py-0.5 shadow-sm">
                  {entry.role === 'admin' ? '管理员' : '成员'}
                </Badge>
              </div>
            )
          })}
        </div>
      </div>

      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        title="分享这段时间的家庭成就"
        shareCardEndpoint="/api/achievements/share-card"
        shareActionEndpoint="/api/achievements/share"
        invalidateKeys={[["achievements-summary"], ["achievements-leaderboard"]]}
      />
    </div>
  )
}
