import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { baseUrl } from '@/lib/api'

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'
export type OrderStatus = 'pending' | 'confirmed' | 'completed'

export interface OrderItem {
  id: number
  recipeId: number
  quantity: number
  recipeTitle: string
  image: {
    url: string
    thumbUrl: string | null
  } | null
}

export interface Order {
  id: number
  userId: number
  mealType: MealType
  mealDate: string
  note: string | null
  status: OrderStatus
  createdAt: string
  items: OrderItem[]
}

export interface CreateOrderParams {
  meal_type: MealType
  meal_date: string
  note?: string
  items: {
    recipe_id: number
    quantity: number
  }[]
}

export interface UpdateOrderStatusParams {
  id: number
  status: 'confirmed' | 'completed'
}

interface OrdersQueryParams {
  status?: OrderStatus
  meal_date?: string
}

export function useOrders(params?: OrdersQueryParams) {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: async (): Promise<Order[]> => {
      const searchParams = new URLSearchParams()
      if (params?.status) searchParams.set('status', params.status)
      if (params?.meal_date) searchParams.set('meal_date', params.meal_date)

      const queryStr = searchParams.toString()
      const url = `${baseUrl}/api/orders${queryStr ? `?${queryStr}` : ''}`

      const res = await fetch(url, { credentials: 'include' })
      if (!res.ok) {
        throw new Error('Failed to fetch orders')
      }
      return res.json()
    },
  })
}

export function useOrder(id: number) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: async (): Promise<Order> => {
      const res = await fetch(`${baseUrl}/api/orders/${id}`, { credentials: 'include' })
      if (!res.ok) {
        throw new Error('Failed to fetch order')
      }
      return res.json()
    },
    enabled: id > 0,
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateOrderParams): Promise<Order> => {
      const res = await fetch(`${baseUrl}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to create order')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: UpdateOrderStatusParams) => {
      const res = await fetch(`${baseUrl}/api/orders/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to update order status')
      }
      return res.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order', variables.id] })
    },
  })
}
