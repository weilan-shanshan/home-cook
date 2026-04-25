import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router'
import {
  useRecipe,
  useCreateRecipe,
  useUpdateRecipe,
  useTags,
  useSaveRecipeImage,
} from '@/hooks/useRecipes'
import { uploadImage } from '@/lib/upload'
import { RecipeCreateSuccessBanner } from '@/components/recipe/RecipeCreateSuccessBanner'
import { RecipeUploadQueue } from '@/components/recipe/RecipeUploadQueue'
import { StepEditor } from '@/components/recipe/StepEditor'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { ChevronLeft, Loader2, UploadCloud, X } from 'lucide-react'

interface FormState {
  title: string
  description: string
  cook_minutes: number | ''
  servings: number | ''
  steps: string[]
  tags: number[]
}

interface ImageState {
  localId: string
  id?: number
  file?: File
  previewUrl: string
  uploadUrl?: string
  progress: number
  status: 'idle' | 'uploading' | 'success' | 'error'
  errorMessage?: string
}

function createLocalId() {
  return crypto.randomUUID()
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return '上传失败，请稍后重试'
}

export default function RecipeForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const recipeId = Number(id)
  const navigate = useNavigate()
  const { toast } = useToast()

  const { data: recipe, isLoading: isLoadingRecipe } = useRecipe(recipeId)
  const { data: availableTags = [] } = useTags()
  const createMutation = useCreateRecipe()
  const updateMutation = useUpdateRecipe()
  const saveImageMutation = useSaveRecipeImage()

  const [form, setForm] = useState<FormState>({
    title: '',
    description: '',
    cook_minutes: '',
    servings: '',
    steps: [''],
    tags: [],
  })
  const [images, setImages] = useState<ImageState[]>([])
  const [createdRecipeId, setCreatedRecipeId] = useState<number | null>(null)
  const [showCreateSuccessBanner, setShowCreateSuccessBanner] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const imagesRef = useRef(images)
  useEffect(() => {
    imagesRef.current = images
  }, [images])

  useEffect(() => {
    if (isEdit && recipe) {
      setForm({
        title: recipe.title,
        description: recipe.description || '',
        cook_minutes: recipe.cook_minutes || '',
        servings: recipe.servings || '',
        steps: recipe.steps?.length ? recipe.steps : [''],
        tags: recipe.tags.map((t) => t.id),
      })
      if (recipe.images) {
        setImages(
          recipe.images.map((img) => ({
            localId: createLocalId(),
            id: img.id,
            previewUrl: img.url,
            uploadUrl: img.url,
            progress: 100,
            status: 'success',
          }))
        )
      }
    }
  }, [isEdit, recipe])

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((img) => {
        if (img.file && img.previewUrl) {
          URL.revokeObjectURL(img.previewUrl)
        }
      })
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value,
    }))
  }

  const toggleTag = (tagId: number) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tagId)
        ? prev.tags.filter((id) => id !== tagId)
        : [...prev.tags, tagId],
    }))
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    const files = Array.from(e.target.files)
    
    const newImages = files.map((file) => ({
      localId: createLocalId(),
      file,
      previewUrl: URL.createObjectURL(file),
      progress: 0,
      status: 'idle' as const,
    }))
    
    setImages((prev) => [...prev, ...newImages])
    e.target.value = '' // reset input
  }

  const activeRecipeId = isEdit ? recipeId : createdRecipeId

  const updateImage = (localId: string, updater: (image: ImageState) => ImageState) => {
    setImages((prev) => prev.map((image) => (image.localId === localId ? updater(image) : image)))
  }

  const uploadSingleImage = async (localId: string, targetRecipeId: number) => {
    const currentImages = imagesRef.current
    const imageIndex = currentImages.findIndex((image) => image.localId === localId)
    if (imageIndex === -1) {
      return
    }

    const image = currentImages[imageIndex]
    if (!image.file || image.uploadUrl || image.status === 'uploading') {
      return
    }

    updateImage(localId, (current) => ({
      ...current,
      status: 'uploading',
      progress: 0,
      errorMessage: undefined,
    }))

    try {
      const result = await uploadImage(image.file, {
        onProgress: (progress) => {
          updateImage(localId, (current) => ({
            ...current,
            status: 'uploading',
            progress,
          }))
        },
      })

      await saveImageMutation.mutateAsync({
        recipeId: targetRecipeId,
        json: {
          url: result.url,
          sort_order: imageIndex,
        },
      })

      updateImage(localId, (current) => ({
        ...current,
        uploadUrl: result.url,
        progress: 100,
        status: 'success',
        errorMessage: undefined,
      }))
    } catch (error) {
      updateImage(localId, (current) => ({
        ...current,
        status: 'error',
        errorMessage: getErrorMessage(error),
      }))
    }
  }

  const queuePendingUploads = (targetRecipeId: number) => {
    const pendingImages = imagesRef.current.filter(
      (image) => image.file && !image.uploadUrl && image.status !== 'uploading',
    )

    void Promise.allSettled(
      pendingImages.map((image) => uploadSingleImage(image.localId, targetRecipeId)),
    )
  }

  const removeImage = (index: number) => {
    setImages((prev) => {
      const newImages = [...prev]
      const removed = newImages.splice(index, 1)[0]
      if (removed.file && removed.previewUrl) {
        URL.revokeObjectURL(removed.previewUrl)
      }
      return newImages
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) {
      toast({ title: '校验错误', description: '需要填写标题', variant: 'destructive' })
      return
    }
    const validSteps = form.steps.filter((s) => s.trim().length > 0)
    if (validSteps.length === 0) {
      toast({ title: '校验错误', description: '至少需要一个步骤', variant: 'destructive' })
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        cook_minutes: form.cook_minutes === '' ? undefined : form.cook_minutes,
        servings: form.servings === '' ? undefined : form.servings,
        steps: validSteps,
        tags: form.tags,
      }

      let targetRecipeId = activeRecipeId
      if (targetRecipeId) {
        await updateMutation.mutateAsync({ id: targetRecipeId, json: payload })
        toast({
          title: '菜谱已保存',
          description: '图片会继续在后台上传。',
        })
      } else {
        const created = await createMutation.mutateAsync(payload)
        targetRecipeId = created.id
        setCreatedRecipeId(created.id)
        setShowCreateSuccessBanner(true)
      }

      const hasQueuedUploads = imagesRef.current.some((image) => image.file && !image.uploadUrl)
      if (hasQueuedUploads) {
        queuePendingUploads(targetRecipeId)
      } else if (!isEdit) {
        setShowCreateSuccessBanner(true)
      }
    } catch (err: unknown) {
      let errorMessage = '发生意外错误。'
      if (err instanceof Error) {
        errorMessage = err.message
      }
      toast({
        title: '保存菜谱时出错',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isEdit && isLoadingRecipe) {
    return <div className="p-8 text-center animate-pulse">正在加载菜谱详情...</div>
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
        <Link to={isEdit ? `/recipe/${recipeId}` : '/'} className="flex items-center hover:text-primary transition-colors">
          <ChevronLeft className="h-4 w-4 mr-1" />
          返回
        </Link>
      </div>

      <div className="glass-card p-6 sm:p-8 rounded-2xl shadow-elevated border border-border/60">
        <h1 className="text-3xl font-bold tracking-tight mb-8">
          {isEdit ? '编辑菜谱' : '创建新菜谱'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-4">
            <Label className="text-base">照片</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {images.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group bg-muted/50 border border-border/50">
                  <img src={img.previewUrl} alt="预览图" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  {img.status === 'uploading' && !img.uploadUrl && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
                      <span className="text-xs font-medium text-primary">{img.progress}%</span>
                    </div>
                  )}
                </div>
              ))}
              <label className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:bg-secondary/50 hover:border-primary/50 transition-colors text-muted-foreground hover:text-primary">
                <UploadCloud className="h-8 w-8 mb-2" />
                <span className="text-sm font-medium">添加照片</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageSelect}
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {showCreateSuccessBanner && createdRecipeId && (
              <div className="md:col-span-2">
                <RecipeCreateSuccessBanner
                  recipeId={createdRecipeId}
                  uploadedCount={images.filter((image) => image.file && image.status === 'success').length}
                  pendingCount={images.filter((image) => image.file && image.status !== 'success' && image.status !== 'error').length}
                  errorCount={images.filter((image) => image.file && image.status === 'error').length}
                  onViewDetail={() => navigate(`/recipe/${createdRecipeId}`)}
                  onDismiss={() => setShowCreateSuccessBanner(false)}
                />
              </div>
            )}

            {images.some((image) => image.file) && (
              <div className="md:col-span-2">
                <RecipeUploadQueue
                  items={images
                    .filter((image) => image.file)
                    .map((image) => ({
                      localId: image.localId,
                      previewUrl: image.previewUrl,
                      fileName: image.file?.name ?? '未命名图片',
                      progress: image.progress,
                      status: image.status,
                      errorMessage: image.errorMessage,
                    }))}
                  canRetry={Boolean(activeRecipeId)}
                  onRetry={(localId) => {
                    if (!activeRecipeId) {
                      return
                    }
                    void uploadSingleImage(localId, activeRecipeId)
                  }}
                />
              </div>
            )}

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title" className="text-base">标题 *</Label>
              <Input
                id="title"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="例如：经典意面"
                className="text-lg py-6"
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description" className="text-base">描述</Label>
              <Textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="分享这道菜背后的故事..."
                className="resize-y min-h-[100px] text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cook_minutes" className="text-base">烹饪时间（分钟）</Label>
              <Input
                id="cook_minutes"
                name="cook_minutes"
                type="number"
                min="1"
                value={form.cook_minutes}
                onChange={handleChange}
                placeholder="例如：45"
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="servings" className="text-base">份量</Label>
              <Input
                id="servings"
                name="servings"
                type="number"
                min="1"
                value={form.servings}
                onChange={handleChange}
                placeholder="例如：4"
                className="text-base"
              />
            </div>

            <div className="space-y-3 md:col-span-2 pt-2 border-t border-border/40">
              <Label className="text-base">标签</Label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((t) => {
                  const isSelected = form.tags.includes(t.id)
                  return (
                    <Badge
                      key={t.id}
                      variant={isSelected ? 'default' : 'outline'}
                      className={`cursor-pointer transition-all ${isSelected ? 'shadow-md scale-105' : 'hover:bg-secondary'}`}
                      onClick={() => toggleTag(t.id)}
                    >
                      {t.name}
                    </Badge>
                  )
                })}
                {availableTags.length === 0 && (
                  <span className="text-sm text-muted-foreground italic">您的家庭暂无可用标签。</span>
                )}
              </div>
            </div>

            <div className="space-y-4 md:col-span-2 pt-4 border-t border-border/40">
              <Label className="text-base">步骤 *</Label>
              <StepEditor
                steps={form.steps}
                onChange={(newSteps) => setForm({ ...form, steps: newSteps })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : activeRecipeId ? (
                '保存更改'
              ) : isEdit ? (
                '保存更改'
              ) : (
                '创建菜谱'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
