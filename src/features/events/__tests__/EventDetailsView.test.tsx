import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EventDetailsView } from '../EventDetailsView'
import { PlannerProvider } from '@/context/PlannerContext'

describe('EventDetailsView Component', () => {
  it('renders all seven required tabs', () => {
    render(
      <PlannerProvider>
        <EventDetailsView />
      </PlannerProvider>,
    )

    expect(screen.getByRole('tab', { name: /overview/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /personalized ideas/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /budget planner/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /timeline/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /vendors/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /guest experience/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /contingency plan/i })).toBeInTheDocument()
  })

  it('switches to Guest Experience tab when clicked', () => {
    render(
      <PlannerProvider>
        <EventDetailsView />
      </PlannerProvider>,
    )

    const guestTab = screen.getByRole('tab', { name: /guest experience/i })
    fireEvent.click(guestTab)

    expect(
      screen.getByText(/Guest Experience, Dietary & Accessibility/i),
    ).toBeInTheDocument()
  })

  it('switches to Contingency Plan tab when clicked', () => {
    render(
      <PlannerProvider>
        <EventDetailsView />
      </PlannerProvider>,
    )

    const contingencyTab = screen.getByRole('tab', { name: /contingency plan/i })
    fireEvent.click(contingencyTab)

    expect(
      screen.getByText(/Contingency & Disruption Playbook/i),
    ).toBeInTheDocument()
  })
})

