import { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import { useRegister } from '@/hooks/useAuth'

export default function Register() {
  const [mode, setMode] = useState<'create' | 'join'>('create')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  
  const { toast } = useToast()
  const navigate = useNavigate()
  const { mutate: register, isPending } = useRegister()

  const normalizedInviteCode = inviteCode.trim().toUpperCase()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!username.trim() || !displayName.trim() || !password.trim()) {
      toast({
        title: '错误',
        description: '请填写所有必填字段',
        variant: 'destructive',
      })
      return
    }

    if (mode === 'join' && !normalizedInviteCode) {
      toast({
        title: '错误',
        description: '加入家庭需要邀请码',
        variant: 'destructive',
      })
      return
    }

    register(
      {
        username,
        display_name: displayName,
        mode,
        password,
        invite_code: mode === 'join' ? normalizedInviteCode : undefined,
      },
      {
        onSuccess: () => {
          toast({
            title: '欢迎！',
            description: '您的账号已成功创建。',
          })
          navigate('/', { replace: true })
        },
        onError: (err) => {
          toast({
            title: '注册失败',
            description: err.message || '发生错误',
            variant: 'destructive',
          })
        },
      }
    )
  }

  const submitDisabled = isPending

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.85),_transparent_42%),linear-gradient(180deg,_hsl(var(--background)),_#ECECEF)] px-4 py-8">
      <Card className="w-full max-w-md shadow-elevated rounded-modal glass-card border-border/60">
        <CardHeader className="space-y-2 text-center pb-6">
          <CardTitle className="text-3xl font-semibold tracking-tight">
            创建账号
          </CardTitle>
          <CardDescription className="text-base">
            加入您的家庭厨房或创建一个新的家庭。
          </CardDescription>
        </CardHeader>
        
        <Tabs value={mode} onValueChange={(v) => setMode(v as 'create' | 'join')} className="w-full">
          <div className="px-6 mb-4">
            <TabsList className="grid w-full grid-cols-2 rounded-lg h-12 p-1">
              <TabsTrigger value="create" className="rounded-md font-medium">创建家庭</TabsTrigger>
              <TabsTrigger value="join" className="rounded-md font-medium">加入家庭</TabsTrigger>
            </TabsList>
          </div>
          
          <form onSubmit={handleSubmit}>
            <TabsContent value="create" className="m-0">
              <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="username-create">用户名</Label>
                    <Input
                      id="username-create"
                      disabled={submitDisabled}
                      value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-11 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="displayName-create">昵称</Label>
                    <Input
                      id="displayName-create"
                      disabled={submitDisabled}
                      value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="h-11 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-create">密码</Label>
                    <Input
                      id="password-create"
                      type="password"
                      disabled={submitDisabled}
                      value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 rounded-lg"
                  />
                </div>
              </CardContent>
            </TabsContent>
            
            <TabsContent value="join" className="m-0">
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="inviteCode-join">邀请码</Label>
                    <Input
                      id="inviteCode-join"
                      disabled={submitDisabled}
                      value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    className="h-11 rounded-lg uppercase tracking-widest font-mono"
                    placeholder="ABCDEF"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username-join">用户名</Label>
                    <Input
                      id="username-join"
                      disabled={submitDisabled}
                      value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-11 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="displayName-join">昵称</Label>
                    <Input
                      id="displayName-join"
                      disabled={submitDisabled}
                      value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="h-11 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-join">密码</Label>
                    <Input
                      id="password-join"
                      type="password"
                      disabled={submitDisabled}
                      value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 rounded-lg"
                  />
                </div>
              </CardContent>
            </TabsContent>
            
            <CardFooter className="flex flex-col gap-4 pt-6">
              <Button
                type="submit"
                className="w-full h-12 rounded-lg font-medium text-base shadow-sm"
                disabled={submitDisabled}
              >
                {isPending ? '正在创建账号...' : '注册'}
              </Button>
              <div className="text-sm text-center text-muted-foreground">
                已经有账号了？{' '}
                <Link
                  to="/login"
                  className="text-primary hover:underline font-medium"
                >
                  去登录
                </Link>
              </div>
            </CardFooter>
          </form>
        </Tabs>
      </Card>
    </div>
  )
}
