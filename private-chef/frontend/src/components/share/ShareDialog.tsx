import { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import { Copy, Download, Loader2, MessageCircleMore, Share2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { useCreateShare, useShareCard, type ShareCardPayload, type ShareChannel, type ShareType } from '@/hooks/useSharing'

type ShareDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  shareCardEndpoint: string
  shareActionEndpoint: string
  invalidateKeys?: Array<readonly unknown[]>
}

function accentStyles(accent: ShareCardPayload['visual']['accent']) {
  switch (accent) {
    case 'amber':
      return 'from-amber-50 to-orange-100 border-amber-200'
    case 'tomato':
      return 'from-rose-50 to-orange-100 border-rose-200'
    case 'champagne':
      return 'from-stone-50 to-violet-100 border-stone-200'
    case 'sage':
      return 'from-emerald-50 to-lime-100 border-emerald-200'
    default:
      return 'from-muted/30 to-background border-border'
  }
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Failed to load image'))
    image.src = src
  })
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines: number) {
  const chars = [...text]
  const lines: string[] = []
  let currentLine = ''

  for (const char of chars) {
    const next = `${currentLine}${char}`
    if (ctx.measureText(next).width > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = char
      if (lines.length === maxLines - 1) {
        break
      }
    } else {
      currentLine = next
    }
  }

  const remaining = chars.slice(lines.join('').length).join('')
  const finalLine = lines.length === maxLines - 1 && remaining
    ? `${currentLine}${remaining}`
    : currentLine
  lines.push(finalLine)

  lines.slice(0, maxLines).forEach((line, index) => {
    const content = index === maxLines - 1 && line.length < finalLine.length ? `${line.slice(0, Math.max(0, line.length - 1))}…` : line
    ctx.fillText(content, x, y + index * lineHeight)
  })
}

async function exportPoster(payload: ShareCardPayload, shareUrl: string) {
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1720
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Poster canvas unavailable')
  }

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
  switch (payload.visual.accent) {
    case 'amber':
      gradient.addColorStop(0, '#fff9f1')
      gradient.addColorStop(1, '#fde7c7')
      break
    case 'tomato':
      gradient.addColorStop(0, '#fff5f3')
      gradient.addColorStop(1, '#ffe3d6')
      break
    case 'champagne':
      gradient.addColorStop(0, '#fbf8f2')
      gradient.addColorStop(1, '#ece6ff')
      break
    case 'sage':
      gradient.addColorStop(0, '#f6fbf6')
      gradient.addColorStop(1, '#e2f0dc')
      break
  }
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.fillStyle = 'rgba(255,255,255,0.92)'
  ctx.strokeStyle = 'rgba(15,23,42,0.06)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(60, 60, 960, 1600, 40)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#111827'
  ctx.font = '600 30px sans-serif'
  ctx.fillText(payload.public_context.family_name || 'Private Chef', 110, 130)
  ctx.font = '400 24px sans-serif'
  ctx.fillStyle = '#6b7280'
  ctx.fillText('Private Chef 分享海报', 110, 170)

  if (payload.cover_image_url) {
    try {
      const hero = await loadImage(payload.cover_image_url)
      ctx.save()
      ctx.beginPath()
      ctx.roundRect(110, 220, 860, 520, 32)
      ctx.clip()
      ctx.drawImage(hero, 110, 220, 860, 520)
      ctx.restore()
    } catch {
      ctx.fillStyle = '#f3f4f6'
      ctx.beginPath()
      ctx.roundRect(110, 220, 860, 520, 32)
      ctx.fill()
    }
  } else {
    ctx.fillStyle = '#f8fafc'
    ctx.beginPath()
    ctx.roundRect(110, 220, 860, 320, 32)
    ctx.fill()
  }

  let contentY = payload.cover_image_url ? 810 : 600
  ctx.fillStyle = '#111827'
  ctx.font = '700 56px sans-serif'
  wrapText(ctx, payload.poster.title, 110, contentY, 860, 70, 2)
  contentY += 130
  ctx.fillStyle = '#4b5563'
  ctx.font = '400 34px sans-serif'
  wrapText(ctx, payload.poster.summary || payload.summary, 110, contentY, 860, 46, 2)
  contentY += 120

  const chips = payload.visual.chips.slice(0, 4)
  let chipX = 110
  for (const chip of chips) {
    const width = Math.max(140, ctx.measureText(chip).width + 48)
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.beginPath()
    ctx.roundRect(chipX, contentY, width, 56, 28)
    ctx.fill()
    ctx.fillStyle = '#374151'
    ctx.font = '500 24px sans-serif'
    ctx.fillText(chip, chipX + 24, contentY + 35)
    chipX += width + 18
  }

  contentY += 120
  ctx.fillStyle = '#6b7280'
  ctx.font = '400 28px sans-serif'
  payload.facts.slice(0, 4).forEach((fact, index) => {
    ctx.fillText(`• ${fact}`, 110, contentY + index * 42)
  })

  const qrDataUrl = await QRCode.toDataURL(shareUrl, { margin: 1, width: 220, color: { dark: '#111827', light: '#ffffff' } })
  const qrImage = await loadImage(qrDataUrl)
  ctx.fillStyle = '#f9fafb'
  ctx.beginPath()
  ctx.roundRect(110, 1320, 860, 250, 32)
  ctx.fill()
  ctx.drawImage(qrImage, 150, 1355, 180, 180)
  ctx.fillStyle = '#111827'
  ctx.font = '600 40px sans-serif'
  ctx.fillText('保存图片，扫码继续查看', 380, 1425)
  ctx.fillStyle = '#6b7280'
  ctx.font = '400 28px sans-serif'
  ctx.fillText(payload.poster.helper_text, 380, 1475)
  ctx.fillText(payload.public_context.date_label || '分享页持续可访问', 380, 1520)

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) {
    throw new Error('Failed to export poster image')
  }

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${payload.target_type}-share-poster.png`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function ShareDialog({
  open,
  onOpenChange,
  title,
  shareCardEndpoint,
  shareActionEndpoint,
  invalidateKeys = [],
}: ShareDialogProps) {
  const { toast } = useToast()
  const [workingAction, setWorkingAction] = useState<ShareChannel | null>(null)
  const shareCardQuery = useShareCard(shareCardEndpoint, open)
  const createShare = useCreateShare(shareActionEndpoint, invalidateKeys)

  useEffect(() => {
    if (!open) {
      setWorkingAction(null)
    }
  }, [open])

  const payload = shareCardQuery.data
  const visualPreviewClass = useMemo(
    () => accentStyles(payload?.visual.accent ?? 'amber'),
    [payload?.visual.accent],
  )

  const runShare = async (channel: ShareChannel, shareType: ShareType) => {
    setWorkingAction(channel)
    try {
      const response = await createShare.mutateAsync({ channel, shareType })
      const shareUrl = response.share_url

      if (channel === 'copy_link') {
        await copyText(shareUrl)
        toast({ title: '链接已复制', description: '可以直接发给家人或朋友。' })
      }

      if (channel === 'wechat') {
        await copyText(shareUrl)
        toast({
          title: '分享链接已准备好',
          description: '已复制链接，可直接粘贴到微信；海报和落地页会保持一致。',
        })
      }

      if (channel === 'poster_download') {
        const latestPayload = payload ?? (await shareCardQuery.refetch()).data
        if (!latestPayload) {
          throw new Error('Share preview unavailable')
        }
        await exportPoster(latestPayload, response.poster.qr_target_url || shareUrl)
        toast({ title: '海报已下载', description: '二维码会打开对应的分享页。' })
      }
    } catch (error) {
      toast({
        title: '分享失败',
        description: error instanceof Error ? error.message : '请稍后重试。',
        variant: 'destructive',
      })
    } finally {
      setWorkingAction(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl rounded-3xl p-0 overflow-hidden">
        <div className={`bg-gradient-to-br ${visualPreviewClass} p-6`}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Share2 className="h-5 w-5" />
              {title || '分享这份内容'}
            </DialogTitle>
            <DialogDescription>
              复制链接、发到微信，或生成带二维码的海报。
            </DialogDescription>
          </DialogHeader>

          <Card className="mt-5 rounded-3xl border-white/70 bg-white/90 shadow-lg">
            <CardContent className="p-5">
              {shareCardQuery.isLoading ? (
                <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 加载分享内容...
                </div>
              ) : shareCardQuery.error || !payload ? (
                <div className="py-10 text-sm text-destructive">无法加载分享预览。</div>
              ) : (
                <div className="space-y-4">
                  {payload.cover_image_url ? (
                    <div className="overflow-hidden rounded-2xl bg-muted">
                      <img src={payload.cover_image_url} alt={payload.title} className="h-52 w-full object-cover" />
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {payload.visual.chips.map((chip) => (
                        <span key={chip} className="rounded-full bg-black/5 px-3 py-1 text-xs text-muted-foreground">
                          {chip}
                        </span>
                      ))}
                    </div>
                    <h3 className="text-2xl font-semibold tracking-tight text-foreground">{payload.title}</h3>
                    <p className="text-sm leading-6 text-muted-foreground">{payload.summary}</p>
                  </div>

                  <div className="grid gap-2 text-sm text-muted-foreground">
                    {payload.public_context.family_name ? <div>家庭：{payload.public_context.family_name}</div> : null}
                    {payload.public_context.requester_display_name ? <div>点单人：{payload.public_context.requester_display_name}</div> : null}
                    {payload.public_context.cook_display_name ? <div>掌勺：{payload.public_context.cook_display_name}</div> : null}
                    {payload.public_context.featured_display_name ? <div>主角：{payload.public_context.featured_display_name}</div> : null}
                  </div>

                  {payload.facts.length > 0 ? (
                    <div className="rounded-2xl bg-muted/50 p-4 text-sm text-muted-foreground">
                      {payload.facts.slice(0, 4).map((fact) => (
                        <div key={fact} className="py-1">{fact}</div>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-3 p-6 sm:grid-cols-3">
          <Button
            variant="outline"
            className="h-12 rounded-2xl"
            onClick={() => void runShare('copy_link', 'link')}
            disabled={shareCardQuery.isLoading || workingAction !== null}
          >
            {workingAction === 'copy_link' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Copy className="mr-2 h-4 w-4" />}
            复制链接
          </Button>
          <Button
            variant="outline"
            className="h-12 rounded-2xl"
            onClick={() => void runShare('wechat', 'card')}
            disabled={shareCardQuery.isLoading || workingAction !== null}
          >
            {workingAction === 'wechat' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageCircleMore className="mr-2 h-4 w-4" />}
            微信分享
          </Button>
          <Button
            className="h-12 rounded-2xl"
            onClick={() => void runShare('poster_download', 'poster')}
            disabled={shareCardQuery.isLoading || workingAction !== null}
          >
            {workingAction === 'poster_download' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            下载海报
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
