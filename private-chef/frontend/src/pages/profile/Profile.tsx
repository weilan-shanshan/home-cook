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
    <div className="max-w-2xl mx-auto space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Info */}
      <div className="flex items-center gap-5 p-4 sm:p-6 glass-card rounded-2xl border shadow-sm">
        <Avatar className="h-20 w-20 border-2 border-background shadow-md">
          <AvatarFallback className="text-xl font-medium bg-primary/10 text-primary">
            {userInitials}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {user.display_name || user.username}
          </h1>
          <Badge variant="secondary" className="px-2.5 py-0.5 font-medium capitalize">
            {user.role === 'admin' ? '管理员' : user.role === 'member' ? '成员' : user.role}
          </Badge>
        </div>
      </div>

      {/* Stats Row */}
      <div className="order-stats grid grid-cols-3 gap-3">
        <div 
          className="flex flex-col items-center justify-center p-4 glass-card rounded-2xl border shadow-sm cursor-pointer hover:bg-secondary/50 transition-colors"
          onClick={() => navigate('/orders')}
        >
          <div className="text-2xl font-bold mb-1">{summary.myOrderStats.total}</div>
          <div className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            <FileText className="w-3 h-3" />
            点餐统计
          </div>
        </div>
        <div 
          className="flex flex-col items-center justify-center p-4 glass-card rounded-2xl border shadow-sm cursor-pointer hover:bg-secondary/50 transition-colors"
          onClick={() => navigate('/favorites')}
        >
          <div className="text-2xl font-bold mb-1 text-rose-500">{summary.myFavoritesCount}</div>
          <div className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            <Heart className="w-3 h-3" />
            我的收藏
          </div>
        </div>
        <div 
          className="flex flex-col items-center justify-center p-4 glass-card rounded-2xl border shadow-sm cursor-pointer hover:bg-secondary/50 transition-colors"
          onClick={() => toast({ description: '评论中心即将上线，敬请期待', duration: 2000 })}
        >
          <div className="text-2xl font-bold mb-1 text-blue-500">{summary.myCommentsCount}</div>
          <div className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            <MessageCircle className="w-3 h-3" />
            我的评论
          </div>
        </div>
        <div className="col-span-3 grid grid-cols-3 gap-3">
          <div className="rounded-2xl border bg-background/60 p-3 text-center shadow-sm">
            <div className="text-lg font-semibold text-foreground">{summary.myOrderStats.total}</div>
            <div className="text-xs text-muted-foreground">全部订单</div>
          </div>
          <div className="rounded-2xl border bg-background/60 p-3 text-center shadow-sm">
            <div className="text-lg font-semibold text-amber-600">{summary.myOrderStats.pending}</div>
            <div className="text-xs text-muted-foreground">进行中</div>
          </div>
          <div className="rounded-2xl border bg-background/60 p-3 text-center shadow-sm">
            <div className="text-lg font-semibold text-emerald-600">{summary.myOrderStats.completed}</div>
            <div className="text-xs text-muted-foreground">已完成</div>
          </div>
        </div>
      </div>

      {/* Recent Activity: Ordered / Cooked */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Ordered By Me */}
        <Card className="glass-card shadow-sm border-border/60">
          <CardHeader className="pb-3 px-5 pt-5 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              我点过的
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0 space-y-3">
            {summary.orderedByMe.length > 0 ? summary.orderedByMe.map(order => (
              <div 
                key={order.id} 
                onClick={() => navigate(`/orders/${order.id}`)}
                className="flex items-center justify-between p-2 -mx-2 rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors"
              >
                <div className="min-w-0 pr-3">
                  <div className="font-medium text-sm truncate">{order.recipeTitles.join('、') || '无菜品'}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{order.mealDate} {order.mealType === 'lunch' ? '午餐' : '晚餐'}</div>
                </div>
                <Badge variant={order.status === 'completed' ? 'secondary' : 'default'} className="shrink-0 font-normal text-[10px]">
                  {order.status === 'completed' ? '已完成' : order.status === 'submitted' ? '待接单' : '处理中'}
                </Badge>
              </div>
            )) : (
              <div className="text-sm text-muted-foreground py-4 text-center">暂无点餐记录</div>
            )}
          </CardContent>
        </Card>

        {/* Cooked By Me */}
        <Card className="glass-card shadow-sm border-border/60">
          <CardHeader className="pb-3 px-5 pt-5 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base flex items-center gap-2">
              <ChefHat className="w-4 h-4 text-orange-500" />
              我做过的
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0 space-y-3">
            {summary.cookedByMe.length > 0 ? summary.cookedByMe.map(order => (
              <div 
                key={order.id} 
                onClick={() => navigate(`/orders/${order.id}`)}
                className="flex items-center justify-between p-2 -mx-2 rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors"
              >
                <div className="min-w-0 pr-3">
                  <div className="font-medium text-sm truncate">{order.recipeTitles.join('、') || '无菜品'}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{order.mealDate} {order.mealType === 'lunch' ? '午餐' : '晚餐'}</div>
                </div>
                <Badge variant={order.status === 'completed' ? 'secondary' : 'default'} className="shrink-0 font-normal text-[10px]">
                  {order.status === 'completed' ? '已完成' : order.status === 'submitted' ? '待接单' : '处理中'}
                </Badge>
              </div>
            )) : (
              <div className="text-sm text-muted-foreground py-4 text-center">暂无做饭记录</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Settings List */}
      <div className="glass-card rounded-2xl border shadow-sm divide-y divide-border/50">
        <div 
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-secondary/50 transition-colors rounded-t-2xl"
          onClick={() => navigate('/achievements')}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <ChefHat className="w-5 h-5 text-yellow-600" />
            </div>
            <span className="font-medium">家庭成就</span>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>
        <div 
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-secondary/50 transition-colors"
          onClick={() => toast({ description: '通知设置开发中，敬请期待', duration: 2000 })}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Settings className="w-5 h-5 text-blue-600" />
            </div>
            <span className="font-medium">通知设置</span>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>
      </div>

      {/* Family Info */}
      {summary.family && (
        <Card className="glass-card border-none shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
            <Users className="w-32 h-32" />
          </div>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">{summary.family.name}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              邀请码：<span className="font-mono text-primary font-bold">{summary.family.inviteCode}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6 ml-1" onClick={handleCopyInvite}>
                <Copy className="h-3 w-3" />
              </Button>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                家庭成员 ({summary.familyMembers.length})
              </h3>
              
              <div className="family-members grid gap-2">
                {summary.familyMembers.map(member => {
                  const initials = (member.displayName || 'U').substring(0, 2).toUpperCase()
                  return (
                    <div 
                      key={member.userId} 
                      className="flex items-center justify-between p-2 rounded-lg bg-background/50 border border-border/40 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border shadow-sm">
                          <AvatarFallback className="text-[10px] font-medium bg-primary/5 text-primary">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">
                          {member.displayName || '未知用户'}
                          {member.userId === user.id && <span className="ml-2 text-xs text-muted-foreground">(我)</span>}
                        </span>
                      </div>
                      <Badge variant={member.role === 'admin' ? 'default' : 'secondary'} className="capitalize text-[10px] px-1.5 py-0">
                        {member.role === 'admin' ? '管理员' : member.role === 'member' ? '成员' : member.role}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logout */}
      <div className="pt-4 flex justify-center">
        <Button 
          variant="ghost" 
          className="text-destructive hover:bg-destructive/10 hover:text-destructive w-full sm:w-auto"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <LogOut className="h-4 w-4 mr-2" />}
          退出登录
        </Button>
      </div>
    </div>
  )
}
