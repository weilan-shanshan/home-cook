import { Link } from 'react-router'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useFamilyMembers } from '@/hooks/useFamily'

type Props = {
  familyId: number | null
}

export function HomeFamilyTastesCard({ familyId }: Props) {
  const { data: members = [] } = useFamilyMembers(familyId)
  if (!familyId || members.length === 0) return null

  const preview = members.slice(0, 4)

  return (
    <section>
      <div className="flex items-end justify-between mb-3">
        <h2 className="font-serif text-lg text-ink-900">家里的味道</h2>
        <Link to="/profile/family" className="text-xs text-brand">家庭 →</Link>
      </div>
      <div className="surface-card p-4">
        <div className="grid grid-cols-4 gap-3">
          {preview.map((member) => {
            const name = member.display_name ?? '成员'
            const initial = name.charAt(0).toUpperCase()
            const isAdmin = member.role === 'admin'
            return (
              <div key={member.id} className="flex flex-col items-center gap-1.5">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className={`text-sm font-semibold ${isAdmin ? 'bg-brand-100 text-brand-700' : 'bg-cream-200 text-ink-600'}`}>
                    {initial}
                  </AvatarFallback>
                </Avatar>
                <div className="text-[11px] text-ink-700 text-center truncate w-full">{name}</div>
                {isAdmin && (
                  <span className="text-[9px] rounded-full bg-brand-50 text-brand-600 px-1.5 py-0.5">掌厨</span>
                )}
              </div>
            )
          })}
          {/* Dashed invite slots when fewer than 4 members */}
          {preview.length < 4 && Array.from({ length: 4 - preview.length }).map((_, i) => (
            <Link
              key={`empty-${i}`}
              to="/profile/family"
              className="flex flex-col items-center gap-1.5"
            >
              <div className="w-12 h-12 rounded-full border-2 border-dashed border-brand-200 flex items-center justify-center text-brand-300 text-sm hover:border-brand-400 transition-colors">
                +
              </div>
              <div className="text-[11px] text-brand-400 text-center">邀请</div>
            </Link>
          ))}
        </div>
        {/* Invite CTA */}
        {preview.length < 4 && (
          <div className="mt-3 pt-3 border-t border-cream-100">
            <Link
              to="/profile/family"
              className="flex items-center justify-center gap-1.5 text-xs text-brand-600 font-medium"
            >
              邀请家人加入 →
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
