import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { baseUrl } from '@/lib/api'

export interface RecipeTag {
  id: number
  name: string
}

export interface RecipeImage {
  id: number
  url: string
  thumb_url: string | null
  sort_order: number
  created_at: string
}

export interface CookLog {
  id: number
  cooked_by: number
  cooked_by_name: string
  cooked_at: string
  note: string | null
}

export interface RecipeListRow {
  id: number
  title: string
  description: string | null
  steps: string[]
  cook_minutes: number | null
  servings: number | null
  created_by: number
  created_at: string
  updated_at: string
  first_image: { url: string; thumb_url: string | null } | null
  tags: RecipeTag[]
  avg_rating: number | null
}

export interface RecipesListRes {
  data: RecipeListRow[]
  total: number
  page: number
  limit: number
}

export interface RecipeDetailRes {
  id: number
  title: string
  description: string | null
  steps: string[]
  cook_minutes: number | null
  servings: number | null
  created_by: number
  created_at: string
  updated_at: string
  avg_rating: number | null
  images: RecipeImage[]
  tags: RecipeTag[]
  recent_cook_logs: CookLog[]
  is_favorited: boolean
}

export interface CreateRecipeReq {
  title: string
  description?: string
  steps: string[]
  cook_minutes?: number
  servings?: number
  difficulty?: 'easy' | 'medium' | 'hard'
  tags?: number[]
}

export type UpdateRecipeReq = Partial<CreateRecipeReq>

export interface SaveImageReq {
  url: string
  thumb_url?: string
  sort_order?: number
}

export type TagsRes = RecipeTag[]

function getErrorMessage(errorData: unknown, defaultMessage: string): string {
  if (errorData && typeof errorData === 'object' && 'error' in errorData) {
    return String((errorData as Record<string, unknown>).error)
  }
  return defaultMessage
}

export function useRecipes(params?: { limit?: number; q?: string; tag?: number }) {
  return useInfiniteQuery({
    queryKey: ['recipes', params],
    queryFn: async ({ pageParam = 1 }) => {
      const qs = new URLSearchParams()
      qs.set('page', pageParam.toString())
      if (params?.limit) qs.set('limit', params.limit.toString())
      if (params?.q) qs.set('q', params.q)
      if (params?.tag) qs.set('tag', params.tag.toString())
      
      const res = await fetch(`${baseUrl}/api/recipes?${qs.toString()}`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to fetch recipes')
      return res.json() as Promise<RecipesListRes>
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, limit, total } = lastPage
      if (page * limit < total) {
        return page + 1
      }
      return undefined
    }
  })
}

export function useRecipe(id: number) {
  return useQuery({
    queryKey: ['recipe', id],
    queryFn: async () => {
      const res = await fetch(`${baseUrl}/api/recipes/${id}`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to fetch recipe detail')
      return res.json() as Promise<RecipeDetailRes>
    },
    enabled: id > 0,
  })
}

export function useCreateRecipe() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (json: CreateRecipeReq) => {
      const res = await fetch(`${baseUrl}/api/recipes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json),
        credentials: 'include',
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(getErrorMessage(error, 'Failed to create recipe'))
      }
      return res.json() as Promise<{ id: number; [key: string]: unknown }>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
    },
  })
}

export function useUpdateRecipe() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, json }: { id: number; json: UpdateRecipeReq }) => {
      const res = await fetch(`${baseUrl}/api/recipes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json),
        credentials: 'include',
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(getErrorMessage(error, 'Failed to update recipe'))
      }
      return res.json()
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      queryClient.invalidateQueries({ queryKey: ['recipe', id] })
    },
  })
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${baseUrl}/api/recipes/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to delete recipe')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
    },
  })
}

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const res = await fetch(`${baseUrl}/api/tags`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to fetch tags')
      return res.json() as Promise<TagsRes>
    },
  })
}

export function useSaveRecipeImage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ recipeId, json }: { recipeId: number; json: SaveImageReq }) => {
      const res = await fetch(`${baseUrl}/api/recipes/${recipeId}/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json),
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to save image')
      return res.json()
    },
    onSuccess: (_, { recipeId }) => {
      queryClient.invalidateQueries({ queryKey: ['recipe', recipeId] })
    }
  })
}
