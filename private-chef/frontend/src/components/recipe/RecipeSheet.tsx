import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { ChevronDown } from 'lucide-react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
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

  const queueUploads = async (recipeId: number) => {
    const pending = images.filter((i) => i.status === 'picked')
    for (let idx = 0; idx < pending.length; idx++) {
      const item = pending[idx]
      const file = fileMap.current.get(item.localId)
      if (!file) continue
      setImages((prev) =>
        prev.map((i) =>
          i.localId === item.localId ? { ...i, status: 'uploading' as const } : i,
        ),
      )
      try {
        const uploaded = await uploadImage(file, {
          onProgress: (progress) => {
            setImages((prev) =>
              prev.map((i) =>
                i.localId === item.localId ? { ...i, progress } : i,
              ),
            )
          },
        })
        await saveImageMutation.mutateAsync({
          recipeId,
          json: { url: uploaded.url, sort_order: idx },
        })
        setImages((prev) =>
          prev.map((i) =>
            i.localId === item.localId ? { ...i, status: 'uploaded' as const, progress: 100 } : i,
          ),
        )
      } catch (err) {
        setImages((prev) =>
          prev.map((i) =>
            i.localId === item.localId
              ? { ...i, status: 'error' as const, errorMessage: String(err) }
              : i,
          ),
        )
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

      void queueUploads(created.id)

      if (mode === 'continue') {
        toast({ description: `✓ 已创建 #${created.id}，继续录入下一道` })
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
    <Sheet open={open} onOpenChange={onOpenChange}>
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
  )
}
