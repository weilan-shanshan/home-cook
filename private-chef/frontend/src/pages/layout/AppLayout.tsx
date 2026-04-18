import { Outlet } from 'react-router'
import { RequireAuth } from '@/lib/auth'
import { TabBar } from './TabBar'

export function AppLayout() {
  return (
    <RequireAuth>
      <div className="app-shell">
        <main className="app-shell-main flex flex-col">
          <Outlet />
        </main>
        <TabBar />
      </div>
    </RequireAuth>
  )
}
