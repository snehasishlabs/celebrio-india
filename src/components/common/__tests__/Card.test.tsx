import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card, CardHeader, CardBody, CardFooter } from '../Card'

describe('Card Component', () => {
  it('renders card content with proper structure', () => {
    render(
      <Card>
        <CardHeader>Header Content</CardHeader>
        <CardBody>Body Content</CardBody>
        <CardFooter>Footer Content</CardFooter>
      </Card>,
    )

    expect(screen.getByText('Header Content')).toBeInTheDocument()
    expect(screen.getByText('Body Content')).toBeInTheDocument()
    expect(screen.getByText('Footer Content')).toBeInTheDocument()
  })

  it('applies elevated variant styling', () => {
    const { container } = render(<Card variant="elevated">Elevated</Card>)
    expect(container.firstChild).toHaveClass('shadow-card')
  })
})
