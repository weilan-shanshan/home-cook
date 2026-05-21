import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { ChevronLeft, Copy, Check, KeyRound, Loader2 } from 'lucide-react'
import { useCurrentUser } from '@/hooks/useAuth'
import { useFamily, useFamilyMembers } from '@/hooks/useFamily'
import { useResetMemberPassword } from '@/hooks/useResetMemberPassword'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'

export default function FamilyManage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { data: currentUser } = useCurrentUser()
  const familyId = currentUser?.familyId ?? null
  const isAdmin = currentUser?.role === 'admin'

  const { data: family, isLoading: loadingFamily } = useFamily(familyId)
  const { data: members = [], isLoading: loadingMembers } = useFamilyMembers(familyId)
  const { mutate: resetPassword, isPending: isResetting } = useResetMemberPassword()

  const [codeCopied, setCodeCopied] = useState(false)
  const [resetTarget, setResetTarget] = useState<{ id: number; name: string } | null>(null)
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')

  const handleCopyCode = useCallback(async () => {
    if (!family?.invite_code) return
    try {
      await navigator.clipboard.writeText(family.invite_code)
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 2000)
    } catch {
      toast({ description: '复制失败，请手动复制', variant: 'destructive' })
    }
  }, [family?.invite_code, toast])

  const openResetDialog = useCallback((id: number, name: string) => {
    setResetTarget({ id, name })
    setNewPwd('')
    setConfirmPwd('')
  }, [])

  const handleReset = useCallback(() => {
    if (!familyId || !resetTarget) return
    if (newPwd.length < 6) {
      toast({ description: '密码至少 6 位', variant: 'destructive' })
      return
    }
    if (newPwd !== confirmPwd) {
      toast({ description: '两次密码不一致', variant: 'destructive' })
      return
    }
    resetPassword(
      { familyId, userId: resetTarget.id, newPassword: newPwd },
      {
        onSuccess: () => {
          toast({ description: `已重置 ${resetTarget.name} 的密码` })
          setResetTarget(null)
        },
        onError: (err) => {
          toast({ description: (err as Error).message, variant: 'destructive' })
        },
      },
    )
  }, [familyId, resetTarget, newPwd, confirmPwd, resetPassword, toast])

  const isLoading = loadingFamily || loadingMembers

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
        <h1 className="font-serif text-2xl text-ink-900">家庭管理</h1>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-ink-400 gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-brand" />
          <span className="text-sm">加载中…</span>
        </div>
      ) : (
        <>
          {/* Invite code card */}
          {family && (
            <section className="surface-card p-5">
              <div className="flex items-end justify-between mb-3">
                <h2 className="font-serif text-base text-ink-900">邀请码</h2>
                <span className="text-[11px] text-ink-400">分享给家人加入</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-cream-100 rounded-2xl px-4 py-3 font-mono text-xl tracking-widest text-ink-900 font-semibold">
                  {family.invite_code}
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="w-11 h-11 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center cursor-pointer hover:bg-brand-200 transition-colors"
                >
                  {codeCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </section>
          )}

          {/* Members list */}
          <section className="surface-card divide-y divide-cream-100">
            <div className="p-4 flex items-center justify-between">
              <h2 className="font-serif text-base text-ink-900">家庭成员</h2>
              <span className="text-xs text-ink-400">{members.length} 人</span>
            </div>
            {members.map((member) => {
              const name = member.display_name ?? member.username
              const initial = name.charAt(0).toUpperCase()
              const isAdminMember = member.role === 'admin'
              return (
                <div key={member.id} className="flex items-center gap-3 p-4">
                  <Avatar className="w-10 h-10 shrink-0">
                    <AvatarFallback
                      className={`text-sm font-semibold ${isAdminMember ? 'bg-brand-100 text-brand-700' : 'bg-cream-200 text-ink-600'}`}
                    >
                      {initial}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink-900 truncate">{name}</div>
                    <div className="text-[11px] text-ink-400 truncate">@{member.username}</div>
                  </div>
                  <span
                    className={`text-[10px] rounded-full px-2 py-0.5 shrink-0 ${isAdminMember ? 'bg-brand-50 text-brand-600' : 'bg-cream-100 text-ink-500'}`}
                  >
                    {isAdminMember ? '管理员' : '成员'}
                  </span>
                  {isAdmin && member.id !== currentUser?.id && (
                    <button
                      type="button"
                      onClick={() => openResetDialog(member.id, name)}
                      className="shrink-0 w-8 h-8 rounded-full bg-cream-100 flex items-center justify-center text-ink-500 hover:text-ink-700 hover:bg-cream-200 transition-colors cursor-pointer"
                      title="重置密码"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )
            })}
          </section>
        </>
      )}

      {/* Reset password dialog */}
      <Dialog open={!!resetTarget} onOpenChange={(o) => !o && setResetTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>重置密码</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-ink-600">
              为 <span className="font-semibold text-ink-900">{resetTarget?.name}</span> 设置新密码
            </p>
            <Input
              type="password"
              placeholder="新密码（至少 6 位）"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
            />
            <Input
              type="password"
              placeholder="确认新密码"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setResetTarget(null)}>
              取消
            </Button>
            <Button onClick={handleReset} disabled={isResetting}>
              {isResetting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              确认重置
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
