import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DashboardView } from '../DashboardView'
import { PlannerProvider } from '@/context/PlannerContext'

describe('DashboardView Component', () => {
  it('renders welcome heading and Create Event trigger', () => {
    render(
      <PlannerProvider>
        <DashboardView />
      </PlannerProvider>,
    )

    expect(screen.getByText(/Welcome to Celebrio AI/i)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /create event/i }),
    ).toBeInTheDocument()
  })

  it('renders all 4 vital metric cards: Planned Spending, Remaining Budget, Pending Tasks, Vendors Secured', () => {
    render(
      <PlannerProvider>
        <DashboardView />
      </PlannerProvider>,
    )

    expect(screen.getByText(/Planned Spending/i)).toBeInTheDocument()
    expect(screen.getByText(/Remaining Budget/i)).toBeInTheDocument()
    expect(screen.getByText(/Pending Tasks/i)).toBeInTheDocument()
    expect(screen.getByText(/Vendors Secured/i)).toBeInTheDocument()
  })

  it('displays the upcoming celebrations switcher', () => {
    render(
      <PlannerProvider>
        <DashboardView />
      </PlannerProvider>,
    )

    expect(screen.getByText(/Upcoming Celebrations/i)).toBeInTheDocument()
  })

  it('renders recent planning activity audit log', () => {
    render(
      <PlannerProvider>
        <DashboardView />
      </PlannerProvider>,
    )

    expect(screen.getByText(/Recent Activity/i)).toBeInTheDocument()
    expect(screen.getByText(/Live Audit Trail/i)).toBeInTheDocument()
  })
})

