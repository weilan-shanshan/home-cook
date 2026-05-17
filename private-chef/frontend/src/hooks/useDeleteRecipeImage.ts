import { useMutation, useQueryClient } from '@tanstack/react-query'
import { baseUrl } from '@/lib/api'

interface DeleteRecipeImageVars {
  recipeId: number
  imageId: number
}

export function useDeleteRecipeImage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ imageId }: DeleteRecipeImageVars) => {
      const res = await fetch(`${baseUrl}/api/images/${imageId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({ message: '图片删除失败' }))
        throw new Error(body.message || body.error || '图片删除失败')
      }
      return res.json() as Promise<{ success: true }>
    },
    onSuccess: (_, { recipeId }) => {
      queryClient.invalidateQueries({ queryKey: ['recipe', recipeId] })
    },
  })
}
