import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'

export type ShareTargetType = 'order' | 'recipe' | 'achievements' | 'daily_menu'
export type ShareChannel = 'copy_link' | 'wechat' | 'poster_download'
export type ShareType = 'link' | 'card' | 'poster'

export type ShareCardPayload = {
  target_type: ShareTargetType
  target_id: string
  title: string
  summary: string
  cover_image_url: string | null
  share_page: {
    token: string
    url: string
  } | null
  wechat: {
    title: string
    summary: string
    cover_url: string | null
  }
  poster: {
    title: string
    summary: string
    qr_target_url: string | null
    helper_text: string
  }
  visual: {
    hero_emphasis: 'order' | 'recipe' | 'achievements' | 'daily_menu'
    accent: 'amber' | 'tomato' | 'champagne' | 'sage'
    chips: string[]
  }
  public_context: {
    family_name: string | null
    requester_display_name?: string | null
    cook_display_name?: string | null
    featured_display_name?: string | null
    date_label?: string | null
  }
  facts: string[]
  order?: {
    id: number
    meal_type: string
    meal_date: string
    note: string | null
    status: string
    created_at: string
  }
  items?: Array<{
    id: number
    recipe_id: number
    quantity: number
    recipe_title: string
    image: { url: string; thumbUrl: string | null } | null
  }>
  like_count?: number
  recipe?: {
    id: number
    title: string
    description: string | null
    cook_minutes: number | null
    servings: number | null
    tags: string[]
  }
  achievements?: {
    rank: number
    score: number
    member_count: number
    total_orders: number
    total_shares: number
    highlight_lines: string[]
  }
  daily_menu?: {
    menu_items: Array<{
      recipe_id: number
      title: string
      image: { url: string; thumbUrl: string | null } | null
    }>
    reason_chips: string[]
  }
}

export type ShareActionResponse = {
  id: number
  user_id: number
  target_type: ShareTargetType
  target_id: string
  share_type: ShareType
  channel: ShareChannel
  token: string
  share_url: string
  created_at: string
  wechat: ShareCardPayload['wechat']
  poster: ShareCardPayload['poster']
}

function getErrorMessage(errorData: unknown, fallback: string) {
  if (errorData && typeof errorData === 'object' && 'error' in errorData) {
    return String((errorData as Record<string, unknown>).error)
  }

  return fallback
}

export function useShareCard(endpoint: string, enabled: boolean) {
  return useQuery({
    queryKey: ['share-card', endpoint],
    queryFn: async (): Promise<ShareCardPayload> => {
      const res = await apiFetch(endpoint)
      if (!res.ok) {
        const error = await res.json().catch(() => null)
        throw new Error(getErrorMessage(error, 'Failed to fetch share card'))
      }

      return res.json()
    },
    enabled,
    staleTime: 60 * 1000,
  })
}

export function useCreateShare(endpoint: string, invalidateKeys: Array<readonly unknown[]>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { shareType: ShareType; channel: ShareChannel }): Promise<ShareActionResponse> => {
      const res = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(input),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => null)
        throw new Error(getErrorMessage(error, 'Failed to create share'))
      }

      return res.json()
    },
    onSuccess: async () => {
      await Promise.all(
        invalidateKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      )
    },
  })
}

export function usePublicShare(token: string) {
  return useQuery({
    queryKey: ['public-share', token],
    queryFn: async (): Promise<ShareCardPayload> => {
      const res = await apiFetch(`/api/shares/${token}`)
      if (!res.ok) {
        const error = await res.json().catch(() => null)
        throw new Error(getErrorMessage(error, 'Failed to fetch public share'))
      }

      return res.json()
    },
    enabled: token.trim().length > 0,
    retry: false,
  })
}
