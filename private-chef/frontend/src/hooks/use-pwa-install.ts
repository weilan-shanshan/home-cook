import { useEffect, useState } from 'react'
import { pwaInstall } from '@/lib/pwa-install'

export function usePwaInstall() {
  const [promptReady, setPromptReady] = useState(pwaInstall.hasNativePrompt())
  const [installed, setInstalled] = useState(pwaInstall.isStandalone)

  useEffect(() => {
    pwaInstall.onReady(() => setPromptReady(true))
    const unsubscribe = pwaInstall.onInstalled(() => setInstalled(true))
    return unsubscribe
  }, [])

  return {
    promptReady,
    installed,
    isIOS: pwaInstall.isIOS,
    isInAppBrowser: pwaInstall.isInAppBrowser,
    browserKind: pwaInstall.browserKind,
    tryInstall: pwaInstall.tryInstall,
  }
}
