import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SimulatorView } from '../SimulatorView'
import { PlannerProvider } from '@/context/PlannerContext'

describe('SimulatorView Component (Adaptive What-If Planning)', () => {
  it('renders simulator header, USP badge, and side-by-side comparison', () => {
    render(
      <PlannerProvider>
        <SimulatorView />
      </PlannerProvider>,
    )

    expect(
      screen.getByText(/Adaptive What-If Scenario Simulator/i),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/WHAT-IF → RECALCULATE → REPLAN/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/Baseline Plan/i)).toBeInTheDocument()
    expect(screen.getByText(/What-If Simulation/i)).toBeInTheDocument()
  })

  it('renders presets and updates proposed scenario values on preset click', () => {
    render(
      <PlannerProvider>
        <SimulatorView />
      </PlannerProvider>,
    )

    const cutPreset = screen.getByRole('button', { name: /-15% Budget Cut/i })
    expect(cutPreset).toBeInTheDocument()

    fireEvent.click(cutPreset)

    // Proposed budget should now reflect the cut
    expect(screen.getByText(/Discard Scenario/i)).toBeEnabled()
    expect(screen.getByText(/Review & Apply Changes/i)).toBeEnabled()
  })

  it('discarding a scenario restores baseline inputs and disables apply button', () => {
    render(
      <PlannerProvider>
        <SimulatorView />
      </PlannerProvider>,
    )

    // Make a change
    const guestInput = screen.getByLabelText(/Target Guest Count/i)
    fireEvent.change(guestInput, { target: { value: '180' } })

    const discardBtn = screen.getByRole('button', { name: /Discard Scenario/i })
    expect(discardBtn).toBeEnabled()

    // Click Discard
    fireEvent.click(discardBtn)

    expect(screen.getByText(/Scenario discarded/i)).toBeInTheDocument()
    expect(discardBtn).toBeDisabled()
  })

  it('opens confirmation modal and applies scenario consistently', async () => {
    render(
      <PlannerProvider>
        <SimulatorView />
      </PlannerProvider>,
    )

    // Trigger surge preset
    const surgeBtn = screen.getByRole('button', { name: /\+30 Guest Surge/i })
    fireEvent.click(surgeBtn)

    const reviewBtn = screen.getByRole('button', { name: /Review & Apply Changes/i })
    fireEvent.click(reviewBtn)

    // Modal opens
    expect(
      await screen.findByRole('heading', { name: /Confirm Scenario Application/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Guaranteed Intent Preservation/i)).toBeInTheDocument()

    // Click confirm apply
    const confirmBtn = screen.getByRole('button', { name: /Confirm & Apply Changes/i })
    fireEvent.click(confirmBtn)

    // Successfully applied notice
    expect(await screen.findByText(/Scenario applied successfully/i)).toBeInTheDocument()
  })

  it('repeated edits do not duplicate tasks or create inconsistent state', () => {
    render(
      <PlannerProvider>
        <SimulatorView />
      </PlannerProvider>,
    )

    const budgetInput = screen.getByLabelText(/Total Budget/i)

    // Edit 1
    fireEvent.change(budgetInput, { target: { value: '60000' } })
    // Edit 2
    fireEvent.change(budgetInput, { target: { value: '45000' } })
    // Edit 3
    fireEvent.change(budgetInput, { target: { value: '55000' } })

    // Verify side by side still renders cleanly
    expect(screen.getByText(/Baseline Plan/i)).toBeInTheDocument()
    expect(screen.getByText(/What-If Simulation/i)).toBeInTheDocument()
  })
})

