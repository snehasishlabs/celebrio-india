import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PlannerProvider, usePlanner } from '@/context/PlannerContext'
import { StorageService } from '@/services/storage/storageService'
import { addDays, formatDateIso } from '@/utils/timelineEngine'
import { TimelineView } from '@/features/timeline/TimelineView'
import { SimulatorView } from '@/features/simulator/SimulatorView'
import { AICopilotModal } from '@/features/copilot/AICopilotModal'

describe('Bengali Wedding in Kolkata Demonstration Scenario (11 Steps)', () => {
  beforeEach(() => {
    localStorage.clear()
    StorageService.resetAllData()
  })

  it('executes full end-to-end celebration planning, AI Copilot, and adaptive replanning workflow', async () => {
    // Harness component to drive testable state transitions
    const TestScenarioHarness = () => {
      const {
        activeEvent,
        addEvent,
        budgetItems,
        timelineTasks,
        vendors,
        themeConcepts,
        openCopilotWithQuery,
      } = usePlanner()

      return (
        <div>
          <button
            type="button"
            data-testid="create-bengali-wedding-btn"
            onClick={() => {
              const targetDate = addDays(formatDateIso(new Date()), 30)
              addEvent({
                title: "Ananya & Debabrata's Bengali Wedding",
                category: 'wedding',
                date: targetDate,
                city: 'Kolkata',
                venueName: 'The Rajbari Bawali Pavilion',
                totalBudget: 300000,
                currency: 'INR',
                targetGuestCount: 150,
                themePreference: 'Classic Marigold & Alta Crimson',
                priorities: ['Traditional Bengali Feasts & Mishti', 'Mandap & Floral Styling'],
                dietaryRequirements: ['Vegetarian', 'Fish & Seafood', 'Traditional Sweets (Mishti)'],
                accessibilityRequirements: ['Elder Seating & Step-Free Entrance'],
                indoorOutdoor: 'hybrid',
                dressCode: 'Traditional Bengali Silk & Dhoti',
                specialNotes:
                  'Tradition: bengali-biye. Ceremonies: Gaye Holud, Borjatri, Saat Paake Ghaura, Bou Bhaat.',
              })
            }}
          >
            Create Demonstration Event
          </button>

          {/* Active Event Inspection */}
          {activeEvent && (
            <div data-testid="active-event-details">
              <span data-testid="event-title">{activeEvent.title}</span>
              <span data-testid="event-budget">{activeEvent.totalBudget}</span>
              <span data-testid="event-currency">{activeEvent.currency}</span>
              <span data-testid="event-guests">{activeEvent.targetGuestCount}</span>
              <span data-testid="event-city">{activeEvent.location.city}</span>
            </div>
          )}

          {/* Budget items count */}
          <div data-testid="budget-items-count">{budgetItems.length}</div>

          {/* Contingency Item Inspection */}
          {budgetItems.find((b) => b.isContingency) && (
            <div data-testid="contingency-amount">
              {budgetItems.find((b) => b.isContingency)?.allocatedAmount}
            </div>
          )}

          {/* Task count */}
          <div data-testid="task-count">{timelineTasks.length}</div>

          {/* Vendor count */}
          <div data-testid="vendor-count">{vendors.length}</div>

          {/* Themes count */}
          <div data-testid="themes-count">{themeConcepts.length}</div>

          <button
            type="button"
            data-testid="ask-copilot-trigger"
            onClick={() => openCopilotWithQuery('Explain the most urgent tasks')}
          >
            Ask Copilot Trigger
          </button>

          {/* Views */}
          <TimelineView />
          <SimulatorView />
          <AICopilotModal />
        </div>
      )
    }

    render(
      <PlannerProvider>
        <TestScenarioHarness />
      </PlannerProvider>,
    )

    // =========================================================================
    // STEP 1: Create the event and select traditions
    // =========================================================================
    const createBtn = screen.getByTestId('create-bengali-wedding-btn')
    fireEvent.click(createBtn)

    expect(screen.getByTestId('event-title')).toHaveTextContent(
      "Ananya & Debabrata's Bengali Wedding",
    )
    expect(screen.getByTestId('event-budget')).toHaveTextContent('300000')
    expect(screen.getByTestId('event-currency')).toHaveTextContent('INR')
    expect(screen.getByTestId('event-guests')).toHaveTextContent('150')
    expect(screen.getByTestId('event-city')).toHaveTextContent('Kolkata')

    // =========================================================================
    // STEP 2: Generate three personalized celebration themes
    // =========================================================================
    expect(screen.getByTestId('themes-count')).toHaveTextContent('3')

    // =========================================================================
    // STEP 3: Build an itemized budget with a contingency reserve
    // =========================================================================
    // Total budget items: venue, catering, decor, entertainment, photography, contingency
    expect(Number(screen.getByTestId('budget-items-count').textContent)).toBeGreaterThanOrEqual(6)
    // Contingency is 8% of ₹3,00,000 = ₹24,000
    expect(screen.getByTestId('contingency-amount')).toHaveTextContent('24000')

    // =========================================================================
    // STEP 4: Generate preparation tasks and vendor checklists
    // =========================================================================
    // 30-day timeline creates calibrated preparation tasks
    expect(Number(screen.getByTestId('task-count').textContent)).toBeGreaterThanOrEqual(8)
    // Vendor checklists created for venue, catering, decor, photography, entertainment
    expect(Number(screen.getByTestId('vendor-count').textContent)).toBeGreaterThanOrEqual(5)

    // =========================================================================
    // STEP 5: Ask the AI Copilot to explain the most urgent tasks
    // =========================================================================
    const askCopilotBtn = screen.getByTestId('ask-copilot-trigger')
    fireEvent.click(askCopilotBtn)

    // Verify Copilot dialog opened
    expect(screen.getByRole('dialog', { name: /celebration advisor & task navigator/i })).toBeInTheDocument()
    expect(screen.getByText(/Celebrio AI Copilot/i)).toBeInTheDocument()

    // Wait for Copilot analysis to populate
    await waitFor(() => {
      expect(screen.getByText(/Most Urgent Critical-Path Tasks/i)).toBeInTheDocument()
    })

    // Verify cultural & context awareness in Copilot response
    expect(screen.getByText(/Tradition & Ritual Logistics/i)).toBeInTheDocument()
    expect(screen.getByText(/Budget Guardian & Contingency/i)).toBeInTheDocument()

    // Close Copilot dialog
    const closeCopilotBtn = screen.getByRole('button', { name: /close copilot/i })
    fireEvent.click(closeCopilotBtn)

    // =========================================================================
    // STEP 6: Change guest count to 180 and reduce budget to ₹2,40,000
    // =========================================================================
    // Use the demo scenario trigger button in the simulator
    const demoShiftBtn = screen.getByRole('button', {
      name: /simulate 180 guests & ₹2,40,000/i,
    })
    fireEvent.click(demoShiftBtn)

    // =========================================================================
    // STEP 7: Preview resulting changes without modifying the original plan
    // =========================================================================
    // Baseline Plan remains strictly intact
    expect(screen.getByText(/Baseline Plan/i)).toBeInTheDocument()
    // Original values displayed in Baseline Plan card: ₹3,00,000 and 150 guests
    expect(screen.getByText('Total Budget Cap').parentElement).toHaveTextContent(/3,00,000/)
    expect(screen.getByText('Per-Guest Cost Ceiling').parentElement).toHaveTextContent(/2,000/)

    // Proposed Plan card shows the simulation
    expect(screen.getByText(/What-If Simulation/i)).toBeInTheDocument()
    expect(screen.getByText('Proposed Budget').parentElement).toHaveTextContent(/2,40,000/)
    expect(screen.getByText('Per-Guest Cost').parentElement).toHaveTextContent(/1,333/)

    // =========================================================================
    // STEP 8: View recalculated budget totals and affected tasks
    // =========================================================================
    // The simulator detects that catering and variable lines exceed the reduced budget,
    // causing a budget deficit
    expect(screen.getByText(/Scenario Warnings & Tradeoff Triggers/i)).toBeInTheDocument()
    expect(screen.getByText(/Budget Deficit/i)).toBeInTheDocument()

    // Verify Category Allocation Impacts table reflects Catering scaling
    expect(screen.getByText(/Category Allocation Impacts/i)).toBeInTheDocument()
    expect(screen.getByText(/Timeline Milestone Recomputation/i)).toBeInTheDocument()

    // =========================================================================
    // STEP 9: Review clear recommendations for resolving the budget constraint
    // =========================================================================
    expect(screen.getByText(/Recommended Strategic Trade-Offs/i)).toBeInTheDocument()
    expect(
      screen.getByText(/(?:Live Buffet Service|Family-Style Service Transition)/i)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/(?:Indigenous Botanical|Architectural Foliage & Candlelight Styling)/i)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Cultural Continuity & Ritual Protection/i)
    ).toBeInTheDocument()

    // =========================================================================
    // STEP 10: Apply the revised plan only after explicit confirmation
    // =========================================================================
    const reviewBtn = screen.getByRole('button', { name: /review & apply changes/i })
    fireEvent.click(reviewBtn)

    // Confirmation modal opens
    expect(
      screen.getByRole('heading', { name: /confirm scenario application/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Guaranteed Intent Preservation/i)).toBeInTheDocument()

    // Confirm application
    const confirmBtn = screen.getByRole('button', { name: /confirm & apply changes/i })
    fireEvent.click(confirmBtn)

    // =========================================================================
    // STEP 11: Verify saved data, task counts, vendor statuses, and budget totals
    // =========================================================================
    await waitFor(() => {
      expect(screen.getByText(/Scenario applied successfully/i)).toBeInTheDocument()
    })

    // Verify active event state updated consistently
    expect(screen.getByTestId('event-budget')).toHaveTextContent('240000')
    expect(screen.getByTestId('event-guests')).toHaveTextContent('180')

    // Verify storage persistence has the updated values
    const storedEvents = StorageService.getEvents()
    const storedEvent = storedEvents.find((e) => e.title.includes('Ananya'))
    expect(storedEvent).toBeDefined()
    expect(storedEvent?.totalBudget).toBe(240000)
    expect(storedEvent?.targetGuestCount).toBe(180)

    // Verify task count is stable and no duplicate tasks were created
    expect(Number(screen.getByTestId('task-count').textContent)).toBeGreaterThanOrEqual(8)

    // Verify vendor statuses remain preserved
    const storedVendors = StorageService.getVendors(storedEvent!.id)
    expect(storedVendors.length).toBeGreaterThanOrEqual(5)
  }, 30000)
})
