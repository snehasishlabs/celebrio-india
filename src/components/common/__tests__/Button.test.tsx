import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../Button'

describe('Button Component', () => {
  it('renders children correctly', () => {
    render(<Button>Click Me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('handles click events', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Trigger</Button>)
    fireEvent.click(screen.getByRole('button', { name: /trigger/i }))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('renders disabled state properly', () => {
    render(<Button disabled>Disabled Action</Button>)
    const btn = screen.getByRole('button', { name: /disabled action/i })
    expect(btn).toBeDisabled()
  })

  it('displays loading state and disables interaction', () => {
    render(<Button isLoading>Submit</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
  })

  it('applies terracotta variant styles', () => {
    const { container } = render(<Button variant="terracotta">Accent</Button>)
    expect(container.firstChild).toHaveClass('bg-terracotta-500')
  })
})

