import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { X } from 'lucide-react'
import { Sheet, SheetClose, SheetContent } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { useCreateRecipe, useSaveRecipeImage, useTags } from '@/hooks/useRecipes'
import { useQuota } from '@/hooks/useQuota'
import { uploadImage } from '@/lib/upload'
import { RecipeFormCore, type RecipeFormValues } from './RecipeFormCore'
import type { ImageItem } from './RecipeImageGrid'

const EMPTY_VALUES: RecipeFormValues = {
  title: '',
  description: '',
  cookMinutes: '',
  servings: '',
  steps: [''],
  tagIds: [],
}

interface RecipeSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode?: 'single' | 'continuous'
  onSubmitted?: (created: { id: number }) => void
}

export function RecipeSheet({ open, onOpenChange, mode = 'single', onSubmitted }: RecipeSheetProps) {
  const { toast } = useToast()
  const navigate = useNavigate()
  const { data: tags = [] } = useTags()
  const { data: quota } = useQuota()
  const createMutation = useCreateRecipe()
  const saveImageMutation = useSaveRecipeImage()

  const [values, setValues] = useState<RecipeFormValues>(EMPTY_VALUES)
  const [images, setImages] = useState<ImageItem[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [discardOpen, setDiscardOpen] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)
  const fileMap = useRef(new Map<string, File>())

  useEffect(() => {
    if (open) {
      setTimeout(() => titleRef.current?.focus(), 250)
    }
  }, [open])

  const patch = (p: Partial<RecipeFormValues>) =>
    setValues((prev) => ({ ...prev, ...p }))

  const handlePick = (file: File) => {
    const localId = crypto.randomUUID()
    const url = URL.createObjectURL(file)
    setImages((prev) => [...prev, { localId, url, status: 'picked' }])
    fileMap.current.set(localId, file)
  }

  const handleRemoveLocal = (localId: string) => {
    const item = images.find((i) => i.localId === localId)
    if (item?.url) URL.revokeObjectURL(item.url)
    fileMap.current.delete(localId)
    setImages((prev) => prev.filter((i) => i.localId !== localId))
  }

  const handleRemoveUploaded = () => {
    toast({ description: '已上传图片只能在菜品详情页删除' })
  }

  const handleRetry = () => {
    /* retry on next submit cycle */
  }

  const queueUploads = async (
    recipeId: number,
    pendingSnapshot: ImageItem[],
    fileMapSnapshot: Map<string, File>,
  ) => {
    for (let idx = 0; idx < pendingSnapshot.length; idx++) {
      const item = pendingSnapshot[idx]
      const file = fileMapSnapshot.get(item.localId)
      if (!file) continue
      try {
        const uploaded = await uploadImage(file, {
          onProgress: () => {
            /* progress updates dropped on continue-mode reset */
          },
        })
        await saveImageMutation.mutateAsync({
          recipeId,
          json: { url: uploaded.url, thumb_url: uploaded.thumbUrl, sort_order: idx },
        })
      } catch (err) {
        toast({
          title: `图片 ${idx + 1} 上传失败`,
          description: err instanceof Error ? err.message : '请重试',
          variant: 'destructive',
        })
      }
    }
  }

  const resetForKeepGoing = () => {
    images.forEach((i) => URL.revokeObjectURL(i.url))
    fileMap.current.clear()
    setImages([])
    setValues((prev) => ({
      ...EMPTY_VALUES,
      tagIds: prev.tagIds,
    }))
    setTimeout(() => titleRef.current?.focus(), 50)
  }

  const isDirty =
    values.title.trim().length > 0 ||
    values.description.trim().length > 0 ||
    values.steps.some((s) => s.trim().length > 0) ||
    images.length > 0

  const handleOpenChange = (next: boolean) => {
    if (!next && isDirty) {
      setDiscardOpen(true)
      return
    }
    onOpenChange(next)
  }

  const confirmDiscard = () => {
    setDiscardOpen(false)
    images.forEach((i) => {
      if (i.status === 'picked' && i.url.startsWith('blob:')) URL.revokeObjectURL(i.url)
    })
    setValues(EMPTY_VALUES)
    setImages([])
    fileMap.current.clear()
    onOpenChange(false)
  }

  const handleSubmit = async () => {
    if (!values.title.trim()) {
      toast({ title: '校验错误', description: '需要填写菜名', variant: 'destructive' })
      return
    }
    const validSteps = values.steps.filter((s) => s.trim().length > 0)

    setSubmitting(true)
    try {
      const created = await createMutation.mutateAsync({
        title: values.title.trim(),
        description: values.description.trim() || undefined,
        cook_minutes: values.cookMinutes === '' ? undefined : values.cookMinutes,
        servings: values.servings === '' ? undefined : values.servings,
        steps: validSteps.length > 0 ? validSteps : [],
        tags: values.tagIds,
      })

      const pendingSnapshot = images.filter((i) => i.status === 'picked')
      const fileMapSnapshot = new Map(fileMap.current)
      void queueUploads(created.id, pendingSnapshot, fileMapSnapshot)

      onSubmitted?.(created)

      if (mode === 'continuous') {
        const hasPendingImages = pendingSnapshot.length > 0
        const continueMsg = hasPendingImages
          ? `✓ 已创建 #${created.id}，继续录入下一道 · 图片在后台上传`
          : `✓ 已创建 #${created.id}，继续录入下一道`
        toast({ description: continueMsg })
        resetForKeepGoing()
      } else {
        toast({ description: `✓ 已创建 #${created.id}` })
        onOpenChange(false)
        navigate(`/recipe/${created.id}`)
      }
    } catch (err) {
      toast({
        title: '保存菜谱时出错',
        description: err instanceof Error ? err.message : '请重试',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent
          side="bottom"
          className="h-auto p-0 flex flex-col"
          aria-describedby={undefined}
          hideClose
        >
          {/* Grab handle */}
          <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-cream-300" />

          {/* Header */}
          <div className="flex items-start justify-between px-5 pt-3 pb-2">
            <div className="space-y-1">
              {mode === 'continuous' && (
                <div>
                  <span className="rounded-full bg-butter-300/60 text-butter-700 text-[11px] px-2 py-0.5">
                    连续录入模式
                  </span>
                </div>
              )}
              <h2 className="font-serif text-2xl text-ink-900">新增菜品</h2>
              {quota && quota.plan === 'free' && quota.recipes.limit !== null && (
                <p
                  className={`text-xs ${
                    quota.recipes.used >= quota.recipes.limit
                      ? 'text-amber-600 font-medium'
                      : 'text-ink-500'
                  }`}
                >
                  菜品 {quota.recipes.used}/{quota.recipes.limit}
                  {quota.images.limit !== null && (
                    <span className="ml-2">
                      · 图片 {quota.images.used}/{quota.images.limit}
                    </span>
                  )}
                </p>
              )}
            </div>
            <SheetClose asChild>
              <button
                type="button"
                className="w-8 h-8 rounded-full bg-cream-100 flex items-center justify-center"
                aria-label="关闭"
              >
                <X className="w-4 h-4 text-ink-700" />
              </button>
            </SheetClose>
          </div>

          {/* Body */}
          <div className="px-5 pb-8 max-h-[80vh] overflow-y-auto">
            <RecipeFormCore
              values={values}
              onChange={patch}
              images={images}
              imageActions={{
                onPick: handlePick,
                onRemoveLocal: handleRemoveLocal,
                onRemoveUploaded: handleRemoveUploaded,
                onRetry: handleRetry,
              }}
              availableTags={tags}
              titleInputRef={titleRef}
            />

            {/* Footer submit button */}
            <div className="mt-6">
              <Button
                type="button"
                variant="default"
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full rounded-full"
              >
                {submitting ? '保存中…' : mode === 'continuous' ? '创建并继续 →' : '创建菜品 →'}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>放弃当前编辑？</DialogTitle>
            <DialogDescription>
              当前填写的内容会被丢弃，无法恢复。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setDiscardOpen(false)} className="w-full sm:w-auto">
              继续编辑
            </Button>
            <Button variant="destructive" onClick={confirmDiscard} className="w-full sm:w-auto">
              放弃
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
