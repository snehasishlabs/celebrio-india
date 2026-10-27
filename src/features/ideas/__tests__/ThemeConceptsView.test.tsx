import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeConceptsView } from '../ThemeConceptsView'
import { PlannerProvider } from '@/context/PlannerContext'

describe('ThemeConceptsView Component', () => {
  it('renders three distinct personalized theme concepts', () => {
    render(
      <PlannerProvider>
        <ThemeConceptsView />
      </PlannerProvider>,
    )

    expect(screen.getByText(/Personalized Theme Concepts/i)).toBeInTheDocument()
    expect(screen.getByText(/Budget-Conscious/i)).toBeInTheDocument()
    expect(screen.getByText(/Creative & Distinctive/i)).toBeInTheDocument()
    expect(screen.getByText(/Premium Tier/i)).toBeInTheDocument()
  })

  it('displays the clear estimate pricing disclaimer', () => {
    render(
      <PlannerProvider>
        <ThemeConceptsView />
      </PlannerProvider>,
    )

    expect(screen.getByText(/Pricing Notice:/i)).toBeInTheDocument()
    expect(
      screen.getByText(/All figures displayed are intelligent estimate approximations/i),
    ).toBeInTheDocument()
  })

  it('allows user to click Select This Concept and updates state', () => {
    render(
      <PlannerProvider>
        <ThemeConceptsView />
      </PlannerProvider>,
    )

    // Find select buttons
    const selectButtons = screen.getAllByRole('button', {
      name: /Select This Concept|Active Concept Selected/i,
    })
    expect(selectButtons.length).toBe(3)

    // Click the first concept's select button if not already selected
    fireEvent.click(selectButtons[0])
    expect(screen.getByText(/Active Concept Selected/i)).toBeInTheDocument()
  })
})
