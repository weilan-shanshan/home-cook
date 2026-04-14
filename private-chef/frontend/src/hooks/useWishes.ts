import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'

export interface Wish {
  id: number
  familyId: number
  userId: number
  dishName: string
  note: string | null
  status: 'pending' | 'fulfilled' | 'cancelled'
  recipeId: number | null
  createdAt: string
}

export interface CreateWishReq {
  dish_name: string
  note?: string
}

export interface UpdateWishStatusReq {
  status: 'pending' | 'fulfilled' | 'cancelled'
  recipe_id?: number
}

function getErrorMessage(errorData: unknown, defaultMessage: string): string {
  if (errorData && typeof errorData === 'object' && 'error' in errorData) {
    return String((errorData as Record<string, unknown>).error)
  }
  return defaultMessage
}

export function useWishes(status?: 'pending' | 'fulfilled' | 'cancelled') {
  return useQuery({
    queryKey: ['wishes', { status }],
    queryFn: async () => {
      const url = status ? `/api/wishes?status=${status}` : `/api/wishes`
      const res = await apiFetch(url)
      if (!res.ok) throw new Error('Failed to fetch wishes')
      return res.json() as Promise<Wish[]>
    },
  })
}

export function useCreateWish() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (json: CreateWishReq) => {
      const res = await apiFetch(`/api/wishes`, {
        method: 'POST',
        body: JSON.stringify(json),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(getErrorMessage(error, 'Failed to create wish'))
      }
      return res.json() as Promise<Wish>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishes'] })
    },
  })
}

export function useUpdateWishStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, json }: { id: number; json: UpdateWishStatusReq }) => {
      const res = await apiFetch(`/api/wishes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(json),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(getErrorMessage(error, 'Failed to update wish status'))
      }
      return res.json() as Promise<Wish>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishes'] })
    },
  })
}
