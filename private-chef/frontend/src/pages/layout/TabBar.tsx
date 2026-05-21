import { Link, useLocation } from 'react-router'
import { ClipboardList, Home as HomeIcon, User, UtensilsCrossed } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { name: '首页', path: '/', match: (p: string) => p === '/', icon: HomeIcon },
  { name: '菜单', path: '/menu', match: (p: string) => p.startsWith('/menu'), icon: UtensilsCrossed },
  { name: '订单', path: '/orders', match: (p: string) => p.startsWith('/orders') || p.startsWith('/order/'), icon: ClipboardList },
  { name: '我', path: '/profile', match: (p: string) => p.startsWith('/profile') || p.startsWith('/favorites') || p.startsWith('/wishes') || p.startsWith('/achievements'), icon: User },
] as const

export function TabBar() {
  const { pathname } = useLocation()
  return (
    <nav className="app-shell-tabbar pb-safe bg-cream-50/95 backdrop-blur border-t border-cream-200">
      <ul className="mx-auto flex h-16 max-w-md items-stretch justify-around px-2">
        {TABS.map((t) => {
          const active = t.match(pathname)
          const Icon = t.icon
          return (
            <li key={t.path} className="flex-1">
              <Link
                to={t.path}
                aria-current={active ? 'page' : undefined}
                className="h-full flex flex-col items-center justify-center gap-1.5 cursor-pointer"
              >
                <span
                  className={cn(
                    'flex items-center justify-center w-10 h-7 rounded-lg transition-colors',
                    active ? 'bg-brand text-white' : 'bg-transparent text-ink-400',
                  )}
                >
                  <Icon className="w-5 h-5" strokeWidth={active ? 2.4 : 2} />
                </span>
                <span
                  className={cn(
                    'text-[11px] leading-none transition-colors',
                    active ? 'text-ink-900 font-semibold' : 'text-ink-400',
                  )}
                >
                  {t.name}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
