import { Outlet } from 'react-router'
import { RequireAuth } from '@/lib/auth'
import { TabBar } from './TabBar'

export function AppLayout() {
  return (
    <RequireAuth>
      <div className="min-h-screen bg-background flex flex-col">
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6 pb-24">
          <Outlet />
        </main>
        <TabBar />
      </div>
    </RequireAuth>
  )
}
