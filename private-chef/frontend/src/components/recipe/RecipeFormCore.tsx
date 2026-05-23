import { useRef, useState } from 'react'
import { Loader2, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { StepEditor } from '@/components/recipe/StepEditor'
import { ImageUploadTile } from '@/components/recipe/ImageUploadTile'
import { useToast } from '@/components/ui/use-toast'
import { useCreateTag } from '@/hooks/useRecipes'
import type { ImageItem } from './RecipeImageGrid'
import type { RecipeTag } from '@/hooks/useRecipes'

export interface RecipeFormValues {
  title: string
  description: string
  cookMinutes: number | ''
  servings: number | ''
  steps: string[]
  tagIds: number[]
}

export interface RecipeImageActions {
  onPick: (file: File) => void
  onRemoveLocal: (localId: string) => void
  onRemoveUploaded: (serverId: number) => void
  onRetry: (localId: string) => void
}

interface RecipeFormCoreProps {
  values: RecipeFormValues
  onChange: (patch: Partial<RecipeFormValues>) => void
  images: ImageItem[]
  imageActions: RecipeImageActions
  availableTags: RecipeTag[]
  titleInputRef?: React.Ref<HTMLInputElement>
}

const MAX_IMAGES = 4

export function RecipeFormCore({
  values,
  onChange,
  images,
  imageActions,
  availableTags,
  titleInputRef,
}: RecipeFormCoreProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [newTagName, setNewTagName] = useState('')
  const { toast } = useToast()
  const createTagMutation = useCreateTag()

  const toggleTag = (tagId: number) => {
    const next = values.tagIds.includes(tagId)
      ? values.tagIds.filter((id) => id !== tagId)
      : [...values.tagIds, tagId]
    onChange({ tagIds: next })
  }

  const handleCreateTag = async () => {
    const name = newTagName.trim()
    if (!name || createTagMutation.isPending) return
    if (availableTags.some((t) => t.name === name)) {
      const existing = availableTags.find((t) => t.name === name)!
      if (!values.tagIds.includes(existing.id)) toggleTag(existing.id)
      setNewTagName('')
      return
    }
    try {
      const created = await createTagMutation.mutateAsync(name)
      onChange({ tagIds: [...values.tagIds, created.id] })
      setNewTagName('')
    } catch (err) {
      toast({
        description: err instanceof Error ? err.message : '创建标签失败',
        variant: 'destructive',
      })
    }
  }

  const handleAddImageClick = () => fileInputRef.current?.click()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    for (const file of Array.from(files)) imageActions.onPick(file)
    e.target.value = ''
  }

  const handleRemoveImage = (item: ImageItem) => {
    if (item.status === 'uploaded' && item.serverId != null) {
      imageActions.onRemoveUploaded(item.serverId)
    } else {
      imageActions.onRemoveLocal(item.localId)
    }
  }

  // Build the 4-slot image grid
  const imageSlots = Array.from({ length: MAX_IMAGES }, (_, i) => images[i] ?? null)

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm text-ink-700 mb-1.5 block">菜名</label>
        <Input
          ref={titleInputRef}
          value={values.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="输入菜名…"
        />
      </div>

      <div>
        <label className="text-sm text-ink-700 mb-1.5 block">图片</label>
        <div className="grid grid-cols-4 gap-2">
          {imageSlots.map((item, i) => {
            if (item) {
              return (
                <ImageUploadTile
                  key={item.localId}
                  src={item.thumbUrl || item.url}
                  progress={item.status === 'uploading' ? item.progress : undefined}
                  onRemove={() => handleRemoveImage(item)}
                />
              )
            }
            // empty add-slot: only show the first empty slot as the add button
            const isFirstEmpty = images.length === i
            if (isFirstEmpty) {
              return (
                <ImageUploadTile
                  key={`empty-add-${i}`}
                  onClick={handleAddImageClick}
                />
              )
            }
            return (
              <ImageUploadTile
                key={`empty-${i}`}
                variant="empty"
              />
            )
          })}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <div>
        <label className="text-sm text-ink-700 mb-1.5 block">描述</label>
        <Textarea
          value={values.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="可选，简单描述…"
          className="h-20"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-ink-700 mb-1.5 block">时长（分钟）</label>
          <Input
            type="number"
            inputMode="numeric"
            value={values.cookMinutes}
            onChange={(e) => {
              const v = e.target.value
              onChange({ cookMinutes: v === '' ? '' : Number(v) })
            }}
            placeholder="45"
          />
        </div>
        <div>
          <label className="text-sm text-ink-700 mb-1.5 block">份数</label>
          <Input
            type="number"
            inputMode="numeric"
            value={values.servings}
            onChange={(e) => {
              const v = e.target.value
              onChange({ servings: v === '' ? '' : Number(v) })
            }}
            placeholder="2"
          />
        </div>
      </div>

      <div>
        <label className="text-sm text-ink-700 mb-1.5 block">标签</label>
        {availableTags.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-2">
            {availableTags.map((tag) => {
              const selected = values.tagIds.includes(tag.id)
              return (
                <Badge
                  key={tag.id}
                  variant={selected ? 'default' : 'secondary'}
                  onClick={() => toggleTag(tag.id)}
                  className="cursor-pointer"
                >
                  {tag.name}
                </Badge>
              )
            })}
          </div>
        ) : (
          <p className="text-[11px] text-ink-400 mb-2">还没有标签，在下面输入新建</p>
        )}
        <div className="flex gap-2">
          <Input
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="新建标签，如 蔬菜 / 主菜 / 早餐"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void handleCreateTag()
              }
            }}
            className="h-9 text-sm"
          />
          <button
            type="button"
            onClick={() => void handleCreateTag()}
            disabled={!newTagName.trim() || createTagMutation.isPending}
            aria-label="新建标签"
            className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full bg-brand text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {createTagMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-[10px] text-ink-500 mt-1.5">提交后标签会保留，方便连续录同类菜</p>
      </div>

      <div>
        <label className="text-sm text-ink-700 mb-1.5 block">步骤</label>
        <StepEditor
          steps={values.steps}
          onChange={(steps) => onChange({ steps })}
        />
      </div>
    </div>
  )
}
