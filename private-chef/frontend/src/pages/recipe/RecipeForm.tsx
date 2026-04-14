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
  id?: number
  file?: File
  previewUrl: string
  uploadUrl?: string
  progress?: number
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
            id: img.id,
            previewUrl: img.url,
            uploadUrl: img.url,
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
      file,
      previewUrl: URL.createObjectURL(file),
      progress: 0,
    }))
    
    setImages((prev) => [...prev, ...newImages])
    e.target.value = '' // reset input
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

      let targetRecipeId: number
      if (isEdit) {
        await updateMutation.mutateAsync({ id: recipeId, json: payload })
        targetRecipeId = recipeId
        toast({ title: '菜谱更新成功！' })
      } else {
        const created = await createMutation.mutateAsync(payload)
        targetRecipeId = created.id
        toast({ title: '菜谱创建成功！' })
      }

      // Upload and link new images
      await Promise.all(
        images.map(async (img, idx) => {
          if (img.uploadUrl) return img // Already uploaded (from edit mode)
          if (!img.file) throw new Error('Missing file for new image')
          
          const result = await uploadImage(img.file, {
            onProgress: (p) => {
              setImages((prev) => {
                const updated = [...prev]
                updated[idx].progress = p
                return updated
              })
            },
          })
          
          await saveImageMutation.mutateAsync({
            recipeId: targetRecipeId,
            json: {
              url: result.url,
              sort_order: idx
            }
          })
          
          return { ...img, uploadUrl: result.url }
        })
      )
      
      navigate(`/recipe/${targetRecipeId}`)
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

      <div className="glass-card p-6 sm:p-8 rounded-2xl shadow-elevated">
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
                  {img.progress !== undefined && img.progress < 100 && !img.uploadUrl && (
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
