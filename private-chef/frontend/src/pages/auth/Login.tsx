import { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { useLogin } from '@/hooks/useAuth'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const { toast } = useToast()
  const navigate = useNavigate()
  const { mutate: login, isPending } = useLogin()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!username.trim() || !password.trim()) {
      toast({
        title: '错误',
        description: '请填写所有字段',
        variant: 'destructive',
      })
      return
    }

    login(
      { username, password },
      {
        onSuccess: () => {
          navigate('/', { replace: true })
        },
        onError: (err) => {
          toast({
            title: '登录失败',
            description: err.message || '请检查您的凭据并重试',
            variant: 'destructive',
          })
        },
      }
    )
  }

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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="surface-card p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                name="username"
                autoComplete="username"
                autoFocus
                disabled={isPending}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                disabled={isPending}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="default"
            size="pill"
            className="w-full"
            disabled={isPending}
          >
            {isPending ? '登录中…' : '登录'}
          </Button>
        </form>

        <p className="text-center text-xs text-ink-500">
          没有账号？<Link to="/register" className="text-brand">注册</Link>
        </p>
      </div>
    </div>
  )
}
