import { useCallback, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Download, Smartphone } from 'lucide-react'
import { usePwaInstall } from '@/hooks/use-pwa-install'
import { IOSInstallGuide } from './IOSInstallGuide'

export function InstallEntryCard() {
  const { installed, promptReady, isIOS, isInAppBrowser, browserKind, tryInstall } = usePwaInstall()
  const [iosGuideOpen, setIosGuideOpen] = useState(false)
  const { toast } = useToast()

  const [dismissedThisSession, setDismissedThisSession] = useState(false)

  const handleClick = useCallback(async () => {
    if (isIOS) {
      setIosGuideOpen(true)
      return
    }
    const result = await tryInstall()
    if (result === 'ACCEPTED') {
      toast({ description: '已开始安装' })
    } else if (result === 'DISMISSED') {
      setDismissedThisSession(true)
      toast({ description: '已取消，下次可以再试' })
    } else if (result === 'NO_PROMPT') {
      toast({ description: '当前浏览器不支持自动安装，推荐用 Chrome/Edge 打开' })
    }
  }, [isIOS, tryInstall, toast])

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin)
      toast({ description: '已复制链接' })
    } catch {
      toast({ description: '复制失败，请手动复制', variant: 'destructive' })
    }
  }, [toast])

  if (installed) return null

  const isChromium = browserKind === 'desktopChromium' || browserKind === 'androidChromium'

  let description = '装到桌面后能离线打开、启动更快'
  let buttonLabel = '立即安装'
  let buttonDisabled = false
  let onButtonClick: () => void = handleClick

  if (isInAppBrowser) {
    description = '当前浏览器装不了 PWA，请点右上角 ··· → 在浏览器打开'
    buttonLabel = '请在浏览器打开'
    buttonDisabled = true
    onButtonClick = () => undefined
  } else if (isIOS) {
    buttonLabel = '教我装'
  } else if (isChromium) {
    if (!promptReady) {
      description = '请先在应用里点几下，然后再回到这里安装'
      buttonLabel = '稍等再试'
      buttonDisabled = true
    }
  } else {
    description = '推荐用 Chrome 或 Edge 打开以装到桌面'
    buttonLabel = '复制链接'
    onButtonClick = copyLink
  }

  if (dismissedThisSession && isChromium) {
    description = '本次会话已取消，下次再试可以重新安装'
    buttonLabel = '已取消'
    buttonDisabled = true
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            {isIOS ? (
              <Smartphone className="h-5 w-5 text-primary" />
            ) : (
              <Download className="h-5 w-5 text-primary" />
            )}
            <CardTitle className="text-base">装到桌面，秒开私厨</CardTitle>
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={onButtonClick}
            disabled={buttonDisabled}
            className="w-full sm:w-auto"
          >
            {buttonLabel}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={iosGuideOpen} onOpenChange={setIosGuideOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>iPhone 安装指南</DialogTitle>
            <DialogDescription>三步把私厨加到主屏幕</DialogDescription>
          </DialogHeader>
          <IOSInstallGuide />
        </DialogContent>
      </Dialog>
    </>
  )
}
