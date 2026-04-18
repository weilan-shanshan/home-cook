import { useNavigate } from 'react-router'
import { useCurrentUser, useLogout } from '@/hooks/useAuth'
import { useProfileSummary } from '@/hooks/useProfileSummary'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, LogOut, Users, Heart, MessageCircle, ChevronRight, FileText, ChefHat, Settings, Copy } from 'lucide-react'

export default function Profile() {
  const { data: user, isLoading: isLoadingUser } = useCurrentUser()
  const { data: summary, isLoading: isLoadingSummary } = useProfileSummary()
  const { mutate: logout, isPending: isLoggingOut } = useLogout()
  const { toast } = useToast()
  const navigate = useNavigate()

  const handleCopyInvite = async () => {
    if (!summary?.family.inviteCode) return
    try {
      await navigator.clipboard.writeText(summary.family.inviteCode)
      toast({ description: '已复制邀请码' })
    } catch {
      toast({ title: '复制失败', description: '请手动复制。', variant: 'destructive' })
    }
  }

  const handleLogout = () => {
    logout(undefined, {
      onSuccess: () => navigate('/login', { replace: true })
    })
  }

  if (isLoadingUser || isLoadingSummary) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
      </div>
    )
  }

  if (!user || !summary) return null

  const userInitials = (user.display_name || user.username).substring(0, 2).toUpperCase()

  return (
    <div className="space-y-6 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="glass-card rounded-[28px] border border-border/70 p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <Avatar className="h-20 w-20 border-2 border-background shadow-md">
            <AvatarFallback className="bg-primary/10 text-xl font-medium text-primary">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-3">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">我的资料</p>
              <h1 className="truncate text-2xl font-bold tracking-tight text-foreground">
                {user.display_name || user.username}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="px-2.5 py-0.5 font-medium capitalize">
                  {user.role === 'admin' ? '管理员' : user.role === 'member' ? '成员' : user.role}
                </Badge>
                <Badge variant="outline" className="max-w-full truncate px-2.5 py-0.5 font-normal">
                  {summary.family.name}
                </Badge>
              </div>
            </div>

            <div className="rounded-2xl border bg-background/70 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">家庭邀请码</p>
                  <p className="font-mono text-sm font-semibold text-primary">{summary.family.inviteCode}</p>
                </div>
                <Button variant="secondary" size="sm" className="shrink-0 gap-1.5" onClick={handleCopyInvite}>
                  <Copy className="h-3.5 w-3.5" />
                  复制
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <button
            type="button"
            className="rounded-2xl border bg-background/70 p-3 text-left transition-colors hover:bg-secondary/50"
            onClick={() => navigate('/orders')}
          >
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FileText className="h-4 w-4" />
            </div>
            <p className="text-lg font-semibold text-foreground">{summary.myOrderStats.total}</p>
            <p className="text-xs text-muted-foreground">点餐统计</p>
          </button>
          <button
            type="button"
            className="rounded-2xl border bg-background/70 p-3 text-left transition-colors hover:bg-secondary/50"
            onClick={() => navigate('/favorites')}
          >
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
              <Heart className="h-4 w-4" />
            </div>
            <p className="text-lg font-semibold text-foreground">{summary.myFavoritesCount}</p>
            <p className="text-xs text-muted-foreground">我的收藏</p>
          </button>
          <button
            type="button"
            className="rounded-2xl border bg-background/70 p-3 text-left transition-colors hover:bg-secondary/50"
            onClick={() => toast({ description: '评论中心即将上线，敬请期待', duration: 2000 })}
          >
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
              <MessageCircle className="h-4 w-4" />
            </div>
            <p className="text-lg font-semibold text-foreground">{summary.myCommentsCount}</p>
            <p className="text-xs text-muted-foreground">我的评论</p>
          </button>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">我的近况</h2>
            <p className="text-sm text-muted-foreground">最近订单、掌勺和家庭动态都集中在这里。</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border bg-background/70 p-3 text-center shadow-sm">
            <div className="text-lg font-semibold text-foreground">{summary.myOrderStats.total}</div>
            <div className="text-xs text-muted-foreground">全部订单</div>
          </div>
          <div className="rounded-2xl border bg-background/70 p-3 text-center shadow-sm">
            <div className="text-lg font-semibold text-amber-600">{summary.myOrderStats.pending}</div>
            <div className="text-xs text-muted-foreground">进行中</div>
          </div>
          <div className="rounded-2xl border bg-background/70 p-3 text-center shadow-sm">
            <div className="text-lg font-semibold text-emerald-600">{summary.myOrderStats.completed}</div>
            <div className="text-xs text-muted-foreground">已完成</div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Card className="glass-card border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 px-5 pb-3 pt-5">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-primary" />
                我点过的
              </CardTitle>
              <CardDescription className="mt-1">最近提交过的订单</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 px-5 pb-5 pt-0">
            {summary.orderedByMe.length > 0 ? summary.orderedByMe.map(order => (
              <button
                type="button"
                key={order.id}
                onClick={() => navigate(`/orders/${order.id}`)}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors hover:bg-secondary/50"
              >
                <div className="min-w-0 pr-3">
                  <div className="truncate text-sm font-medium">{order.recipeTitles.join('、') || '无菜品'}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{order.mealDate} {order.mealType === 'lunch' ? '午餐' : '晚餐'}</div>
                </div>
                <Badge variant={order.status === 'completed' ? 'secondary' : 'default'} className="shrink-0 text-[10px] font-normal">
                  {order.status === 'completed' ? '已完成' : order.status === 'submitted' ? '待接单' : '处理中'}
                </Badge>
              </button>
            )) : (
              <div className="py-4 text-center text-sm text-muted-foreground">暂无点餐记录</div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 px-5 pb-3 pt-5">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <ChefHat className="h-4 w-4 text-orange-500" />
                我做过的
              </CardTitle>
              <CardDescription className="mt-1">最近掌勺过的餐食</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 px-5 pb-5 pt-0">
            {summary.cookedByMe.length > 0 ? summary.cookedByMe.map(order => (
              <button
                type="button"
                key={order.id}
                onClick={() => navigate(`/orders/${order.id}`)}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors hover:bg-secondary/50"
              >
                <div className="min-w-0 pr-3">
                  <div className="truncate text-sm font-medium">{order.recipeTitles.join('、') || '无菜品'}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{order.mealDate} {order.mealType === 'lunch' ? '午餐' : '晚餐'}</div>
                </div>
                <Badge variant={order.status === 'completed' ? 'secondary' : 'default'} className="shrink-0 text-[10px] font-normal">
                  {order.status === 'completed' ? '已完成' : order.status === 'submitted' ? '待接单' : '处理中'}
                </Badge>
              </button>
            )) : (
              <div className="py-4 text-center text-sm text-muted-foreground">暂无做饭记录</div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="glass-card relative overflow-hidden rounded-[28px] border shadow-sm">
        <div className="pointer-events-none absolute right-0 top-0 p-6 opacity-5">
          <Users className="h-32 w-32" />
        </div>
        <div className="relative border-b border-border/50 px-5 py-4">
          <h2 className="text-lg font-semibold">家庭信息</h2>
          <p className="mt-1 text-sm text-muted-foreground">一起吃饭的人、邀请码和家庭身份都在这里。</p>
        </div>
        <div className="relative space-y-4 px-5 py-5">
          <div>
            <p className="text-sm font-medium text-foreground">{summary.family.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">家庭成员 {summary.familyMembers.length} 人</p>
          </div>

          <div className="grid gap-2">
            {summary.familyMembers.map(member => {
              const initials = (member.displayName || 'U').substring(0, 2).toUpperCase()
              return (
                <div
                  key={member.userId}
                  className="flex items-center justify-between rounded-2xl border border-border/40 bg-background/60 px-3 py-2 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border shadow-sm">
                      <AvatarFallback className="bg-primary/5 text-[10px] font-medium text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">
                      {member.displayName || '未知用户'}
                      {member.userId === user.id && <span className="ml-2 text-xs text-muted-foreground">(我)</span>}
                    </span>
                  </div>
                  <Badge variant={member.role === 'admin' ? 'default' : 'secondary'} className="px-1.5 py-0 text-[10px] capitalize">
                    {member.role === 'admin' ? '管理员' : member.role === 'member' ? '成员' : member.role}
                  </Badge>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="glass-card divide-y divide-border/50 overflow-hidden rounded-[28px] border shadow-sm">
        <button
          type="button"
          className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-secondary/50"
          onClick={() => navigate('/achievements')}
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-yellow-500/10 p-2">
              <ChefHat className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="font-medium">家庭成就</p>
              <p className="text-xs text-muted-foreground">看看本月最常点、最常做的菜</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>

        <button
          type="button"
          className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-secondary/50"
          onClick={() => toast({ description: '通知设置开发中，敬请期待', duration: 2000 })}
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <Settings className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium">通知设置</p>
              <p className="text-xs text-muted-foreground">餐单变动、评论提醒和家庭通知</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>
      </section>

      <div className="flex justify-center pt-2">
        <Button
          variant="ghost"
          className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive sm:w-auto"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
          退出登录
        </Button>
      </div>
    </div>
  )
}
