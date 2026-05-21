import { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import { Button } from '@/components/ui/button'
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
    <div className="min-h-dvh bg-cream-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-3xl bg-brand text-white flex items-center justify-center font-serif text-2xl">
            厨
          </div>
          <h1 className="font-serif text-3xl text-ink-900">COOK · 私厨</h1>
          <p className="text-xs text-ink-500">说一声，厨房有人接</p>
        </div>

        <Tabs value={mode} onValueChange={(v) => setMode(v as 'create' | 'join')} className="w-full">
          <div className="mb-4">
            <TabsList className="grid w-full grid-cols-2 rounded-full h-10 p-1">
              <TabsTrigger value="create" className="rounded-full font-medium text-sm">创建家庭</TabsTrigger>
              <TabsTrigger value="join" className="rounded-full font-medium text-sm">加入家庭</TabsTrigger>
            </TabsList>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="surface-card p-6 space-y-4">
              <TabsContent value="create" className="m-0 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username-create">用户名</Label>
                  <Input
                    id="username-create"
                    disabled={submitDisabled}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="displayName-create">昵称</Label>
                  <Input
                    id="displayName-create"
                    disabled={submitDisabled}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
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
                  />
                </div>
              </TabsContent>

              <TabsContent value="join" className="m-0 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="inviteCode-join">邀请码</Label>
                  <Input
                    id="inviteCode-join"
                    disabled={submitDisabled}
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    className="uppercase tracking-widest font-mono"
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="displayName-join">昵称</Label>
                  <Input
                    id="displayName-join"
                    disabled={submitDisabled}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
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
                  />
                </div>
              </TabsContent>
            </div>

            <Button
              type="submit"
              variant="default"
              size="pill"
              className="w-full"
              disabled={submitDisabled}
            >
              {isPending ? '注册中…' : '注册'}
            </Button>
          </form>
        </Tabs>

        <p className="text-center text-xs text-ink-500">
          已有账号？<Link to="/login" className="text-brand">登录</Link>
        </p>
      </div>
    </div>
  )
}
