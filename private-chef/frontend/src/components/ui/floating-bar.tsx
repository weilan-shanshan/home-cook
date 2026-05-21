import * as React from 'react'
import { cn } from '@/lib/utils'

type Props = React.HTMLAttributes<HTMLDivElement> & {
  visible?: boolean
}

export function FloatingBar({ className, visible = true, children, ...rest }: Props) {
  return (
    <div
      className={cn(
        'fixed left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-[420px]',
        'transition-all duration-200',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none',
        className,
      )}
      style={{ bottom: 'var(--app-shell-floating-offset)' }}
      {...rest}
    >
      <div className="rounded-full bg-ink-900/92 backdrop-blur-xl text-white shadow-sheet px-5 py-3 flex items-center justify-between gap-3 border border-white/10">
        {children}
      </div>
    </div>
  )
}
