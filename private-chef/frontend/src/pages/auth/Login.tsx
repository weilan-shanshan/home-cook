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
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md shadow-elevated rounded-modal">
        <CardHeader className="space-y-2 text-center pb-6">
          <CardTitle className="text-3xl font-semibold tracking-tight">
            欢迎回来
          </CardTitle>
          <CardDescription className="text-base">
            请输入您的凭据以访问您的家庭菜谱。
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
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
                className="h-11 rounded-lg"
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
                className="h-11 rounded-lg"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pt-4">
            <Button
              type="submit"
              className="w-full h-12 rounded-lg font-medium text-base shadow-sm"
              disabled={isPending}
            >
              {isPending ? '登录中...' : '登录'}
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              还没有账号？{' '}
              <Link
                to="/register"
                className="text-primary hover:underline font-medium"
              >
                  去注册
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
