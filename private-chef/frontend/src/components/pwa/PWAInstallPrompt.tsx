import { useCallback, useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { usePwaInstall } from '@/hooks/use-pwa-install'
import { IOSInstallGuide } from './IOSInstallGuide'

const PERMANENT_KEY = 'cook.pwa.dismissed.permanent'
const SESSION_KEY = 'cook.pwa.dismissed.session'

function safeGetItem(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key)
  } catch {
    return null
  }
}

function safeSetItem(storage: Storage, key: string, value: string) {
  try {
    storage.setItem(key, value)
  } catch {
    /* private mode: silently degrade */
  }
}

export function PWAInstallPrompt() {
  const { installed, isIOS, isInAppBrowser, browserKind, tryInstall } = usePwaInstall()
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (installed) return
    if (isInAppBrowser) return
    if (safeGetItem(localStorage, PERMANENT_KEY)) return
    if (safeGetItem(sessionStorage, SESSION_KEY)) return
    setOpen(true)
  }, [installed, isInAppBrowser])

  useEffect(() => {
    if (installed) {
      safeSetItem(localStorage, PERMANENT_KEY, '1')
      setOpen(false)
      toast({ description: '装好啦，下次直接从桌面打开 🎉' })
    }
  }, [installed, toast])

  const handleInstall = useCallback(async () => {
    const result = await tryInstall()
    if (result === 'ACCEPTED') {
      safeSetItem(localStorage, PERMANENT_KEY, '1')
      setOpen(false)
    } else if (result === 'DISMISSED') {
      safeSetItem(sessionStorage, SESSION_KEY, '1')
      setOpen(false)
    } else if (result === 'IOS_SHOW_GUIDE') {
      // Already showing IOSInstallGuide inline; nothing extra to do.
    } else if (result === 'NO_PROMPT') {
      toast({ description: '当前浏览器不支持自动安装，推荐用 Chrome/Edge 打开' })
    }
  }, [tryInstall, toast])

  const handleLater = useCallback(() => {
    safeSetItem(sessionStorage, SESSION_KEY, '1')
    setOpen(false)
  }, [])

  const handlePermanentDismiss = useCallback(() => {
    safeSetItem(localStorage, PERMANENT_KEY, '1')
    setOpen(false)
  }, [])

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin)
      toast({ description: '已复制链接' })
    } catch {
      toast({ description: '复制失败，请手动复制地址栏', variant: 'destructive' })
    }
  }, [toast])

  if (installed) return null
  if (isInAppBrowser) return null
  if (safeGetItem(localStorage, PERMANENT_KEY)) return null
  if (safeGetItem(sessionStorage, SESSION_KEY)) return null
  if (!open) return null

  const isChromium = browserKind === 'desktopChromium' || browserKind === 'androidChromium'

  return (
    <Dialog open={open} onOpenChange={next => !next && handleLater()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isIOS ? 'iPhone 用户看这里' : '装到桌面，秒开私厨'}
          </DialogTitle>
          <DialogDescription>
            {isIOS
              ? '把私厨加到主屏幕，下次像 App 一样直接点开。'
              : '安装后可离线打开、启动更快，不占空间。'}
          </DialogDescription>
        </DialogHeader>

        {isIOS ? (
          <IOSInstallGuide />
        ) : isChromium ? null : (
          <p className="text-sm text-muted-foreground">
            推荐用 Chrome 或 Edge 浏览器打开本网站，即可直接安装到桌面。
          </p>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          {isChromium && (
            <Button onClick={handleInstall} className="w-full sm:w-auto">
              立即安装
            </Button>
          )}
          {!isChromium && !isIOS && (
            <Button onClick={copyLink} variant="outline" className="w-full sm:w-auto">
              复制链接
            </Button>
          )}
          <Button onClick={handleLater} variant="ghost" className="w-full sm:w-auto">
            稍后再说
          </Button>
          <Button
            onClick={handlePermanentDismiss}
            variant="ghost"
            className="w-full sm:w-auto text-muted-foreground"
          >
            不再提示
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
