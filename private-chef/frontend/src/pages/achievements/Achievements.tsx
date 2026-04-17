import { useAchievementsSummary, useAchievementsLeaderboard } from '@/hooks/useAchievements'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Loader2, Trophy, Users, ChefHat, MessageSquare, Heart, Share2, Award } from 'lucide-react'

export default function Achievements() {
  const { data: summary, isLoading: isLoadingSummary } = useAchievementsSummary()
  const { data: leaderboard, isLoading: isLoadingLeaderboard } = useAchievementsLeaderboard()

  if (isLoadingSummary || isLoadingLeaderboard) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
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
    <div className="max-w-2xl mx-auto space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center justify-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          家庭成就
        </h1>
        <p className="text-sm text-muted-foreground">记录我们的美食旅程</p>
      </div>

      {/* Family Summary */}
      <Card className="glass-card shadow-sm border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            家庭概览
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 glass-card rounded-lg">
              <div className="text-2xl font-bold text-primary">{summary.family.memberCount}</div>
              <div className="text-xs text-muted-foreground">家庭成员</div>
            </div>
            <div className="text-center p-3 glass-card rounded-lg">
              <div className="text-2xl font-bold text-orange-500">{summary.family.activeMembers}</div>
              <div className="text-xs text-muted-foreground">活跃成员</div>
            </div>
            <div className="text-center p-3 glass-card rounded-lg">
              <div className="text-2xl font-bold text-blue-500">{summary.family.totalOrders}</div>
              <div className="text-xs text-muted-foreground">总点餐数</div>
            </div>
            <div className="text-center p-3 glass-card rounded-lg">
              <div className="text-2xl font-bold text-green-500">{summary.family.totalCooks}</div>
              <div className="text-xs text-muted-foreground">总掌勺数</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Rank */}
      <Card className="glass-card shadow-sm border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-500" />
            我的排名
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 glass-card rounded-lg">
            <div className={`text-3xl font-bold ${getRankColor(summary.me.rank)}`}>
              {getRankIcon(summary.me.rank)}
            </div>
            <div className="flex-1">
              <div className="font-medium">{summary.me.displayName}</div>
              <div className="text-sm text-muted-foreground">成就分: {summary.me.score}（点餐 + 掌勺）</div>
            </div>
            <Badge variant="secondary" className="capitalize">
              {summary.me.role === 'admin' ? '管理员' : '成员'}
            </Badge>
          </div>
          
          <div className="grid grid-cols-4 gap-2 mt-4">
            <div className="text-center p-2 glass-card rounded">
              <ChefHat className="w-4 h-4 mx-auto text-orange-500 mb-1" />
              <div className="text-sm font-bold">{summary.me.stats.cookCount}</div>
              <div className="text-xs text-muted-foreground">掌勺</div>
            </div>
            <div className="text-center p-2 glass-card rounded">
              <MessageSquare className="w-4 h-4 mx-auto text-blue-500 mb-1" />
              <div className="text-sm font-bold">{summary.me.stats.commentCount}</div>
              <div className="text-xs text-muted-foreground">评论</div>
            </div>
            <div className="text-center p-2 glass-card rounded">
              <Heart className="w-4 h-4 mx-auto text-red-500 mb-1" />
              <div className="text-sm font-bold">{summary.me.stats.likeCount}</div>
              <div className="text-xs text-muted-foreground">点赞</div>
            </div>
            <div className="text-center p-2 glass-card rounded">
              <Share2 className="w-4 h-4 mx-auto text-green-500 mb-1" />
              <div className="text-sm font-bold">{summary.me.stats.shareCount}</div>
              <div className="text-xs text-muted-foreground">分享</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <Card className="family-leaderboard glass-card shadow-sm border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            排行榜
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {leaderboard.leaderboard.map((entry) => {
            const initials = (entry.displayName || 'U').substring(0, 2).toUpperCase()
            return (
              <div 
                key={entry.userId} 
                className="flex items-center gap-4 p-3 glass-card rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <div className={`text-xl font-bold min-w-[2rem] ${getRankColor(entry.rank)}`}>
                  {getRankIcon(entry.rank)}
                </div>
                <Avatar className="h-10 w-10 border shadow-sm">
                  <AvatarFallback className="text-xs font-medium bg-primary/5 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{entry.displayName}</div>
                  <div className="text-sm text-muted-foreground">成就分: {entry.score}（点餐 + 掌勺）</div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full bg-background/70 px-2 py-1">点餐 {entry.orderCount}</span>
                    <span className="rounded-full bg-background/70 px-2 py-1">掌勺 {entry.cookCount}</span>
                    <span className="rounded-full bg-background/70 px-2 py-1">评论 {entry.commentCount}</span>
                    <span className="rounded-full bg-background/70 px-2 py-1">点赞 {entry.likeCount}</span>
                  </div>
                </div>
                <Badge variant={entry.role === 'admin' ? 'default' : 'secondary'} className="capitalize text-xs">
                  {entry.role === 'admin' ? '管理员' : '成员'}
                </Badge>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
