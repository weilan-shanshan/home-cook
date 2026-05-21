import { useState, useCallback } from 'react'
import { X, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePwaInstall } from '@/hooks/use-pwa-install'
import { IOSInstallGuide } from './IOSInstallGuide'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const DISMISSED_KEY = 'cook.pwa.banner.dismissed'

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSetItem(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* private mode: silently degrade */
  }
}

export function PWAInstallBanner() {
  const { installed, isIOS, isInAppBrowser, tryInstall } = usePwaInstall()
  const [dismissed, setDismissed] = useState(() => !!safeGetItem(DISMISSED_KEY))
  const [iosGuideOpen, setIosGuideOpen] = useState(false)

  const handleDismiss = useCallback(() => {
    safeSetItem(DISMISSED_KEY, '1')
    setDismissed(true)
  }, [])

  const handleInstall = useCallback(async () => {
    if (isIOS) {
      setIosGuideOpen(true)
      return
    }
    const result = await tryInstall()
    if (result === 'ACCEPTED') {
      handleDismiss()
    }
  }, [isIOS, tryInstall, handleDismiss])

  if (installed) return null
  if (isInAppBrowser) return null
  if (dismissed) return null

  return (
    <>
      <div className="surface-card p-3 flex items-center gap-3 mx-0 rounded-none sm:rounded-2xl">
        <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center shrink-0">
          <Download className="w-4 h-4" />
        </div>
        <p className="flex-1 text-sm text-ink-700 font-medium leading-tight">
          装到桌面，秒开私厨
        </p>
        <Button
          size="sm"
          variant="default"
          className="shrink-0 h-8 px-3 text-xs"
          onClick={handleInstall}
        >
          立即安装
        </Button>
        <button
          type="button"
          aria-label="关闭"
          onClick={handleDismiss}
          className="shrink-0 w-6 h-6 flex items-center justify-center text-ink-400 hover:text-ink-600 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <Dialog open={iosGuideOpen} onOpenChange={setIosGuideOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>iPhone 用户看这里</DialogTitle>
          </DialogHeader>
          <IOSInstallGuide />
        </DialogContent>
      </Dialog>
    </>
  )
}
