import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'

interface ResetPasswordParams {
  familyId: number
  userId: number
  newPassword: string
}

export function useResetMemberPassword() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ familyId, userId, newPassword }: ResetPasswordParams) => {
      const res = await apiFetch(
        `/api/families/${familyId}/members/${userId}/password`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newPassword }),
        },
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: '操作失败' }))
        throw new Error((err as { error?: string }).error ?? '操作失败')
      }
      return res.json() as Promise<{ ok: boolean }>
    },
    onSuccess: (_, { familyId }) => {
      queryClient.invalidateQueries({ queryKey: ['familyMembers', familyId] })
    },
  })
}
