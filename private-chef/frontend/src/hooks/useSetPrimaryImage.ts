import { useMutation, useQueryClient } from '@tanstack/react-query'
import { baseUrl } from '@/lib/api'

interface SetPrimaryImageVars {
  recipeId: number
  imageId: number
}

export function useSetPrimaryImage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ imageId }: SetPrimaryImageVars) => {
      const res = await fetch(`${baseUrl}/api/images/${imageId}/primary`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({ message: '设置首图失败' }))
        throw new Error(body.message || body.error || '设置首图失败')
      }
      return res.json() as Promise<{ success: true }>
    },
    onSuccess: (_, { recipeId }) => {
      queryClient.invalidateQueries({ queryKey: ['recipe', recipeId] })
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      queryClient.invalidateQueries({ queryKey: ['home-summary'] })
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
    },
  })
}
