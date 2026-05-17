import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { MemoryRouter } from 'react-router'
import { Star } from 'lucide-react'
import { HomeRecipeRail } from './HomeRecipeRail'

const sampleRecipes = [
  { recipeId: 1, title: '红烧肉', orderCount: 5, image: null },
  { recipeId: 2, title: '清蒸鱼', orderCount: 3, image: { url: 'https://x', thumbUrl: null } },
  { recipeId: 3, title: '番茄炒蛋', orderCount: 8, image: null },
]

function renderRail(props: Partial<React.ComponentProps<typeof HomeRecipeRail>> = {}) {
  return render(
    <MemoryRouter>
      <HomeRecipeRail
        title="今日推荐"
        icon={<Star className="w-5 h-5" />}
        iconClassName="bg-amber-100 text-amber-500"
        recipes={sampleRecipes}
        countLabel={(n) => `点过 ${n} 次`}
        {...props}
      />
    </MemoryRouter>,
  )
}

describe('HomeRecipeRail', () => {
  test('returns null when recipes is empty', () => {
    const { container } = renderRail({ recipes: [] })
    expect(container.firstChild).toBeNull()
  })

  test('renders title and one link per recipe', () => {
    renderRail()
    expect(screen.getByText('今日推荐')).toBeInTheDocument()
    expect(screen.getAllByRole('link')).toHaveLength(3)
  })

  test('renders each recipe with its title and count label', () => {
    renderRail()
    expect(screen.getByText('红烧肉')).toBeInTheDocument()
    expect(screen.getByText('点过 5 次')).toBeInTheDocument()
    expect(screen.getByText('点过 3 次')).toBeInTheDocument()
    expect(screen.getByText('点过 8 次')).toBeInTheDocument()
  })

  test('link href uses /recipe/:id', () => {
    renderRail()
    const links = screen.getAllByRole('link') as HTMLAnchorElement[]
    expect(links[0].getAttribute('href')).toBe('/recipe/1')
    expect(links[1].getAttribute('href')).toBe('/recipe/2')
  })
})
