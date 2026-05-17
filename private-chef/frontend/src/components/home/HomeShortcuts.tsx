import { Link } from 'react-router'
import { Utensils, ClipboardList, Heart, PlusCircle } from 'lucide-react'

const SHORTCUTS = [
  { to: '/menu', label: '点菜', icon: Utensils },
  { to: '/orders', label: '我的订单', icon: ClipboardList },
  { to: '/favorites', label: '收藏', icon: Heart },
  { to: '/menu', label: '发布菜品', icon: PlusCircle },
] as const

export function HomeShortcuts() {
  return (
    <div className="grid grid-cols-4 gap-3">
      {SHORTCUTS.map(({ to, label, icon: Icon }, idx) => (
        <Link
          key={`${to}-${idx}`}
          to={to}
          className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-cream-100 transition-colors active:scale-95 duration-150"
        >
          <div className="bg-cream-100 p-3.5 rounded-2xl text-ink-700">
            <Icon className="h-5 w-5" />
          </div>
          <span className="text-xs font-semibold text-ink-700">{label}</span>
        </Link>
      ))}
    </div>
  )
}
