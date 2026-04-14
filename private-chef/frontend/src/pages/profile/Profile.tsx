import { useNavigate } from 'react-router'
import { useCurrentUser, useLogout } from '@/hooks/useAuth'
import { useFamily, useFamilyMembers } from '@/hooks/useFamily'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Copy, Loader2, LogOut, Users } from 'lucide-react'

export default function Profile() {
  const { data: user, isLoading: isLoadingUser } = useCurrentUser()
  const { data: family, isLoading: isLoadingFamily } = useFamily(user?.familyId)
  const { data: members, isLoading: isLoadingMembers } = useFamilyMembers(user?.familyId)
  const { mutate: logout, isPending: isLoggingOut } = useLogout()
  const { toast } = useToast()
  const navigate = useNavigate()

  const handleCopyInvite = async () => {
    if (!family?.invite_code) return
    try {
      await navigator.clipboard.writeText(family.invite_code)
      toast({
        description: '已复制',
      })
    } catch {
      toast({
        title: '复制失败',
        description: '请手动复制。',
        variant: 'destructive'
      })
    }
  }

  const handleLogout = () => {
    logout(undefined, {
      onSuccess: () => {
        navigate('/login', { replace: true })
      }
    })
  }

  if (isLoadingUser || isLoadingFamily || isLoadingMembers) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
      </div>
    )
  }

  if (!user) return null

  const userInitials = (user.display_name || user.username).substring(0, 2).toUpperCase()

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex items-center gap-6 mb-8">
        <Avatar className="h-24 w-24 border-4 border-background shadow-md">
          <AvatarFallback className="text-2xl font-medium bg-primary/10 text-primary">
            {userInitials}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {user.display_name || user.username}
          </h1>
          <Badge variant="secondary" className="px-3 py-1 font-medium capitalize">
            {user.role === 'admin' ? '管理员' : user.role === 'member' ? '成员' : user.role}
          </Badge>
        </div>
      </div>

      {family && (
        <Card className="glass-card border-none shadow-lg overflow-hidden relative">
          <div className="absolute top-0 right-0 p-6 opacity-5">
            <Users className="w-32 h-32" />
          </div>
          <CardHeader>
            <CardTitle className="text-2xl">{family.name}</CardTitle>
            <CardDescription className="text-base">
              管理您的家庭成员和邀请码。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-secondary/30 backdrop-blur-sm border border-border/50">
              <div className="mb-4 sm:mb-0">
                <p className="text-sm font-medium text-muted-foreground mb-1">邀请码</p>
                <div className="text-2xl font-mono tracking-widest font-bold text-primary">
                  {family.invite_code}
                </div>
              </div>
              <Button onClick={handleCopyInvite} variant="secondary" className="shadow-sm">
                <Copy className="h-4 w-4 mr-2" />
                复制邀请码
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  家庭成员
                </h3>
                <Badge variant="outline" className="rounded-full">
                  {members?.length || 0}
                </Badge>
              </div>
              
              <div className="grid gap-3">
                {members?.map(member => {
                  const initials = (member.display_name || 'U').substring(0, 2).toUpperCase()
                  return (
                    <div 
                      key={member.id} 
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border shadow-sm">
                          <AvatarFallback className="text-xs font-medium">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {member.display_name || '未知用户'}
                          {member.id === user.id && <span className="ml-2 text-xs text-muted-foreground">(我)</span>}
                        </span>
                      </div>
                      <Badge variant={member.role === 'admin' ? 'default' : 'secondary'} className="capitalize text-xs">
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

      <div className="pt-8 flex justify-center">
        <Button 
          variant="destructive" 
          size="lg" 
          className="w-full sm:w-auto min-w-[200px] shadow-sm hover:shadow-md transition-all"
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
