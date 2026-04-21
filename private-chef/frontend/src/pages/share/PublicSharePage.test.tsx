import { screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import PublicSharePage from './PublicSharePage'
import { renderWithProviders } from '@/test/test-utils'

describe('PublicSharePage', () => {
  test('renders shared content without authenticated shell', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            target_type: 'daily_menu',
            target_id: 'today',
            title: '今天吃什么，已经替你想好了',
            summary: '红烧鸡翅 / 西兰花 / 蛋汤',
            cover_image_url: null,
            share_page: { token: 'token-1', url: 'http://localhost:5173/share/token-1' },
            wechat: {
              title: '今天吃什么，已经替你想好了',
              summary: '红烧鸡翅 / 西兰花 / 蛋汤',
              cover_url: null,
            },
            poster: {
              title: '今天吃什么，已经替你想好了',
              summary: '红烧鸡翅 / 西兰花 / 蛋汤',
              qr_target_url: 'http://localhost:5173/share/token-1',
              helper_text: '扫码查看完整菜单',
            },
            visual: {
              hero_emphasis: 'daily_menu',
              accent: 'sage',
              chips: ['均衡搭配', '适合晚餐'],
            },
            public_context: {
              family_name: '幸福小家',
              date_label: '2026.04.20',
            },
            facts: ['简单、稳妥、大家都愿意吃'],
            daily_menu: {
              menu_items: [
                { recipe_id: 1, title: '红烧鸡翅', image: null },
                { recipe_id: 2, title: '蒜蓉西兰花', image: null },
              ],
              reason_chips: ['均衡搭配', '适合晚餐'],
            },
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      ),
    )

    renderWithProviders(<PublicSharePage />, { route: '/share/token-1', path: '/share/:token' })

    expect(await screen.findByText('今天吃什么，已经替你想好了')).toBeInTheDocument()
    expect(screen.getAllByText('幸福小家').length).toBeGreaterThan(0)
    expect(screen.getByText('红烧鸡翅')).toBeInTheDocument()
    expect(screen.getByText('蒜蓉西兰花')).toBeInTheDocument()
    expect(screen.getByText('分享亮点')).toBeInTheDocument()
  })
})
