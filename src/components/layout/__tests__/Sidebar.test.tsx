import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Sidebar } from '../Sidebar'
import { PlannerProvider } from '@/context/PlannerContext'

describe('Sidebar Component', () => {
  it('renders brand wordmark and all navigation links', () => {
    render(
      <PlannerProvider>
        <Sidebar />
      </PlannerProvider>,
    )

    expect(screen.getByText('Celebrio')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('My Events')).toBeInTheDocument()
    expect(screen.getByText('Budget Planner')).toBeInTheDocument()
    expect(screen.getByText('Timeline')).toBeInTheDocument()
    expect(screen.getByText('Vendors')).toBeInTheDocument()
    expect(screen.getByText('What-If Simulator')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('renders the core USP statement', () => {
    render(
      <PlannerProvider>
        <Sidebar />
      </PlannerProvider>,
    )

    expect(
      screen.getByText(
        /Plans change\. Budgets shift\. Celebrio keeps everything in sync\./i,
      ),
    ).toBeInTheDocument()
  })
})
