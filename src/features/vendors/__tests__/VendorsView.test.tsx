import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { VendorsView } from '../VendorsView'
import { PlannerProvider } from '@/context/PlannerContext'

describe('VendorsView Component (Vendor Portfolio & Worksheet)', () => {
  it('renders vendor header, metric vitals, and transparent data policy', () => {
    render(
      <PlannerProvider>
        <VendorsView />
      </PlannerProvider>,
    )

    expect(
      screen.getByText(/Curated Vendor Portfolio & Contracts/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/Total Quoted Pipeline/i)).toBeInTheDocument()
    expect(screen.getByText(/Contracted Commitments/i)).toBeInTheDocument()
    expect(screen.getByText(/Deposits & Paid Milestones/i)).toBeInTheDocument()
    expect(screen.getByText(/Transparent Vendor Policy/i)).toBeInTheDocument()
  })

  it('renders vendor portfolio cards with cost statuses', () => {
    render(
      <PlannerProvider>
        <VendorsView />
      </PlannerProvider>,
    )

    expect(screen.getByText(/The Royal Botanical Conservatory/i)).toBeInTheDocument()
    expect(screen.getByText(/Heirloom Table Gastronomy/i)).toBeInTheDocument()
  })

  it('allows switching to Comparison Worksheet tab', () => {
    render(
      <PlannerProvider>
        <VendorsView />
      </PlannerProvider>,
    )

    const worksheetBtn = screen.getByRole('button', { name: /Comparison Worksheet/i })
    fireEvent.click(worksheetBtn)

    expect(
      screen.getByText(/Side-by-Side Proposal Comparison Worksheet/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/Candidate 1/i)).toBeInTheDocument()
    expect(screen.getByText(/Candidate 2/i)).toBeInTheDocument()
  })

  it('opens the Add Supplier modal on click with accessible labels', async () => {
    render(
      <PlannerProvider>
        <VendorsView />
      </PlannerProvider>,
    )

    const addBtn = screen.getByRole('button', { name: /Add Supplier/i })
    fireEvent.click(addBtn)

    expect(
      await screen.findByRole('heading', { name: /Add New Supplier Candidate/i }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/Service Category/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Quoted Cost/i)).toBeInTheDocument()
  })
})

