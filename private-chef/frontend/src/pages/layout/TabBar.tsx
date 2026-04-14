import { Link, useLocation } from 'react-router'
import { Home, Utensils, Sparkles, User } from 'lucide-react'
import { cn } from '@/lib/utils'

export function TabBar() {
  const location = useLocation()
  const currentPath = location.pathname

  const tabs = [
    { name: '首页', path: '/', icon: Home },
    { name: '点餐', path: '/order/create', icon: Utensils },
    { name: '许愿', path: '/wishes', icon: Sparkles },
    { name: '我的', path: '/profile', icon: User },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-nav border-t pb-safe">
      <div className="mx-auto flex h-16 max-w-md items-center justify-around px-2">
        {tabs.map((tab) => {
          const isActive = tab.path === '/' 
            ? currentPath === '/' 
            : currentPath.startsWith(tab.path)
            
          const Icon = tab.icon
          
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={cn(
                "flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium leading-none">{tab.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
