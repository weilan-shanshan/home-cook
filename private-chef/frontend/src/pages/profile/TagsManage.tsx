import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { ChevronLeft, Trash2, Loader2, Plus } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useCurrentUser } from '@/hooks/useAuth'
import { useTags } from '@/hooks/useRecipes'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { baseUrl } from '@/lib/api'

function useCreateTag() {
  const queryClient = useQueryClient()
  return useCallback(
    async (name: string) => {
      const res = await fetch(`${baseUrl}/api/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
        credentials: 'include',
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: '创建失败' }))
        throw new Error((err as { error?: string }).error ?? '创建失败')
      }
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      return res.json()
    },
    [queryClient],
  )
}

function useDeleteTag() {
  const queryClient = useQueryClient()
  return useCallback(
    async (id: number) => {
      const res = await fetch(`${baseUrl}/api/tags/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: '删除失败' }))
        throw new Error((err as { error?: string }).error ?? '删除失败')
      }
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
    [queryClient],
  )
}

export default function TagsManage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { data: currentUser } = useCurrentUser()
  const { data: tags = [], isLoading } = useTags()
  const createTag = useCreateTag()
  const deleteTag = useDeleteTag()

  const [newName, setNewName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  // Redirect non-admins
  if (currentUser && currentUser.role !== 'admin') {
    navigate('/profile', { replace: true })
    return null
  }

  const handleCreate = async () => {
    const name = newName.trim()
    if (!name) return
    setIsCreating(true)
    try {
      await createTag(name)
      setNewName('')
      toast({ description: `标签「${name}」已创建` })
    } catch (err) {
      toast({ description: (err as Error).message, variant: 'destructive' })
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id)
      return
    }
    setDeletingId(id)
    setConfirmDeleteId(null)
    try {
      await deleteTag(id)
      toast({ description: '标签已删除' })
    } catch (err) {
      toast({ description: (err as Error).message, variant: 'destructive' })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <main className="space-y-5 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="w-9 h-9 rounded-full bg-cream-100 flex items-center justify-center text-ink-600 cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-serif text-2xl text-ink-900">标签管理</h1>
      </div>

      {/* Add tag */}
      <section className="surface-card p-4">
        <div className="text-xs text-ink-400 mb-3 font-medium">新建标签</div>
        <div className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="标签名称"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <Button
            onClick={handleCreate}
            disabled={isCreating || !newName.trim()}
            className="shrink-0"
          >
            {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            加
          </Button>
        </div>
      </section>

      {/* Tag list */}
      <section className="surface-card divide-y divide-cream-100">
        <div className="p-4 flex items-center justify-between">
          <h2 className="font-serif text-base text-ink-900">所有标签</h2>
          <span className="text-xs text-ink-400">{tags.length} 个</span>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-8 gap-2 text-ink-400">
            <Loader2 className="w-4 h-4 animate-spin text-brand" />
            <span className="text-sm">加载中…</span>
          </div>
        ) : tags.length === 0 ? (
          <div className="text-center text-sm text-ink-400 py-8">暂无标签</div>
        ) : (
          tags.map((tag) => (
            <div key={tag.id} className="flex items-center gap-3 px-4 py-3">
              <span className="flex-1 text-sm text-ink-900">{tag.name}</span>
              <button
                type="button"
                onClick={() => handleDelete(tag.id)}
                disabled={deletingId === tag.id}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                  confirmDeleteId === tag.id
                    ? 'bg-rose-100 text-rose-500 hover:bg-rose-200'
                    : 'bg-cream-100 text-ink-400 hover:text-rose-500 hover:bg-rose-50'
                }`}
                title={confirmDeleteId === tag.id ? '再次点击确认删除' : '删除'}
              >
                {deletingId === tag.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          ))
        )}
      </section>
      {confirmDeleteId !== null && (
        <p className="text-xs text-center text-rose-500">再次点击垃圾桶确认删除</p>
      )}
    </main>
  )
}
