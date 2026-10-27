import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CreateEventModal } from '../CreateEventModal'
import { PlannerProvider } from '@/context/PlannerContext'

describe('CreateEventModal Component', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <PlannerProvider>
        <CreateEventModal isOpen={false} onClose={vi.fn()} />
      </PlannerProvider>,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders all four primary event categories: Wedding, Birthday, Anniversary, and Community Event', () => {
    render(
      <PlannerProvider>
        <CreateEventModal isOpen={true} onClose={vi.fn()} />
      </PlannerProvider>,
    )

    expect(screen.getByRole('button', { name: /wedding/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /birthday/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /anniversary/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /community event/i })).toBeInTheDocument()
  })

  it('validates required fields on blur and submit', async () => {
    render(
      <PlannerProvider>
        <CreateEventModal isOpen={true} onClose={vi.fn()} />
      </PlannerProvider>,
    )

    const submitBtn = screen.getByRole('button', { name: /create celebration plan/i })
    fireEvent.click(submitBtn)

    // Should display validation errors
    expect(await screen.findByText(/event name is required/i)).toBeInTheDocument()
    expect(await screen.findByText(/location city is required/i)).toBeInTheDocument()
  })

  it('allows creating an event with valid input and closes modal', async () => {
    const handleClose = vi.fn()
    render(
      <PlannerProvider>
        <CreateEventModal isOpen={true} onClose={handleClose} />
      </PlannerProvider>,
    )

    // Select Birthday
    fireEvent.click(screen.getByRole('button', { name: /birthday/i }))

    // Fill in required fields
    const titleInput = screen.getByLabelText(/celebration name/i)
    fireEvent.change(titleInput, { target: { value: "Liam's 30th Rooftop Birthday" } })

    const cityInput = screen.getByLabelText(/city & region/i)
    fireEvent.change(cityInput, { target: { value: 'Austin, TX' } })

    const budgetInput = screen.getByLabelText(/total budget cap/i)
    fireEvent.change(budgetInput, { target: { value: '25000' } })

    const guestsInput = screen.getByLabelText(/guest count/i)
    fireEvent.change(guestsInput, { target: { value: '75' } })

    // Select Dietary
    fireEvent.click(screen.getByRole('button', { name: /vegan/i }))

    // Submit
    const submitBtn = screen.getByRole('button', { name: /create celebration plan/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(handleClose).toHaveBeenCalled()
    })
  })
})
