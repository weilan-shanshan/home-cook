import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import { RecipeTag } from './useRecipes'

export interface FavoriteItem {
  id: number
  title: string
  first_image: { url: string; thumb_url: string | null } | null
  tags: RecipeTag[]
  favorited_at: string
}

export function useFavorites() {
  return useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const res = await apiFetch(`/api/favorites`)
      if (!res.ok) throw new Error('Failed to fetch favorites')
      return res.json() as Promise<FavoriteItem[]>
    },
  })
}

export function useToggleFavorite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ recipeId, isFavorited }: { recipeId: number; isFavorited: boolean }) => {
      const res = await apiFetch(`/api/favorites/${recipeId}`, {
        method: isFavorited ? 'DELETE' : 'POST',
      })
      if (!res.ok) throw new Error(isFavorited ? 'Failed to unfavorite' : 'Failed to favorite')
      return { recipeId, isFavorited: !isFavorited }
    },
    onMutate: async ({ recipeId, isFavorited }) => {
      await queryClient.cancelQueries({ queryKey: ['favorites'] })
      await queryClient.cancelQueries({ queryKey: ['recipe', recipeId] })
      return { recipeId, isFavorited }
    },
    onSuccess: (_, { recipeId }) => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
      queryClient.invalidateQueries({ queryKey: ['recipe', recipeId] })
    },
  })
}
