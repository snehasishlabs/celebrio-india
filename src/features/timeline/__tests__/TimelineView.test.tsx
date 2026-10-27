import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TimelineView } from '../TimelineView'
import { PlannerProvider } from '@/context/PlannerContext'

describe('TimelineView Component (Critical Path Scheduling)', () => {
  it('renders timeline header, planning horizon badge, and vitals', () => {
    render(
      <PlannerProvider>
        <TimelineView />
      </PlannerProvider>,
    )

    expect(
      screen.getByText(/Preparation Timeline & Milestone Roadmap/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/Total Milestones/i)).toBeInTheDocument()
    expect(screen.getByText(/Overdue Tasks/i)).toBeInTheDocument()
    expect(screen.getByText(/Due Next 7 Days/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Critical Path/i)[0]).toBeInTheDocument()
  })

  it('renders filter tabs and allows switching between views', () => {
    render(
      <PlannerProvider>
        <TimelineView />
      </PlannerProvider>,
    )

    const allBtn = screen.getByRole('button', { name: /All Milestones/i })
    const criticalBtn = screen.getByRole('button', { name: /Critical Path Only/i })
    const completedBtn = screen.getByRole('button', { name: /Completed/i })

    expect(allBtn).toBeInTheDocument()
    expect(criticalBtn).toBeInTheDocument()
    expect(completedBtn).toBeInTheDocument()

    fireEvent.click(criticalBtn)
    expect(criticalBtn).toHaveClass('bg-forest-800')
  })

  it('opens the Add Milestone modal when clicking Add Milestone', async () => {
    render(
      <PlannerProvider>
        <TimelineView />
      </PlannerProvider>,
    )

    const addBtn = screen.getByRole('button', { name: /Add Milestone/i })
    fireEvent.click(addBtn)

    expect(
      await screen.findByRole('heading', { name: /Add Preparation Milestone/i }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/Milestone Title/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Planning Phase/i)).toBeInTheDocument()
  })

  it('allows toggling milestone completion and reopening tasks', () => {
    render(
      <PlannerProvider>
        <TimelineView />
      </PlannerProvider>,
    )

    // Locate the first task toggle button
    const toggleBtns = screen.getAllByRole('button', { name: /Mark .* as (complete|incomplete)/i })
    expect(toggleBtns.length).toBeGreaterThan(0)

    const firstToggle = toggleBtns[0]
    fireEvent.click(firstToggle)

    // Re-clicking toggles / reopens
    fireEvent.click(firstToggle)
  })
})

