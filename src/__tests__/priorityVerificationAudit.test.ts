import { describe, it, expect } from 'vitest'
import { simulateScenario } from '@/utils/scenarioEngine'
import { calculateBudgetSummary, sanitizeAmount, formatIndianLakhsCrores } from '@/utils/budgetGuardian'
import { explainUrgentTasksWithGemini } from '../../server/geminiService'
import { verifyEventOwnership, sanitizePii, sanitizeText } from '@/utils/security'
import { StorageService } from '@/services/storage/storageService'
import { CelebrationEvent } from '@/types/event'
import { BudgetItem, BudgetCategory } from '@/types/budget'
import { TimelineTask } from '@/types/timeline'
import { Vendor } from '@/types/vendor'
import { ScenarioInput } from '@/types/simulation'

function createTestBudgetItem(
  id: string,
  eventId: string,
  name: string,
  category: BudgetCategory,
  allocatedAmount: number,
  costStatus: 'estimated' | 'quoted' | 'confirmed' = 'estimated',
  isContingency = false,
): BudgetItem {
  return {
    id,
    eventId,
    name,
    category,
    allocatedAmount,
    actualAmount: allocatedAmount,
    estimatedAmount: allocatedAmount,
    quotedAmount: allocatedAmount,
    confirmedAmount: costStatus === 'confirmed' ? allocatedAmount : 0,
    paidAmount: 0,
    paymentStatus: 'planned',
    costStatus,
    isContingency,
  }
}

describe('Priority 1: What-If Changes Actually Update the Correct Event Data', () => {
  const baseEvent: CelebrationEvent = {
    id: 'ev-priority-1',
    title: 'Ananya & Debashis Bengali Wedding',
    category: 'wedding',
    date: '2026-12-15',
    targetGuestCount: 150,
    confirmedGuestCount: 120,
    totalBudget: 300000,
    currency: 'INR',
    status: 'planning',
    priorities: ['catering', 'decor'],
    dietaryRequirements: ['bengali-traditional'],
    accessibilityRequirements: [],
    preferences: { indoorOutdoor: 'indoor', specialNotes: '' },
    location: {
      venueName: 'Sovabazar Rajbari Heritage Courtyard',
      city: 'Kolkata',
      capacity: 160,
    },
    culturalPreferences: {
      regionOrState: 'bengali',
      selectedCeremonies: ['Aashirbaad', 'Gaye Holud', 'Saat Paake Ghaura', 'Bou Bhaat'],
    },
    syncState: 'in-sync',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: 'user-kolkata-ananya',
  }

  const baseBudgetItems: BudgetItem[] = [
    createTestBudgetItem('b-venue', 'ev-priority-1', 'Heritage Courtyard Rental', 'venue', 84000, 'confirmed'),
    createTestBudgetItem('b-cat-main', 'ev-priority-1', 'Main Bengali Feast', 'catering', 76000, 'estimated'),
    createTestBudgetItem('b-cat-sweets', 'ev-priority-1', 'Artisanal Mishti Counter', 'catering', 20000, 'estimated'),
    createTestBudgetItem('b-decor', 'ev-priority-1', 'Traditional Mandap Florals', 'decor', 40000, 'estimated'),
    createTestBudgetItem('b-photo', 'ev-priority-1', 'Cinema & Candid Photography', 'photography', 24000, 'confirmed'),
    createTestBudgetItem('b-music', 'ev-priority-1', 'Shehnai & Baul Musicians', 'entertainment', 24000, 'quoted'),
    createTestBudgetItem('b-contingency', 'ev-priority-1', 'Contingency Reserve (8%)', 'contingency', 24000, 'confirmed', true),
    createTestBudgetItem('b-misc', 'ev-priority-1', 'Pooja Samagri & Sundries', 'miscellaneous', 8000, 'estimated'),
  ]

  const baseTasks: TimelineTask[] = [
    {
      id: 't-1',
      eventId: 'ev-priority-1',
      title: 'Disburse Rajbari Venue Advance',
      category: 'venue',
      deadline: '2026-11-20',
      targetDate: '2026-11-20',
      status: 'completed',
      priority: 'critical',
      isMilestone: true,
      isCriticalPath: true,
      dependencyIds: [],
      phase: 'concept-planning',
    },
    {
      id: 't-2',
      eventId: 'ev-priority-1',
      title: 'Finalize Mishti & Kosha Mangsho Menu',
      category: 'catering',
      deadline: '2026-12-01',
      targetDate: '2026-12-01',
      status: 'todo',
      priority: 'high',
      isMilestone: false,
      isCriticalPath: false,
      dependencyIds: [],
      phase: 'vendor-curation',
    },
  ]

  const baseVendors: Vendor[] = [
    {
      id: 'v-1',
      eventId: 'ev-priority-1',
      name: 'Rajbari Hospitality Group',
      service: 'venue',
      contractStatus: 'contract-signed',
      quotedCost: 84000,
      depositAmount: 42000,
      depositPaid: true,
    },
  ]

  it('1.1: Simulates budget shock to ₹2,40,000 without corrupting locked items and preserves 8% contingency', () => {
    const input: ScenarioInput = {
      totalBudget: 240000,
      guestCount: 150,
      eventDate: '2026-12-15',
      venueType: 'indoor',
    }

    const sim = simulateScenario(baseEvent, baseBudgetItems, baseTasks, baseVendors, input)

    expect(sim.simulatedBudgetItems).toBeDefined()
    const simulatedItems = sim.simulatedBudgetItems!

    // Locked items strictly preserved
    const venueItem = simulatedItems.find((b) => b.id === 'b-venue')!
    expect(venueItem.allocatedAmount).toBe(84000)

    const photoItem = simulatedItems.find((b) => b.id === 'b-photo')!
    expect(photoItem.allocatedAmount).toBe(24000)

    // Contingency dynamically recalculated to 8% of proposed budget (₹19,200)
    const contingency = simulatedItems.find((b) => b.isContingency)!
    expect(contingency.allocatedAmount).toBe(19200)
    expect(sim.comparison.proposed.contingencyReserve).toBe(19200)

    // User decisions preserved count
    expect(sim.userConfirmedDecisionsPreserved).toBeGreaterThanOrEqual(4)
  })

  it('1.2: Proportional category adjustment distributes correctly across multiple items in the same category', () => {
    const input: ScenarioInput = {
      totalBudget: 320000,
      guestCount: 150,
      eventDate: '2026-12-15',
      venueType: 'indoor',
      categoryAdjustments: {
        catering: 120000,
      },
    }

    const sim = simulateScenario(baseEvent, baseBudgetItems, baseTasks, baseVendors, input)
    const simulatedItems = sim.simulatedBudgetItems!

    const mainItem = simulatedItems.find((b) => b.id === 'b-cat-main')!
    const sweetsItem = simulatedItems.find((b) => b.id === 'b-cat-sweets')!

    // Proportion: main = 76/96 (79.167%), sweets = 20/96 (20.833%)
    expect(mainItem.allocatedAmount).toBe(95000)
    expect(sweetsItem.allocatedAmount).toBe(25000)

    // Sum equals exactly 120,000 (never duplicated into 240,000!)
    expect(mainItem.allocatedAmount + sweetsItem.allocatedAmount).toBe(120000)
  })

  it('1.3: Guest surge from 150 to 180 triggers certified venue capacity warning and banquet logistics', () => {
    const input: ScenarioInput = {
      totalBudget: 330000,
      guestCount: 180,
      eventDate: '2026-12-15',
      venueType: 'indoor',
    }

    const sim = simulateScenario(baseEvent, baseBudgetItems, baseTasks, baseVendors, input)

    // Capacity is 160; 180 guests exceeds by 20
    expect(sim.venueCapacityWarning).toBeDefined()
    expect(sim.venueCapacityWarning).toContain('Venue Capacity Exceeded')
    expect(sim.venueCapacityWarning).toContain('180 guests exceeds certified facility limit (160)')

    // Indian hospitality logistics trade-offs
    const dualBuffet = sim.tradeoffs.find((t) => t.id === 'to-staffing-logistics')
    expect(dualBuffet).toBeDefined()
    expect(dualBuffet?.title).toContain('Banquet Staffing & Dual Buffet Deployment')
  })

  it('1.4: Event isolation: updating one celebration does not corrupt another celebration in StorageService', () => {
    const eventAId = 'ev-test-isolation-A'
    const eventBId = 'ev-test-isolation-B'

    const itemsA: BudgetItem[] = [
      createTestBudgetItem('b-a1', eventAId, 'Item A', 'venue', 50000, 'confirmed'),
    ]
    const itemsB: BudgetItem[] = [
      createTestBudgetItem('b-b1', eventBId, 'Item B', 'catering', 70000, 'estimated'),
    ]

    StorageService.saveBudgetItemsForEvent(eventAId, itemsA)
    StorageService.saveBudgetItemsForEvent(eventBId, itemsB)

    const retrievedA = StorageService.getBudgetItems(eventAId)
    const retrievedB = StorageService.getBudgetItems(eventBId)

    expect(retrievedA.length).toBe(1)
    expect(retrievedA[0].id).toBe('b-a1')
    expect(retrievedB.length).toBe(1)
    expect(retrievedB[0].id).toBe('b-b1')

    // Modifying Event A must NOT wipe Event B
    StorageService.saveBudgetItemsForEvent(eventAId, [
      ...itemsA,
      createTestBudgetItem('b-a2', eventAId, 'Item A2', 'decor', 20000, 'quoted'),
    ])

    const updatedA = StorageService.getBudgetItems(eventAId)
    const stillB = StorageService.getBudgetItems(eventBId)

    expect(updatedA.length).toBe(2)
    expect(stillB.length).toBe(1)
    expect(stillB[0].id).toBe('b-b1')
  })
})

describe('Priority 2: Budget Calculations are Mathematically Correct', () => {
  it('2.1: Calculates budget summary with exact Rupee precision and non-duplicative contingency', () => {
    const totalBudget = 300000
    const items: BudgetItem[] = [
      createTestBudgetItem('1', 'ev-1', 'Venue', 'venue', 100000, 'confirmed'),
      createTestBudgetItem('2', 'ev-1', 'Catering', 'catering', 120000, 'estimated'),
      createTestBudgetItem('3', 'ev-1', 'Decor', 'decor', 56000, 'quoted'),
      createTestBudgetItem('4', 'ev-1', 'Contingency', 'contingency', 24000, 'confirmed', true),
    ]

    const summary = calculateBudgetSummary(totalBudget, items)

    // Planned expenditure excludes contingency: 100k + 120k + 56k = 276k
    expect(summary.plannedExpenditure).toBe(276000)
    // Contingency reserve: 24k
    expect(summary.contingencyReserve).toBe(24000)
    // Total committed: 276k + 24k = 300k
    expect(summary.plannedExpenditure + summary.contingencyReserve).toBe(300000)
    // Remaining balance: 300k - 300k = 0
    expect(summary.remainingBalance).toBe(0)
    // Difference from spending limit: 300k - 276k = 24k
    expect(summary.differenceFromLimit).toBe(24000)
    expect(summary.isOverBudget).toBe(false)
    expect(summary.allocationPercentage).toBe(100)
  })

  it('2.2: Flags budget deficit correctly when committed costs exceed total ceiling', () => {
    const totalBudget = 240000
    const items: BudgetItem[] = [
      createTestBudgetItem('1', 'ev-1', 'Venue', 'venue', 100000, 'confirmed'),
      createTestBudgetItem('2', 'ev-1', 'Catering', 'catering', 120000, 'estimated'),
      createTestBudgetItem('3', 'ev-1', 'Decor', 'decor', 56000, 'quoted'),
      createTestBudgetItem('4', 'ev-1', 'Contingency', 'contingency', 19200, 'confirmed', true),
    ]

    const summary = calculateBudgetSummary(totalBudget, items)

    // Total required: 276k + 19.2k = 295,200
    // Deficit: 240,000 - 295,200 = -55,200
    expect(summary.isOverBudget).toBe(true)
    expect(summary.remainingBalance).toBe(-55200)
    expect(summary.overBudgetAmount).toBe(55200)
  })

  it('2.3: Gracefully handles negative numbers, strings with currency symbols, and extreme bounds', () => {
    expect(sanitizeAmount(-5000)).toBe(0)
    expect(sanitizeAmount(-5000, true)).toBe(-5000)
    expect(sanitizeAmount('₹3,00,000')).toBe(300000)
    expect(sanitizeAmount('$1,234.56')).toBe(1234.56)
    expect(sanitizeAmount(null)).toBe(0)
    expect(sanitizeAmount(undefined)).toBe(0)
    expect(sanitizeAmount(NaN)).toBe(0)
    expect(sanitizeAmount(Infinity)).toBe(0)
    expect(sanitizeAmount(99999999999999)).toBe(10000000000) // Upper clamp
  })

  it('2.4: Formats currency in Indian Lakhs/Crores accurately', () => {
    expect(formatIndianLakhsCrores(300000)).toBe('₹3 Lakhs')
    expect(formatIndianLakhsCrores(240000)).toBe('₹2.40 Lakhs')
    expect(formatIndianLakhsCrores(15000000)).toBe('₹1.50 Cr')
    expect(formatIndianLakhsCrores(50000)).toBe('₹50,000')
  })
})

describe('Priority 3: AI Recommendations Use Real Event Context', () => {
  it('3.1: Incorporates Bengali traditions, Kolkata city context, and 8% contingency in Copilot output', async () => {
    const response = await explainUrgentTasksWithGemini({
      eventId: 'ev-priority-1',
      eventTitle: 'Ananya & Debashis Bengali Wedding',
      category: 'wedding',
      city: 'Kolkata',
      totalBudget: 300000,
      currency: 'INR',
      targetGuestCount: 150,
      traditions: ['Aashirbaad', 'Gaye Holud', 'Saat Paake Ghaura', 'Bou Bhaat'],
      urgentTasks: [
        { id: 't-venue', title: 'Book Sovabazar Rajbari Heritage Courtyard', priority: 'critical', status: 'todo', isCriticalPath: true, phase: 'concept-planning' },
        { id: 't-catering', title: 'Lock Bengali Feast Menu & Halwai', priority: 'high', status: 'todo', isCriticalPath: false, phase: 'vendor-curation' },
      ],
      query: 'What are my most urgent pending tasks?',
    })

    expect(response.headline).toContain('Ananya & Debashis Bengali Wedding')
    expect(response.strategicSummary).toContain('150 guests')
    expect(response.strategicSummary).toContain('Kolkata')
    expect(response.strategicSummary).toContain('₹3,00,000')

    // Verifies cultural context in tasks
    const venueTask = response.urgentTaskAnalyses.find((t) => t.taskTitle.includes('Rajbari'))
    expect(venueTask).toBeDefined()
    expect(venueTask?.whyItMatters).toContain('Kolkata')
    expect(venueTask?.culturalContext).toContain('Gaye Holud')

    // Verifies 8% contingency reserve advice (₹24,000)
    expect(response.budgetGuidance).toContain('₹24,000')
    expect(response.budgetGuidance).toContain('8%')
  })

  it('3.2: Suggests affordable Bengali cuisine options when asked for budget food', async () => {
    const response = await explainUrgentTasksWithGemini({
      eventId: 'ev-bengali-menu',
      eventTitle: 'Ananya Wedding',
      category: 'wedding',
      city: 'Kolkata',
      totalBudget: 300000,
      currency: 'INR',
      targetGuestCount: 150,
      query: 'Suggest affordable Bengali food options',
    })

    expect(response.headline).toContain('Affordable Authentic Bengali Celebration Feast')
    const menuContent = response.traditionAdvisories.join(' ')
    expect(menuContent).toContain('Postor Bora')
    expect(menuContent).toContain('Rui Machher Kalia')
    expect(menuContent).toContain('Lucchi')
    expect(menuContent).toContain('Rosogolla')
  })

  it('3.3: Accurately produces itemized ₹2 Lakh budget plan with UPDATE_BUDGET action proposal', async () => {
    const response = await explainUrgentTasksWithGemini({
      eventId: 'ev-budget-2l',
      eventTitle: 'Budget Wedding',
      category: 'wedding',
      city: 'Kolkata',
      totalBudget: 300000,
      currency: 'INR',
      targetGuestCount: 150,
      query: 'Plan my celebration within ₹2 lakh',
    })

    expect(response.proposedAction).toBeDefined()
    expect(response.proposedAction?.actionType).toBe('UPDATE_BUDGET')
    expect(response.proposedAction?.payload.totalBudget).toBe(200000)
    expect(response.proposedAction?.payload.contingencyReserve).toBe(16000) // 8% of 2L
  })
})

describe('Priority 4: Authentication and Event Ownership are Enforced', () => {
  const ownedEvent: CelebrationEvent = {
    id: 'ev-auth-test',
    title: 'Pooja & Rohan Wedding',
    category: 'wedding',
    date: '2026-11-20',
    targetGuestCount: 200,
    confirmedGuestCount: 180,
    totalBudget: 500000,
    currency: 'INR',
    status: 'planning',
    priorities: ['venue'],
    dietaryRequirements: ['pure-veg'],
    accessibilityRequirements: [],
    preferences: { indoorOutdoor: 'indoor', specialNotes: '' },
    location: { venueName: 'City Banquet Hall', city: 'Mumbai' },
    syncState: 'in-sync',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: 'user_owner_pooja',
  }

  it('4.1: Authorizes legitimate event owner and denies unauthorized cross-tenant actor', () => {
    expect(verifyEventOwnership(ownedEvent, 'user_owner_pooja')).toBe(true)
    expect(verifyEventOwnership(ownedEvent, 'user_hacker_mallory')).toBe(false)
    expect(verifyEventOwnership(ownedEvent, 'user_another_tenant')).toBe(false)
  })

  it('4.2: Handles legacy unowned events gracefully without crashing', () => {
    const legacyEvent = { ...ownedEvent, userId: undefined }
    expect(verifyEventOwnership(legacyEvent, 'any_user')).toBe(true)
    expect(verifyEventOwnership(null, 'any_user')).toBe(false)
    expect(verifyEventOwnership(undefined, 'any_user')).toBe(false)
  })

  it('4.3: Automatically detects and masks PII for phones and emails', () => {
    expect(sanitizePii('+91 98765 43210')).toBe('+91 98*** **210')
    expect(sanitizePii('contact@celebrio.in')).toBe('co***@celebrio.in')
    expect(sanitizePii('debashis.ghosh@weddingmail.com')).toBe('de***@weddingmail.com')
  })

  it('4.4: Neutralizes adversarial XSS script injections in user inputs', () => {
    const malicious = '<script>alert("XSS")</script>Traditional Bengali Sweets'
    const sanitized = sanitizeText(malicious)
    expect(sanitized).not.toContain('<script>')
    expect(sanitized).toContain('&lt;script&gt;')
    expect(sanitized).toContain('Traditional Bengali Sweets')
  })
})
