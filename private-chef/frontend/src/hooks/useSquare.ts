import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query'
import { baseUrl } from '@/lib/api'

export interface SquareRecipeSummary {
  id: number
  title: string
  description: string | null
  cook_minutes: number | null
  servings: number | null
  family: { id: number; name: string }
  created_at: string
  first_image: { url: string; thumbUrl: string | null } | null
  like_count: number
  comment_count: number
  liked_by_me: boolean
  tags: Array<{ id: number; name: string }>
}

export interface SquareRecipeDetail {
  id: number
  title: string
  description: string | null
  steps: string[]
  cook_minutes: number | null
  servings: number | null
  created_at: string
  family: { id: number; name: string }
  is_own_family: boolean
  images: Array<{ id: number; url: string; thumb_url: string | null; sort_order: number }>
  tags: Array<{ id: number; name: string }>
  like_count: number
  liked_by_me: boolean
  comments: Array<{
    id: number
    content: string
    created_at: string
    user: { id: number; name: string }
  }>
}

export interface SquareListRes {
  data: SquareRecipeSummary[]
  total: number
  page: number
  limit: number
}

export function useSquareRecipes(opts?: { limit?: number }) {
  const limit = opts?.limit ?? 20
  return useInfiniteQuery({
    queryKey: ['square-recipes', { limit }],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await fetch(
        `${baseUrl}/api/square/recipes?page=${pageParam}&limit=${limit}`,
        { credentials: 'include' },
      )
      if (!res.ok) throw new Error('加载广场失败')
      return res.json() as Promise<SquareListRes>
    },
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.page * last.limit < last.total ? last.page + 1 : undefined,
  })
}

export function useSquareRecipe(id: number) {
  return useQuery({
    queryKey: ['square-recipe', id],
    queryFn: async () => {
      const res = await fetch(`${baseUrl}/api/square/recipes/${id}`, {
        credentials: 'include',
      })
      if (!res.ok) throw new Error('加载菜品失败')
      return res.json() as Promise<SquareRecipeDetail>
    },
    enabled: id > 0,
  })
}

export function useToggleSquareLike() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (recipeId: number) => {
      const res = await fetch(`${baseUrl}/api/square/recipes/${recipeId}/like`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) throw new Error('点赞失败')
      return res.json() as Promise<{ liked: boolean; like_count: number }>
    },
    onSuccess: (_, recipeId) => {
      qc.invalidateQueries({ queryKey: ['square-recipes'] })
      qc.invalidateQueries({ queryKey: ['square-recipe', recipeId] })
    },
  })
}

export function useAddSquareComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ recipeId, content }: { recipeId: number; content: string }) => {
      const res = await fetch(`${baseUrl}/api/square/recipes/${recipeId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
        credentials: 'include',
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: '评论失败' }))
        throw new Error(err.message || err.error || '评论失败')
      }
      return res.json()
    },
    onSuccess: (_, { recipeId }) => {
      qc.invalidateQueries({ queryKey: ['square-recipe', recipeId] })
      qc.invalidateQueries({ queryKey: ['square-recipes'] })
    },
  })
}

export function useCloneSquareRecipe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (recipeId: number) => {
      const res = await fetch(`${baseUrl}/api/square/recipes/${recipeId}/clone`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: '复制失败' }))
        throw new Error(err.message || err.error || '复制失败')
      }
      return res.json() as Promise<{ id: number; title: string }>
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recipes'] })
      qc.invalidateQueries({ queryKey: ['home-summary'] })
      qc.invalidateQueries({ queryKey: ['tags'] })
    },
  })
}

export function usePublishRecipe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ recipeId, isPublic }: { recipeId: number; isPublic: boolean }) => {
      const res = await fetch(`${baseUrl}/api/recipes/${recipeId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_public: isPublic }),
        credentials: 'include',
      })
      if (!res.ok) throw new Error('发布状态切换失败')
      return res.json() as Promise<{ id: number; is_public: boolean }>
    },
    onSuccess: (_, { recipeId }) => {
      qc.invalidateQueries({ queryKey: ['recipe', recipeId] })
      qc.invalidateQueries({ queryKey: ['square-recipes'] })
    },
  })
}
