import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { baseUrl } from '@/lib/api'

export interface AiQuota {
  monthly_quota: number
  used: number
  remaining: number
  year_month: string
  available: boolean
}

export interface AiRecommendation {
  recipe_id: number
  title: string
  reason: string
  tags: string[]
  cook_minutes: number | null
  first_image: { url: string; thumb_url: string | null } | null
}

export interface AiWishRecommendResponse {
  intro: string
  recommendations: AiRecommendation[]
  quota: {
    monthly_quota: number
    used: number
    remaining: number
  }
}

export function useAiQuota() {
  return useQuery({
    queryKey: ['ai-quota'],
    queryFn: async () => {
      const res = await fetch(`${baseUrl}/api/ai/quota`, { credentials: 'include' })
      if (!res.ok) throw new Error('加载额度失败')
      return res.json() as Promise<AiQuota>
    },
  })
}

export function useWishRecommend() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (prompt: string) => {
      const res = await fetch(`${baseUrl}/api/ai/wish-recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
        credentials: 'include',
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: '推荐失败' }))
        const e = new Error(err.message || err.error || '推荐失败')
        ;(e as Error & { status?: number }).status = res.status
        throw e
      }
      return res.json() as Promise<AiWishRecommendResponse>
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-quota'] })
    },
  })
}
