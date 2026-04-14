import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'

export interface CookLogRating {
  id: number
  cook_log_id: number
  user_id: number
  display_name: string
  score: number
  comment: string | null
  created_at: string
}

export interface CookLogDetail {
  id: number
  recipe_id: number
  recipe_title?: string
  cooked_by: number
  cooked_by_name: string
  cooked_at: string
  note: string | null
  ratings: CookLogRating[]
  avg_rating: number | null
  rating_count: number
}

export interface CreateCookLogReq {
  recipe_id: number
  cooked_at?: string
  note?: string
}

export interface CreateRatingReq {
  score: number
  comment?: string
}

export interface CookLogsListRes {
  data: CookLogDetail[]
  total: number
  page: number
  limit: number
}

function getErrorMessage(errorData: unknown, defaultMessage: string): string {
  if (errorData && typeof errorData === 'object' && 'error' in errorData) {
    return String((errorData as Record<string, unknown>).error)
  }
  return defaultMessage
}

export function useCookLogs(recipeId?: number) {
  return useQuery({
    queryKey: recipeId ? ['recipe', recipeId, 'logs'] : ['cook-logs', 'all'],
    queryFn: async () => {
      const url = recipeId 
        ? `/api/recipes/${recipeId}/logs`
        : `/api/cook-logs?page=1`
      const res = await apiFetch(url)
      if (!res.ok) throw new Error('Failed to fetch cook logs')
      return res.json()
    },
    enabled: recipeId === undefined || recipeId > 0,
  })
}

export function useCreateCookLog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (json: CreateCookLogReq) => {
      const res = await apiFetch(`/api/cook-logs`, {
        method: 'POST',
        body: JSON.stringify(json),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(getErrorMessage(error, 'Failed to create cook log'))
      }
      return res.json() as Promise<CookLogDetail>
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recipe', variables.recipe_id, 'logs'] })
      queryClient.invalidateQueries({ queryKey: ['cook-logs', 'all'] })
    },
  })
}

export function useCreateRating() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ cookLogId, json }: { cookLogId: number; json: CreateRatingReq }) => {
      const res = await apiFetch(`/api/cook-logs/${cookLogId}/ratings`, {
        method: 'POST',
        body: JSON.stringify(json),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(getErrorMessage(error, 'Failed to create rating'))
      }
      return res.json() as Promise<CookLogRating>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipe'] })
    },
  })
}
