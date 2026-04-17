import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import type { OrderDetail } from './useOrders'

export interface OrderComment {
  id: number
  order_id: number
  user_id: number
  display_name: string | null
  role_type: string
  content: string
  created_at: string
}

export interface CreateOrderCommentParams {
  content: string
  roleType: string
}

export interface OrderReview {
  id: number
  order_id: number
  user_id: number
  display_name: string | null
  score: number
  taste_score: number
  portion_score: number
  overall_note: string | null
  created_at: string
}

export interface CreateOrderReviewParams {
  score: number
  tasteScore: number
  portionScore: number
  overallNote?: string
}

export interface ToggleOrderLikeParams {
  isLikedByMe: boolean
}

export interface OrderLikeResponse {
  order_id: number
  user_id: number
  liked: boolean
  created_at?: string
}

export interface CreateOrderShareParams {
  shareType: string
  channel: string
}

export interface OrderShare {
  id: number
  order_id: number
  user_id: number
  share_type: string
  channel: string
  created_at: string
}

function getErrorMessage(errorData: unknown, defaultMessage: string): string {
  if (errorData && typeof errorData === 'object' && 'error' in errorData) {
    return String((errorData as Record<string, unknown>).error)
  }

  return defaultMessage
}

function updateCachedOrderDetail(
  current: OrderDetail | undefined,
  updater: (order: OrderDetail) => OrderDetail,
) {
  if (!current) {
    return current
  }

  return updater(current)
}

export function useOrderComments(orderId: number) {
  return useQuery({
    queryKey: ['order-comments', orderId],
    queryFn: async (): Promise<OrderComment[]> => {
      const res = await apiFetch(`/api/orders/${orderId}/comments`)
      if (!res.ok) {
        throw new Error('Failed to fetch order comments')
      }
      return res.json()
    },
    enabled: orderId > 0,
  })
}

export function useCreateOrderComment(orderId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (json: CreateOrderCommentParams): Promise<OrderComment> => {
      const res = await apiFetch(`/api/orders/${orderId}/comments`, {
        method: 'POST',
        body: JSON.stringify(json),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => null)
        throw new Error(getErrorMessage(error, 'Failed to create order comment'))
      }

      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-comments', orderId] })
    },
  })
}

export function useOrderReviews(orderId: number) {
  return useQuery({
    queryKey: ['order-reviews', orderId],
    queryFn: async (): Promise<OrderReview[]> => {
      const res = await apiFetch(`/api/orders/${orderId}/reviews`)
      if (!res.ok) {
        throw new Error('Failed to fetch order reviews')
      }
      return res.json()
    },
    enabled: orderId > 0,
  })
}

export function useCreateOrderReview(orderId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (json: CreateOrderReviewParams): Promise<OrderReview> => {
      const res = await apiFetch(`/api/orders/${orderId}/reviews`, {
        method: 'POST',
        body: JSON.stringify(json),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => null)
        throw new Error(getErrorMessage(error, 'Failed to create order review'))
      }

      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-reviews', orderId] })
    },
  })
}

export function useToggleOrderLike(orderId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ isLikedByMe }: ToggleOrderLikeParams): Promise<OrderLikeResponse> => {
      const res = await apiFetch(`/api/orders/${orderId}/like`, {
        method: isLikedByMe ? 'DELETE' : 'POST',
      })

      if (!res.ok) {
        const error = await res.json().catch(() => null)
        throw new Error(getErrorMessage(error, isLikedByMe ? 'Failed to unlike order' : 'Failed to like order'))
      }

      return res.json()
    },
    onMutate: async ({ isLikedByMe }) => {
      await queryClient.cancelQueries({ queryKey: ['order', orderId] })

      const previousOrder = queryClient.getQueryData<OrderDetail>(['order', orderId])

      queryClient.setQueryData<OrderDetail | undefined>(['order', orderId], (current) =>
        updateCachedOrderDetail(current, (order) => ({
          ...order,
          isLikedByMe: !isLikedByMe,
          likeCount: Math.max(0, order.likeCount + (isLikedByMe ? -1 : 1)),
        })),
      )

      return { previousOrder }
    },
    onError: (_error, _variables, context) => {
      if (context?.previousOrder) {
        queryClient.setQueryData(['order', orderId], context.previousOrder)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

export function useCreateOrderShare(orderId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (json: CreateOrderShareParams): Promise<OrderShare> => {
      const res = await apiFetch(`/api/orders/${orderId}/share`, {
        method: 'POST',
        body: JSON.stringify(json),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => null)
        throw new Error(getErrorMessage(error, 'Failed to share order'))
      }

      return res.json()
    },
    onSuccess: () => {
      queryClient.setQueryData<OrderDetail | undefined>(['order', orderId], (current) =>
        updateCachedOrderDetail(current, (order) => ({
          ...order,
          shareCount: order.shareCount + 1,
        })),
      )

      queryClient.invalidateQueries({ queryKey: ['order', orderId] })
    },
  })
}
