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
    <nav className="app-shell-tabbar pb-safe">
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
                'relative flex h-14 w-14 flex-col items-center justify-center gap-1 transition-all duration-300 ease-out',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className={cn(
                "flex items-center justify-center transition-all duration-300",
                isActive ? "bg-primary/10 rounded-full w-10 h-8" : "w-8 h-8 rounded-full hover:bg-secondary/50"
              )}>
                 <Icon className={cn("transition-transform duration-300", isActive ? "w-[22px] h-[22px] scale-110" : "w-5 h-5")} />
              </div>
              <span className={cn(
                "text-[10px] leading-none transition-all duration-300",
                isActive ? "font-semibold" : "font-medium"
              )}>
                {tab.name}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
