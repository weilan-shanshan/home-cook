import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { client, type LoginRequest, type RegisterRequest } from '../lib/api'

export interface User {
  id: number
  username: string
  display_name: string | null
  role: 'admin' | 'member'
  familyId: number | null
}

const authErrorMessages: Record<string, string> = {
  'Validation failed': '请求参数校验失败',
  'Username already taken': '用户名已被占用',
  'Invite code is required': '请输入家庭邀请码',
  'Invalid invite code': '邀请码无效',
  'Invalid username or password': '用户名或密码错误',
  'Not authenticated': '登录状态已失效',
  'Login failed': '登录失败',
  'Registration failed': '注册失败',
  'Logout failed': '退出登录失败',
}

function getErrorMessage(errorData: unknown, defaultMessage: string): string {
  if (errorData && typeof errorData === 'object' && 'error' in errorData) {
    const errorObj = errorData as { error: string }
    const rawMessage = String(errorObj.error)
    return authErrorMessages[rawMessage] ?? rawMessage
  }
  return defaultMessage
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const res = await client.api.auth.me.$get()
      if (!res.ok) {
        throw new Error(authErrorMessages['Not authenticated'])
      }
      const data = await res.json()
      return data as User
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}

export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      const res = await client.api.auth.login.$post({ json: data })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(getErrorMessage(errorData, '登录失败，请稍后重试'))
      }
      const dataRes = await res.json()
      return dataRes as User
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['currentUser'], data)
    },
  })
}

export function useRegister() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: RegisterRequest) => {
      const res = await client.api.auth.register.$post({ json: data })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(getErrorMessage(errorData, '注册失败，请稍后重试'))
      }
      const dataRes = await res.json()
      return dataRes as User
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['currentUser'], data)
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const res = await client.api.auth.logout.$post()
      if (!res.ok) {
        throw new Error(authErrorMessages['Logout failed'])
      }
      return await res.json()
    },
    onSuccess: () => {
      queryClient.setQueryData(['currentUser'], null)
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
    },
  })
}
