import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from '../Badge'

describe('Badge Component', () => {
  it('renders text with forest variant', () => {
    render(<Badge variant="forest">In Sync</Badge>)
    const badge = screen.getByText('In Sync')
    expect(badge).toBeInTheDocument()
  })

  it('renders dot indicator when enabled', () => {
    const { container } = render(
      <Badge variant="gold" dot>
        Milestone
      </Badge>,
    )
    const dot = container.querySelector('span.rounded-full.shrink-0')
    expect(dot).toBeInTheDocument()
  })
})

