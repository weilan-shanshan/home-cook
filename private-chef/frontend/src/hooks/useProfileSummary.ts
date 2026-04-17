import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'

export interface ProfileOrderSummary {
  id: number
  mealType: string
  mealDate: string
  status: string
  createdAt: string
  requester: {
    userId: number
    displayName: string
  }
  recipeTitles: string[]
}

export interface FamilyMemberSummary {
  userId: number
  displayName: string
  role: string
  joinedAt: string
}

export interface ProfileSummary {
  family: {
    id: number
    name: string
    inviteCode: string
  }
  myOrderStats: {
    total: number
    pending: number
    completed: number
  }
  myFavoritesCount: number
  myCommentsCount: number
  orderedByMe: ProfileOrderSummary[]
  cookedByMe: ProfileOrderSummary[]
  familyMembers: FamilyMemberSummary[]
}

export function useProfileSummary() {
  return useQuery<ProfileSummary>({
    queryKey: ['profile-summary'],
    queryFn: async () => {
      const response = await apiFetch('/api/profile/summary')
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      return response.json()
    },
  })
}
