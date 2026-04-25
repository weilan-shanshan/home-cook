import { Outlet } from 'react-router'
import { RequireAuth } from '@/lib/auth'
import { TabBar } from './TabBar'

export function AppLayout() {
  return (
    <RequireAuth>
      <div className="app-shell bg-background/80 selection:bg-primary/20">
        <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background z-0" />
        <main className="app-shell-main flex flex-col relative z-10">
          <Outlet />
        </main>
        <TabBar />
      </div>
    </RequireAuth>
  )
}
