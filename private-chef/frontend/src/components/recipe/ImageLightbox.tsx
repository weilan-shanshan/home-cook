import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Star, X } from 'lucide-react'

export interface LightboxImage {
  id: number
  url: string
}

interface Props {
  open: boolean
  images: LightboxImage[]
  startIndex: number
  onClose: () => void
  /** Optional: shown as a button at top-right; called with the currently-visible image id */
  onSetPrimary?: (imageId: number) => void
  /** Optional: image id currently considered the primary (cover); hides the button when matches */
  primaryImageId?: number | null
}

export function ImageLightbox({
  open,
  images,
  startIndex,
  onClose,
  onSetPrimary,
  primaryImageId,
}: Props) {
  const [index, setIndex] = useState(startIndex)
  const touchStartX = useRef<number | null>(null)

  useEffect(() => {
    if (open) setIndex(startIndex)
  }, [open, startIndex])

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + images.length) % images.length)
  }, [images.length])
  const next = useCallback(() => {
    setIndex((i) => (i + 1) % images.length)
  }, [images.length])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, prev, next])

  if (!open || images.length === 0) return null

  const current = images[index]
  const isPrimary = primaryImageId != null && current?.id === primaryImageId

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(dx) < 40) return
    if (dx > 0) prev()
    else next()
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-center justify-between px-4 pt-12 pb-2 text-white">
        <button
          type="button"
          aria-label="关闭"
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="text-sm">
          {index + 1} / {images.length}
        </div>
        {onSetPrimary && !isPrimary ? (
          <button
            type="button"
            onClick={() => onSetPrimary(current.id)}
            className="rounded-full bg-white/15 text-white text-xs px-3 py-1.5 flex items-center gap-1"
          >
            <Star className="w-3.5 h-3.5" />
            设为首图
          </button>
        ) : isPrimary ? (
          <span className="rounded-full bg-white/15 text-white text-xs px-3 py-1.5 flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-current" />
            当前首图
          </span>
        ) : (
          <div className="w-10" />
        )}
      </div>

      <div
        className="flex-1 flex items-center justify-center relative overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <img
          src={current.url}
          alt=""
          className="max-w-full max-h-full object-contain"
        />

        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="上一张"
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              aria-label="下一张"
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 pb-8">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`第 ${i + 1} 张`}
              className={`rounded-full transition-all ${i === index ? 'w-2.5 h-2.5 bg-white' : 'w-2 h-2 bg-white/40'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
