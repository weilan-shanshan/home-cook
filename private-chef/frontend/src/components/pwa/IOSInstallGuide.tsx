import type { ReactNode } from 'react'

export function IOSInstallGuide() {
  return (
    <div className="flex flex-col gap-4 py-2">
      <Step
        index={1}
        title="点底部「分享」按钮"
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
            <path d="M12 16V4M12 4l-4 4M12 4l4 4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 12v6a2 2 0 002 2h12a2 2 0 002-2v-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        }
      />
      <Step
        index={2}
        title="向下滚动找到「添加到主屏幕」"
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
            <rect x="3" y="4" width="18" height="4" rx="1" />
            <rect x="3" y="11" width="18" height="4" rx="1" />
            <rect x="3" y="18" width="18" height="2" rx="1" />
          </svg>
        }
      />
      <Step
        index={3}
        title="右上角点「添加」"
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
            <circle cx="12" cy="12" r="9" />
            <path d="M8 12h8M12 8v8" strokeLinecap="round" />
          </svg>
        }
      />
      <p className="text-xs text-muted-foreground pt-1">
        装好后就能从桌面图标一键打开，不再走浏览器。
      </p>
    </div>
  )
}

function Step({ index, title, icon }: { index: number; title: string; icon: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
        {index}
      </div>
      <div className="flex flex-1 items-center gap-3 rounded-lg border bg-muted/40 px-3 py-2">
        <div className="text-primary/80">{icon}</div>
        <span className="text-sm">{title}</span>
      </div>
    </div>
  )
}
