import { useQuery } from '@tanstack/react-query'
import { baseUrl } from '@/lib/api'

export type Quota = {
  plan: 'free' | 'unlimited'
  recipes: { used: number; limit: number | null }
  images: { used: number; limit: number | null }
}

export function useQuota() {
  return useQuery({
    queryKey: ['quota'],
    queryFn: async (): Promise<Quota> => {
      const res = await fetch(`${baseUrl}/api/quota`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to fetch quota')
      return res.json()
    },
    staleTime: 30_000,
  })
}
