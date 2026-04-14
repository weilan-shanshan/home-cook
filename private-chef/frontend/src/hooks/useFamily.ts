import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'

export interface Family {
  id: number
  name: string
  invite_code: string
  created_by: number
  created_at: string
}

export interface FamilyMember {
  id: number
  display_name: string | null
  role: 'admin' | 'member'
  joined_at: string
}

export function useFamily(id?: number | null) {
  return useQuery({
    queryKey: ['family', id],
    queryFn: async () => {
      const res = await apiFetch(`/api/families/${id}`)
      if (!res.ok) {
        throw new Error('Failed to fetch family info')
      }
      return res.json() as Promise<Family>
    },
    enabled: !!id,
  })
}

export function useFamilyMembers(id?: number | null) {
  return useQuery({
    queryKey: ['familyMembers', id],
    queryFn: async () => {
      const res = await apiFetch(`/api/families/${id}/members`)
      if (!res.ok) {
        throw new Error('Failed to fetch family members')
      }
      return res.json() as Promise<FamilyMember[]>
    },
    enabled: !!id,
  })
}