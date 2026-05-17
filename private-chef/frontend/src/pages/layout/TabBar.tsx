import { Link, useLocation } from 'react-router'
import { ClipboardList, Home, User, Utensils } from 'lucide-react'
import { cn } from '@/lib/utils'

export function TabBar() {
  const location = useLocation()
  const currentPath = location.pathname

  const tabs = [
    { name: '首页', path: '/', icon: Home },
    { name: '点菜', path: '/menu', icon: Utensils },
    { name: '订单', path: '/orders', icon: ClipboardList },
    { name: '我的', path: '/profile', icon: User },
  ]

  return (
    <nav className="app-shell-tabbar pb-safe bg-white/95 backdrop-blur border-t border-cream-300">
      <div className="mx-auto flex h-16 max-w-md items-center justify-around px-4">
        {tabs.map((tab) => {
          const isActive = tab.path === '/'
            ? currentPath === '/'
            : currentPath.startsWith(tab.path)

          const Icon = tab.icon

          return (
            <Link
              key={tab.path}
              to={tab.path}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'relative flex h-14 w-14 flex-col items-center justify-center gap-1 transition-colors duration-200',
                isActive ? 'text-brand' : 'text-ink-400 hover:text-ink-700',
              )}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-1 w-8 rounded-b-full bg-brand" />
              )}
              <div
                className={cn(
                  'flex items-center justify-center rounded-full transition-all duration-200',
                  isActive ? 'bg-brand/10 w-10 h-8' : 'w-8 h-8 hover:bg-cream-100',
                )}
              >
                <Icon className={cn('transition-transform duration-200', isActive ? 'w-5 h-5' : 'w-5 h-5')} />
              </div>
              <span
                className={cn(
                  'text-[10px] leading-none transition-all duration-200',
                  isActive ? 'font-bold' : 'font-medium',
                )}
              >
                {tab.name}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
