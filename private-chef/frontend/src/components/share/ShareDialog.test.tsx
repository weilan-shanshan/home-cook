import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ShareDialog } from './ShareDialog'
import { Toaster } from '@/components/ui/toaster'

const shareCardPayload = {
  target_type: 'order',
  target_id: '1',
  title: '今晚这顿很值得分享',
  summary: '家庭晚餐 · 热气腾腾地上桌了',
  cover_image_url: null,
  share_page: { token: 'abc123', url: 'http://localhost:5173/share/abc123' },
  wechat: {
    title: '今晚这顿很值得分享',
    summary: '家庭晚餐 · 热气腾腾地上桌了',
    cover_url: null,
  },
  poster: {
    title: '今晚这顿很值得分享',
    summary: '红烧排骨 / 清炒时蔬 / 玉米汤',
    qr_target_url: 'http://localhost:5173/share/abc123',
    helper_text: '扫码查看完整内容',
  },
  visual: {
    hero_emphasis: 'order',
    accent: 'amber',
    chips: ['晚餐', '3道菜', '已完成'],
  },
  public_context: {
    family_name: '幸福小家',
    requester_display_name: '小王',
    cook_display_name: '阿姨',
  },
  facts: ['红烧排骨 x1', '清炒时蔬 x1'],
} as const

const shareResponse = {
  id: 1,
  user_id: 1,
  target_type: 'order',
  target_id: '1',
  share_type: 'link',
  channel: 'copy_link',
  token: 'abc123',
  share_url: 'http://localhost:5173/share/abc123',
  created_at: '2026-04-20 12:00:00',
  wechat: shareCardPayload.wechat,
  poster: shareCardPayload.poster,
} as const

function renderDialog() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <ShareDialog
        open
        onOpenChange={() => undefined}
        title="分享这份订单"
        shareCardEndpoint="/api/orders/1/share-card"
        shareActionEndpoint="/api/orders/1/share"
        invalidateKeys={[["order", 1]]}
      />
      <Toaster />
    </QueryClientProvider>,
  )
}

describe('ShareDialog', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    })
  })

  test('loads preview and copies link on action', async () => {
    const fetchMock = vi.fn()
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify(shareCardPayload), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(shareResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
    vi.stubGlobal('fetch', fetchMock)

    renderDialog()

    expect(await screen.findByText('今晚这顿很值得分享')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /复制链接/i }))

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('http://localhost:5173/share/abc123')
    })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(await screen.findByText('链接已复制')).toBeInTheDocument()
  })
})
