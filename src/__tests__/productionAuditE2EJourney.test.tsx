import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PlannerProvider, usePlanner } from '@/context/PlannerContext'
import { StorageService } from '@/services/storage/storageService'
import { addDays, formatDateIso } from '@/utils/timelineEngine'
import { DashboardView } from '@/features/dashboard/DashboardView'
import { BudgetView } from '@/features/budget/BudgetView'
import { TimelineView } from '@/features/timeline/TimelineView'
import { SimulatorView } from '@/features/simulator/SimulatorView'
import { AICopilotModal } from '@/features/copilot/AICopilotModal'

describe('Celebrio India — Production Audit 14-Step Complete Journey E2E', () => {
  beforeEach(() => {
    localStorage.clear()
    StorageService.resetAllData()
  })

  it('completes the entire celebration lifecycle from creation through What-If replanning', async () => {
    const JourneyTestHarness = () => {
      const {
        activeEvent,
        addEvent,
        addBudgetItem,
        addTimelineTask,
        budgetItems,
        timelineTasks,
        vendors,
        guests,
        openCopilotWithQuery,
      } = usePlanner()

      return (
        <div>
          {/* Step 1 & 2 & 3 & 4: Action to initialize celebration */}
          <button
            type="button"
            data-testid="create-journey-event-btn"
            onClick={() => {
              const eventDate = addDays(formatDateIso(new Date()), 45)
              addEvent({
                title: 'Aarav & Meera Punjabi Wedding',
                category: 'wedding',
                date: eventDate,
                city: 'Amritsar',
                venueName: 'Heritage Haveli & Courtyard',
                totalBudget: 400000,
                currency: 'INR',
                targetGuestCount: 200,
                themePreference: 'Phulkari Heritage & Marigold Splendor',
                priorities: ['Langar & Banquet Feast', 'Live Dhol & Jaggo', 'Mandap Architecture'],
                dietaryRequirements: ['Vegetarian Specialties', 'Traditional Punjabi Sweets (Pinni, Jalebi)'],
                accessibilityRequirements: ['Senior Ground Floor Seating'],
                indoorOutdoor: 'hybrid',
                dressCode: 'Traditional Punjabi Silk Kurta & Lehenga',
                specialNotes: 'Tradition: punjabi-wedding. Ceremonies: Roka, Mehendi & Jaggo, Anand Karaj, Reception.',
                culturalPreferences: {
                  traditionId: 'punjabi-wedding',
                  preferredLanguage: 'Punjabi',
                  ceremonyScheduleType: 'multi-day-3',
                  selectedCeremonies: ['Roka', 'Mehendi & Jaggo', 'Anand Karaj', 'Grand Reception'],
                },
              })
            }}
          >
            Create Punjabi Wedding
          </button>

          {/* Action to add extra expense */}
          <button
            type="button"
            data-testid="add-journey-expense-btn"
            onClick={() => {
              addBudgetItem({
                category: 'catering',
                name: 'Live Tandoor & Amritsari Kulcha Counter',
                allocatedAmount: 35000,
                actualAmount: 35000,
                estimatedAmount: 35000,
                quotedAmount: 35000,
                confirmedAmount: 0,
                paidAmount: 0,
                costStatus: 'estimated',
                paymentStatus: 'planned',
                notes: 'Authentic clay tandoor with fresh chur-chur kulchas and dal makhani',
              })
            }}
          >
            Add Culinary Expense
          </button>

          {/* Action to add extra task */}
          <button
            type="button"
            data-testid="add-journey-task-btn"
            onClick={() => {
              addTimelineTask({
                title: 'Procure Decorated Jaggo Pots & Brass Diyas',
                targetDate: addDays(formatDateIso(new Date()), 35),
                deadline: addDays(formatDateIso(new Date()), 35),
                status: 'todo',
                priority: 'high',
                phase: 'vendor-curation',
                isMilestone: true,
                isCriticalPath: false,
                dependencyIds: [],
                category: 'decor',
                description: 'Lightweight battery-operated diyas embedded in brass vessels for evening dance procession',
              })
            }}
          >
            Add Jaggo Task
          </button>

          {/* Action to trigger AI Copilot */}
          <button
            type="button"
            data-testid="trigger-copilot-btn"
            onClick={() => openCopilotWithQuery('What are my most urgent pending tasks?')}
          >
            Open Copilot
          </button>

          {/* Inspection state displays */}
          {activeEvent && (
            <div data-testid="active-celebration-state">
              <span data-testid="display-title">{activeEvent.title}</span>
              <span data-testid="display-city">{activeEvent.location.city}</span>
              <span data-testid="display-budget">{activeEvent.totalBudget}</span>
              <span data-testid="display-guests">{activeEvent.targetGuestCount}</span>
            </div>
          )}

          <div data-testid="display-budget-count">{budgetItems.length}</div>
          <div data-testid="display-tasks-count">{timelineTasks.length}</div>
          <div data-testid="display-vendors-count">{vendors.length}</div>
          <div data-testid="display-guests-count">{guests.length}</div>

          {/* Subviews */}
          <DashboardView />
          <BudgetView />
          <TimelineView />
          <SimulatorView />
          <AICopilotModal />
        </div>
      )
    }

    render(
      <PlannerProvider>
        <JourneyTestHarness />
      </PlannerProvider>,
    )

    // =========================================================================
    // STEP 1-5: Create Indian Celebration with Preferences & Generate Plan
    // =========================================================================
    const createBtn = screen.getByTestId('create-journey-event-btn')
    fireEvent.click(createBtn)

    expect(screen.getByTestId('display-title')).toHaveTextContent('Aarav & Meera Punjabi Wedding')
    expect(screen.getByTestId('display-city')).toHaveTextContent('Amritsar')
    expect(screen.getByTestId('display-budget')).toHaveTextContent('400000')
    expect(screen.getByTestId('display-guests')).toHaveTextContent('200')

    // Initial plan generated with budget, timeline, and vendors
    const initialBudgetCount = Number(screen.getByTestId('display-budget-count').textContent)
    const initialTaskCount = Number(screen.getByTestId('display-tasks-count').textContent)
    expect(initialBudgetCount).toBeGreaterThan(0)
    expect(initialTaskCount).toBeGreaterThan(0)

    // =========================================================================
    // STEP 6: Review Dashboard & Budget Metrics
    // =========================================================================
    expect(screen.getAllByText(/total budget cap/i)[0]).toBeInTheDocument()
    expect(screen.getAllByText(/contingency reserve/i)[0]).toBeInTheDocument()

    // =========================================================================
    // STEP 7: Add Custom Expense
    // =========================================================================
    const addExpenseBtn = screen.getByTestId('add-journey-expense-btn')
    fireEvent.click(addExpenseBtn)

    expect(Number(screen.getByTestId('display-budget-count').textContent)).toBe(initialBudgetCount + 1)
    expect(screen.getAllByText('Live Tandoor & Amritsari Kulcha Counter')[0]).toBeInTheDocument()

    // =========================================================================
    // STEP 8: Create Timeline Tasks
    // =========================================================================
    const addTaskBtn = screen.getByTestId('add-journey-task-btn')
    fireEvent.click(addTaskBtn)

    expect(Number(screen.getByTestId('display-tasks-count').textContent)).toBe(initialTaskCount + 1)
    expect(screen.getAllByText('Procure Decorated Jaggo Pots & Brass Diyas')[0]).toBeInTheDocument()

    // =========================================================================
    // STEP 9: Open AI Copilot & Query Urgent Milestones
    // =========================================================================
    const copilotBtn = screen.getByTestId('trigger-copilot-btn')
    fireEvent.click(copilotBtn)

    await waitFor(() => {
      expect(screen.getByText(/celebrio ai copilot/i)).toBeInTheDocument()
    })

    // Close Copilot modal
    const closeCopilotBtn = screen.getByRole('button', { name: /close copilot/i })
    fireEvent.click(closeCopilotBtn)

    // =========================================================================
    // STEP 10-12: Create What-If Scenario, Change Budget/Guests & Preview Ripples
    // =========================================================================
    const budgetInput = screen.getByLabelText(/total budget/i)
    const guestInput = screen.getByLabelText(/target guest count/i)

    // Adjust budget to ₹3,20,000 and guests to 240
    fireEvent.change(budgetInput, { target: { value: '320000' } })
    fireEvent.change(guestInput, { target: { value: '240' } })

    // Verify side-by-side delta preview is rendered
    expect(screen.getByText(/side-by-side impact analysis/i)).toBeInTheDocument()
    expect(screen.getByText(/category allocation impacts/i)).toBeInTheDocument()

    // =========================================================================
    // STEP 13: Confirm and Apply the What-If Scenario
    // =========================================================================
    const reviewAndApplyBtn = screen.getByRole('button', {
      name: /review & apply changes/i,
    })
    expect(reviewAndApplyBtn).not.toBeDisabled()
    fireEvent.click(reviewAndApplyBtn)

    // Confirmation dialog opens
    const confirmModalTitle = screen.getByText(/confirm scenario application/i)
    expect(confirmModalTitle).toBeInTheDocument()

    const confirmApplyBtn = screen.getByRole('button', {
      name: /confirm & apply changes/i,
    })
    fireEvent.click(confirmApplyBtn)

    // =========================================================================
    // STEP 14: Verify Updated Plan is Correctly Applied and Stored
    // =========================================================================
    await waitFor(() => {
      expect(screen.getByTestId('display-budget')).toHaveTextContent('320000')
      expect(screen.getByTestId('display-guests')).toHaveTextContent('240')
    })

    // Verify persistence in StorageService
    const storedEvents = StorageService.getEvents()
    const punjabiEvent = storedEvents.find((e) => e.title.includes('Aarav & Meera'))
    expect(punjabiEvent).toBeDefined()
    expect(punjabiEvent?.totalBudget).toBe(320000)
    expect(punjabiEvent?.targetGuestCount).toBe(240)
  }, 25000)
})
