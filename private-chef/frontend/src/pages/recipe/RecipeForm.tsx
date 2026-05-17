import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { useRecipe, useTags, useUpdateRecipe, useSaveRecipeImage } from '@/hooks/useRecipes'
import { useDeleteRecipeImage } from '@/hooks/useDeleteRecipeImage'
import { uploadImage } from '@/lib/upload'
import { RecipeFormCore, type RecipeFormValues } from '@/components/recipe/RecipeFormCore'
import type { ImageItem } from '@/components/recipe/RecipeImageGrid'

export default function RecipeForm() {
  const { id } = useParams<{ id: string }>()
  const recipeId = Number(id)
  const navigate = useNavigate()
  const { toast } = useToast()

  const { data: recipe, isLoading } = useRecipe(recipeId)
  const { data: tags = [] } = useTags()
  const updateMutation = useUpdateRecipe()
  const saveImageMutation = useSaveRecipeImage()
  const deleteImageMutation = useDeleteRecipeImage()

  const [values, setValues] = useState<RecipeFormValues>({
    title: '',
    description: '',
    cookMinutes: '',
    servings: '',
    steps: [''],
    tagIds: [],
  })
  const [images, setImages] = useState<ImageItem[]>([])
  const [submitting, setSubmitting] = useState(false)
  const fileMap = useRef(new Map<string, File>())

  useEffect(() => {
    if (!recipe) return
    setValues({
      title: recipe.title,
      description: recipe.description ?? '',
      cookMinutes: recipe.cook_minutes ?? '',
      servings: recipe.servings ?? '',
      steps: recipe.steps.length > 0 ? recipe.steps : [''],
      tagIds: recipe.tags.map((t) => t.id),
    })
    setImages(
      recipe.images.map((img) => ({
        localId: `server-${img.id}`,
        serverId: img.id,
        url: img.url,
        thumbUrl: img.thumb_url ?? undefined,
        status: 'uploaded' as const,
      })),
    )
  }, [recipe])

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
    if (item?.url && item.status === 'picked') URL.revokeObjectURL(item.url)
    fileMap.current.delete(localId)
    setImages((prev) => prev.filter((i) => i.localId !== localId))
  }

  const handleRemoveUploaded = async (serverId: number) => {
    setImages((prev) =>
      prev.map((i) => (i.serverId === serverId ? { ...i, status: 'deleting' as const } : i)),
    )
    try {
      await deleteImageMutation.mutateAsync({ recipeId, imageId: serverId })
      setImages((prev) => prev.filter((i) => i.serverId !== serverId))
    } catch (err) {
      setImages((prev) =>
        prev.map((i) =>
          i.serverId === serverId ? { ...i, status: 'uploaded' as const } : i,
        ),
      )
      toast({
        description: err instanceof Error ? err.message : '图片删除失败',
        variant: 'destructive',
      })
    }
  }

  const handleRetry = (_localId: string) => {
    /* retry happens on next submit */
  }

  const queueUploads = async () => {
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
              prev.map((i) => (i.localId === item.localId ? { ...i, progress } : i)),
            )
          },
        })
        const saved = await saveImageMutation.mutateAsync({
          recipeId,
          json: { url: uploaded.url, sort_order: images.length + idx },
        })
        setImages((prev) =>
          prev.map((i) =>
            i.localId === item.localId
              ? { ...i, status: 'uploaded' as const, serverId: saved.id, progress: 100 }
              : i,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
    try {
      await updateMutation.mutateAsync({
        id: recipeId,
        json: {
          title: values.title.trim(),
          description: values.description.trim() || undefined,
          cook_minutes: values.cookMinutes === '' ? undefined : values.cookMinutes,
          servings: values.servings === '' ? undefined : values.servings,
          steps: validSteps,
          tags: values.tagIds,
        },
      })
      void queueUploads()
      toast({ title: '菜谱已保存', description: '图片继续在后台上传' })
      navigate(`/recipe/${recipeId}`)
    } catch (err) {
      toast({
        title: '保存失败',
        description: err instanceof Error ? err.message : '请重试',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (isLoading) return <div className="p-8 text-center animate-pulse">正在加载菜谱详情...</div>
  if (!recipe) return <div className="p-8 text-center">菜谱不存在</div>

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 pt-2">
        <Link to={`/recipe/${recipeId}`} className="flex items-center text-sm text-ink-500 hover:text-ink-900">
          <ChevronLeft className="h-4 w-4 mr-1" />
          返回
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-cream-300 shadow-card p-5">
        <h1 className="text-2xl font-extrabold tracking-tight mb-6">编辑菜谱</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
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
          />
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? '保存中…' : '保存'}
          </Button>
        </form>
      </div>
    </div>
  )
}
