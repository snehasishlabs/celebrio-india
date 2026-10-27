import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BudgetView } from '../BudgetView'
import { PlannerProvider } from '@/context/PlannerContext'

describe('BudgetView Component (Budget Guardian Dashboard)', () => {
  it('renders all essential vitals: Total Budget Cap, Planned Spending, Contingency Reserve, Remaining Balance', () => {
    render(
      <PlannerProvider>
        <BudgetView />
      </PlannerProvider>,
    )

    expect(screen.getByText(/Total Budget Cap/i)).toBeInTheDocument()
    expect(screen.getByText(/Planned Spending/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Contingency Reserve/i)[0]).toBeInTheDocument()
    expect(screen.getByText(/Remaining Balance/i)).toBeInTheDocument()
  })

  it('renders category share & distribution breakdown', () => {
    render(
      <PlannerProvider>
        <BudgetView />
      </PlannerProvider>,
    )

    expect(
      screen.getByText(/Category Distribution & Spending Cap Share/i),
    ).toBeInTheDocument()
  })

  it('displays cost status tabs (All, Estimated, Quoted, Confirmed)', () => {
    render(
      <PlannerProvider>
        <BudgetView />
      </PlannerProvider>,
    )

    expect(screen.getByRole('button', { name: /^All/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Estimated/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Quoted/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Confirmed/i })).toBeInTheDocument()
  })

  it('opens the Add Line Item modal on click', async () => {
    render(
      <PlannerProvider>
        <BudgetView />
      </PlannerProvider>,
    )

    const addBtn = screen.getByRole('button', { name: /Add Line Item/i })
    fireEvent.click(addBtn)

    expect(
      await screen.findByRole('heading', { name: /Add Itemized Budget Line/i }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/Line Item Name/i)).toBeInTheDocument()
  })

  it('allows switching cost status filter tabs to narrow line items', () => {
    render(
      <PlannerProvider>
        <BudgetView />
      </PlannerProvider>,
    )

    const quotedTab = screen.getByRole('button', { name: /^Quoted/i })
    fireEvent.click(quotedTab)

    // Quoted filter is now active
    expect(quotedTab).toHaveClass('text-forest-900')
  })
})
