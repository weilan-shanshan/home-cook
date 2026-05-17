import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { ChevronDown } from 'lucide-react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/components/ui/use-toast'
import { useCreateRecipe, useSaveRecipeImage, useTags } from '@/hooks/useRecipes'
import { uploadImage } from '@/lib/upload'
import { RecipeFormCore, type RecipeFormValues } from './RecipeFormCore'
import type { ImageItem } from './RecipeImageGrid'

type SubmitMode = 'continue' | 'close' | 'view'

const SUBMIT_MODE_KEY = 'cook.recipe.lastSubmitMode'

const MODE_LABEL: Record<SubmitMode, string> = {
  continue: '创建并继续',
  close: '创建并关闭',
  view: '创建并查看详情',
}

const EMPTY_VALUES: RecipeFormValues = {
  title: '',
  description: '',
  cookMinutes: '',
  servings: '',
  steps: [''],
  tagIds: [],
}

function readMode(): SubmitMode {
  try {
    const v = localStorage.getItem(SUBMIT_MODE_KEY)
    if (v === 'close' || v === 'view') return v
  } catch {
    /* ignore */
  }
  return 'continue'
}

function writeMode(mode: SubmitMode) {
  try {
    localStorage.setItem(SUBMIT_MODE_KEY, mode)
  } catch {
    /* ignore */
  }
}

interface RecipeSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RecipeSheet({ open, onOpenChange }: RecipeSheetProps) {
  const { toast } = useToast()
  const navigate = useNavigate()
  const { data: tags = [] } = useTags()
  const createMutation = useCreateRecipe()
  const saveImageMutation = useSaveRecipeImage()

  const [values, setValues] = useState<RecipeFormValues>(EMPTY_VALUES)
  const [images, setImages] = useState<ImageItem[]>([])
  const [submitMode, setSubmitMode] = useState<SubmitMode>(readMode)
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
      // status updates only fire toast on error to avoid orphaned state writes
      try {
        const uploaded = await uploadImage(file, {
          onProgress: () => {
            /* progress updates dropped on continue-mode reset — user is on next recipe */
          },
        })
        await saveImageMutation.mutateAsync({
          recipeId,
          json: { url: uploaded.url, sort_order: idx },
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
      servings: prev.servings,
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
    // Clean up local image URLs to avoid memory leak
    images.forEach((i) => {
      if (i.status === 'picked' && i.url.startsWith('blob:')) URL.revokeObjectURL(i.url)
    })
    // Reset values fully (don't keep tags this time — user is discarding)
    setValues(EMPTY_VALUES)
    setImages([])
    fileMap.current.clear()
    onOpenChange(false)
  }

  const handleSubmit = async (mode: SubmitMode) => {
    if (!values.title.trim()) {
      toast({ title: '校验错误', description: '需要填写菜名', variant: 'destructive' })
      return
    }
    const validSteps = values.steps.filter((s) => s.trim().length > 0)
    if (validSteps.length === 0) {
      toast({ title: '校验错误', description: '至少需要一个步骤', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    setSubmitMode(mode)
    writeMode(mode)
    try {
      const created = await createMutation.mutateAsync({
        title: values.title.trim(),
        description: values.description.trim() || undefined,
        cook_minutes: values.cookMinutes === '' ? undefined : values.cookMinutes,
        servings: values.servings === '' ? undefined : values.servings,
        steps: validSteps,
        tags: values.tagIds,
      })

      // Capture snapshots BEFORE reset so background uploads don't lose track
      const pendingSnapshot = images.filter((i) => i.status === 'picked')
      const fileMapSnapshot = new Map(fileMap.current)
      void queueUploads(created.id, pendingSnapshot, fileMapSnapshot)

      const hasPendingImages = pendingSnapshot.length > 0
      const continueMsg = hasPendingImages
        ? `✓ 已创建 #${created.id}，继续录入下一道 · 图片在后台上传`
        : `✓ 已创建 #${created.id}，继续录入下一道`

      if (mode === 'continue') {
        toast({ description: continueMsg })
        resetForKeepGoing()
      } else if (mode === 'close') {
        toast({ description: `✓ 已创建 #${created.id}` })
        onOpenChange(false)
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

  const primaryLabel = MODE_LABEL[submitMode]

  return (
    <>
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[92vh] p-0 flex flex-col"
        aria-describedby={undefined}
      >
        <div className="px-5 py-3 border-b border-cream-300">
          <p className="text-xs text-ink-500">连续录入模式</p>
          <h2 className="text-lg font-extrabold">新增菜品</h2>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
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
        </div>

        <div className="px-5 pt-3 pb-7 border-t border-cream-300 bg-cream-50">
          <div className="flex gap-2">
            <Button
              onClick={() => handleSubmit(submitMode)}
              disabled={submitting}
              className="flex-1"
            >
              {submitting ? '保存中…' : `${primaryLabel} →`}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" disabled={submitting} aria-label="选择提交模式">
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setSubmitMode('continue')}>
                  创建并继续
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setSubmitMode('close')}>
                  创建并关闭
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setSubmitMode('view')}>
                  创建并查看详情
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="text-[10px] text-ink-500 text-center mt-2">
            默认「创建并继续」会清空字段，标签保留
          </p>
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
