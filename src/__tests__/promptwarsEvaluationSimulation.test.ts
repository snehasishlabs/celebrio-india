import { describe, it, expect, beforeEach } from 'vitest'
import { CelebrationEvent } from '@/types/event'
import { BudgetItem } from '@/types/budget'
import { TimelineTask } from '@/types/timeline'
import { Vendor } from '@/types/vendor'
import { ScenarioInput } from '@/types/simulation'
import { simulateScenario } from '@/utils/scenarioEngine'
import { calculateBudgetSummary } from '@/utils/budgetGuardian'
import { addDays, formatDateIso } from '@/utils/timelineEngine'
import { validateAIAction } from '@/utils/aiActionValidator'
import { verifyEventOwnership, sanitizePii, sanitizeText } from '@/utils/security'
import { explainUrgentTasksWithGemini } from '../../server/geminiService'

describe('Celebrio India — Phase 5 Final PromptWars Evaluation Simulation', () => {
  let sampleEvent: CelebrationEvent
  let sampleBudgetItems: BudgetItem[]
  let sampleTasks: TimelineTask[]
  let sampleVendors: Vendor[]

  beforeEach(() => {
    const todayStr = formatDateIso(new Date())
    const targetDate = addDays(todayStr, 30)

    sampleEvent = {
      id: 'event-bengali-101',
      userId: 'user-kolkata-primary',
      title: "Ananya & Debabrata's Bengali Wedding",
      category: 'wedding',
      date: targetDate,
      location: {
        venueName: 'The Rajbari Bawali Pavilion',
        city: 'Kolkata',
        isIndoor: false,
        capacity: 165,
      },
      totalBudget: 300000,
      currency: 'INR',
      targetGuestCount: 150,
      confirmedGuestCount: 140,
      status: 'planning',
      syncState: 'in-sync',
      priorities: ['Traditional Bengali Feasts & Mishti', 'Mandap & Floral Styling'],
      dietaryRequirements: ['Vegetarian', 'Fish & Seafood', 'Traditional Sweets (Mishti)'],
      accessibilityRequirements: ['Elder Seating & Step-Free Entrance'],
      preferences: {
        indoorOutdoor: 'hybrid',
      },
      culturalPreferences: {
        traditionId: 'bengali-wedding',
        regionOrState: 'West Bengal',
        preferredLanguage: 'Bengali',
        ceremonyScheduleType: 'multi-day-3',
        selectedCeremonies: [
          'Gaye Holud (Turmeric Ceremony)',
          'Saat Paake Ghaura (Seven Circles of Mandap)',
          'Shubho Drishti (First Auspicious Glances)',
          'Sindoor Daan',
          'Bou Bhaat (Bridal Welcoming Banquet)',
        ],
        foodTradition: 'Traditional Bengali Royal Zamindari Feast',
        musicAndVibe: 'Rabindra Sangeet, Shehnai & Evening Baul Melodies',
        decorStyle: 'Alpana White, Crimson Silk & Fragrant Rajnigandha Canopies',
        auspiciousTimingPreference: 'Godhuli Lagna (Twilight Sunset)',
      },
      createdAt: todayStr,
      updatedAt: todayStr,
    }

    sampleBudgetItems = [
      {
        id: 'b-1',
        eventId: sampleEvent.id,
        category: 'catering',
        name: 'Authentic Bengali Royal Catering & Halwai',
        allocatedAmount: 96000, // 32%
        actualAmount: 96000,
        estimatedAmount: 96000,
        quotedAmount: 96000,
        confirmedAmount: 0,
        paidAmount: 20000,
        costStatus: 'quoted',
        paymentStatus: 'deposit-paid',
        isContingency: false,
      },
      {
        id: 'b-2',
        eventId: sampleEvent.id,
        category: 'venue',
        name: 'The Rajbari Bawali Pavilion & Grounds',
        allocatedAmount: 84000, // 28%
        actualAmount: 84000,
        estimatedAmount: 84000,
        quotedAmount: 84000,
        confirmedAmount: 84000,
        paidAmount: 40000,
        costStatus: 'confirmed',
        paymentStatus: 'deposit-paid',
        isContingency: false,
      },
      {
        id: 'b-3',
        eventId: sampleEvent.id,
        category: 'decor',
        name: 'Rajnigandha Floral Canopies & Earthen Diyas',
        allocatedAmount: 42000, // 14%
        actualAmount: 42000,
        estimatedAmount: 42000,
        quotedAmount: 42000,
        confirmedAmount: 0,
        paidAmount: 0,
        costStatus: 'estimated',
        paymentStatus: 'planned',
        isContingency: false,
      },
      {
        id: 'b-4',
        eventId: sampleEvent.id,
        category: 'photography',
        name: 'Heritage Cinema & Portrait Documentation',
        allocatedAmount: 24000, // 8%
        actualAmount: 24000,
        estimatedAmount: 24000,
        quotedAmount: 24000,
        confirmedAmount: 24000,
        paidAmount: 10000,
        costStatus: 'confirmed',
        paymentStatus: 'deposit-paid',
        isContingency: false,
      },
      {
        id: 'b-5',
        eventId: sampleEvent.id,
        category: 'invitations',
        name: 'Handcrafted Tattwa Trays & Digital RSVP Portal',
        allocatedAmount: 30000, // 10%
        actualAmount: 30000,
        estimatedAmount: 30000,
        quotedAmount: 30000,
        confirmedAmount: 0,
        paidAmount: 5000,
        costStatus: 'quoted',
        paymentStatus: 'deposit-paid',
        isContingency: false,
      },
      {
        id: 'b-6',
        eventId: sampleEvent.id,
        category: 'contingency',
        name: 'Protected Contingency Reserve (8%)',
        allocatedAmount: 24000, // 8%
        actualAmount: 24000,
        estimatedAmount: 24000,
        quotedAmount: 24000,
        confirmedAmount: 24000,
        paidAmount: 0,
        costStatus: 'confirmed',
        paymentStatus: 'planned',
        isContingency: true,
      },
    ]

    sampleTasks = [
      {
        id: 't-1',
        eventId: sampleEvent.id,
        title: 'Execute Heritage Banquet Contract & Load-In Window',
        targetDate: addDays(todayStr, 7),
        deadline: addDays(todayStr, 7),
        status: 'completed',
        priority: 'critical',
        phase: 'logistics-coordination',
        isMilestone: true,
        isCriticalPath: true,
        dependencyIds: [],
        category: 'venue',
      },
      {
        id: 't-2',
        eventId: sampleEvent.id,
        title: 'Approve Bengali Royal Culinary Menu & Fish Tasting',
        targetDate: addDays(todayStr, 14),
        deadline: addDays(todayStr, 14),
        status: 'todo',
        priority: 'high',
        phase: 'vendor-curation',
        isMilestone: true,
        isCriticalPath: true,
        dependencyIds: ['t-1'],
        category: 'catering',
      },
      {
        id: 't-3',
        eventId: sampleEvent.id,
        title: 'Stage Gaye Holud Yellow Canopies & Alpana Floors',
        targetDate: addDays(todayStr, 28),
        deadline: addDays(todayStr, 28),
        status: 'todo',
        priority: 'high',
        phase: 'rehearsal-prep',
        isMilestone: true,
        isCriticalPath: false,
        dependencyIds: ['t-2'],
        category: 'decor',
      },
    ]

    sampleVendors = [
      {
        id: 'v-1',
        eventId: sampleEvent.id,
        name: 'The Rajbari Bawali Pavilion',
        service: 'venue',
        phone: '+91 98300 12345',
        email: 'events@rajbaribawali.com',
        estimatedCost: 84000,
        quotedCost: 84000,
        finalCost: 84000,
        depositAmount: 40000,
        depositPaid: true,
        contractStatus: 'contract-signed',
        notes: 'Deposit paid. Guaranteed morning load-in window from 6:00 AM.',
      },
      {
        id: 'v-2',
        eventId: sampleEvent.id,
        name: 'Babu Halwai & Royal Kolkata Caterers',
        service: 'catering',
        phone: '+91 98311 54321',
        email: 'catering@babuhalwai.com',
        estimatedCost: 96000,
        quotedCost: 96000,
        finalCost: 96000,
        depositAmount: 20000,
        depositPaid: true,
        contractStatus: 'quote-received',
        notes: 'Menu proposal in review. Includes live Chhena Rosogolla counter.',
      },
      {
        id: 'v-3',
        eventId: sampleEvent.id,
        name: 'Kolkata Heritage Photographers Guild',
        service: 'photography',
        phone: '+91 98322 99887',
        email: 'studio@kolkataphotos.com',
        estimatedCost: 24000,
        quotedCost: 24000,
        finalCost: 24000,
        depositAmount: 10000,
        depositPaid: true,
        contractStatus: 'contract-signed',
        notes: 'Full ceremony coverage locked.',
      },
    ]
  })

  // =========================================================================
  // SCENARIO A: Indian Wedding Planning
  // =========================================================================
  describe('Scenario A: Indian Wedding Planning', () => {
    it('creates an internally consistent Bengali wedding celebration plan', () => {
      expect(sampleEvent.title).toBe("Ananya & Debabrata's Bengali Wedding")
      expect(sampleEvent.location.city).toBe('Kolkata')
      expect(sampleEvent.targetGuestCount).toBe(150)
      expect(sampleEvent.totalBudget).toBe(300000)
      expect(sampleEvent.culturalPreferences?.selectedCeremonies).toHaveLength(5)

      // Budget calculation consistency
      const summary = calculateBudgetSummary(sampleEvent.totalBudget, sampleBudgetItems)
      expect(summary.totalBudget).toBe(300000)
      expect(summary.plannedExpenditure).toBe(276000) // 300,000 - 24,000
      expect(summary.contingencyReserve).toBe(24000) // Exactly 8%
      expect(summary.isOverBudget).toBe(false)
      expect(summary.remainingBalance).toBe(0) // Perfectly balanced

      // Timeline task consistency
      expect(sampleTasks).toHaveLength(3)
      const criticalTasks = sampleTasks.filter((t) => t.isCriticalPath)
      expect(criticalTasks.length).toBeGreaterThanOrEqual(2)
    })
  })

  // =========================================================================
  // SCENARIO B: Budget Shock
  // =========================================================================
  describe('Scenario B: Budget Shock', () => {
    it('adapts gracefully to budget reduction from ₹3,00,000 to ₹2,40,000 while ring-fencing 8% contingency', () => {
      const scenarioInput: ScenarioInput = {
        totalBudget: 240000,
        guestCount: 150,
        eventDate: sampleEvent.date,
        venueType: 'hybrid',
      }

      const result = simulateScenario(sampleEvent, sampleBudgetItems, sampleTasks, sampleVendors, scenarioInput)

      // Verifies original plan was not mutated
      expect(sampleEvent.totalBudget).toBe(300000)

      // Verifies proposed budget
      expect(result.comparison.proposed.totalBudget).toBe(240000)
      expect(result.comparison.deltas.budgetDelta).toBe(-60000)

      // Verified 8% contingency reserve on new budget cap
      const expectedContingency = Math.round(240000 * 0.08) // 19,200
      expect(result.comparison.proposed.contingencyReserve).toBe(expectedContingency)

      // Confirmed decisions (such as signed venue contract of ₹84,000) are preserved
      expect(result.userConfirmedDecisionsPreserved).toBeGreaterThanOrEqual(2)

      // Explains trade-offs & compromises
      expect(result.tradeoffs.length).toBeGreaterThan(0)
      const cateringTradeoff = result.tradeoffs.find((t) => t.category.toLowerCase().includes('catering'))
      expect(cateringTradeoff).toBeDefined()
    })
  })

  // =========================================================================
  // SCENARIO C: Guest Count Increase
  // =========================================================================
  describe('Scenario C: Guest Count Increase', () => {
    it('detects venue capacity limits, scales catering expenses, and prescribes staffing logistics for 150 -> 180 guests', () => {
      const scenarioInput: ScenarioInput = {
        totalBudget: 300000,
        guestCount: 180, // +30 guests
        eventDate: sampleEvent.date,
        venueType: 'hybrid',
        venueCapacity: 165, // Certified capacity is 165
      }

      const result = simulateScenario(sampleEvent, sampleBudgetItems, sampleTasks, sampleVendors, scenarioInput)

      // Detects venue capacity limit reached
      expect(result.hasCriticalWarnings).toBe(true)
      const capacityWarning = result.infeasibilityReasons.find((r) => r.toLowerCase().includes('venue capacity'))
      expect(capacityWarning).toBeDefined()
      expect(capacityWarning).toContain('180')
      expect(capacityWarning).toContain('165')

      // Recalculates variable catering allocation
      const cateringImpact = result.affectedCategories.find((c) => c.category === 'catering')
      expect(cateringImpact).toBeDefined()
      expect(cateringImpact!.proposedAllocation).toBeGreaterThan(cateringImpact!.originalAllocation)

      // Prescribes dual buffet and banquet staffing logistics trade-offs
      const staffingTradeoff = result.tradeoffs.find((t) => t.id === 'to-staffing-logistics')
      expect(staffingTradeoff).toBeDefined()
      expect(staffingTradeoff!.title).toContain('Banquet Staffing')
    })
  })

  // =========================================================================
  // SCENARIO D: Date and Venue Change
  // =========================================================================
  describe('Scenario D: Date and Venue Change', () => {
    it('shifts timeline deadlines, marks locked vendor uncertainty, and preserves original plan until approval', () => {
      const todayStr = formatDateIso(new Date())
      const newAcceleratedDate = addDays(todayStr, 14) // 16 days earlier!

      const scenarioInput: ScenarioInput = {
        totalBudget: 300000,
        guestCount: 150,
        eventDate: newAcceleratedDate,
        venueType: 'indoor',
        venueName: 'Kolkata Grand Heritage Ballroom',
      }

      const result = simulateScenario(sampleEvent, sampleBudgetItems, sampleTasks, sampleVendors, scenarioInput)

      // Original event is completely unmutated
      expect(sampleEvent.date).not.toBe(newAcceleratedDate)
      expect(sampleEvent.location.venueName).toBe('The Rajbari Bawali Pavilion')

      // Relocation notice triggered
      const relocationWarning = result.infeasibilityReasons.find((r) => r.toLowerCase().includes('venue relocation'))
      expect(relocationWarning).toBeDefined()
      expect(relocationWarning).toContain('Kolkata Grand Heritage Ballroom')

      // Locked vendor availability uncertainty flagged
      const lockedVendors = result.affectedVendors.filter((v) => v.isContractLocked)
      expect(lockedVendors.length).toBeGreaterThan(0)
      const uncertainVendor = lockedVendors.find((v) => v.uncertaintyFlag)
      expect(uncertainVendor).toBeDefined()
      expect(uncertainVendor?.actionAdvice).toContain('Direct confirmation required')
    })
  })

  // =========================================================================
  // SCENARIO E: AI Copilot Natural Language Stress Test
  // =========================================================================
  describe('Scenario E: AI Copilot Natural Language Stress Test', () => {
    it('accurately answers all 6 PromptWars natural language queries with context-aware facts', async () => {
      // 1. "Plan my celebration within ₹2 lakh."
      const res1 = await explainUrgentTasksWithGemini({
        eventId: sampleEvent.id,
        eventTitle: sampleEvent.title,
        category: 'wedding',
        city: 'Kolkata',
        targetGuestCount: 150,
        totalBudget: 300000,
        currency: 'INR',
        query: 'Plan my celebration within ₹2 lakh.',
      })
      expect(res1.headline).toContain('2,00,000')
      expect(res1.proposedAction).toBeDefined()
      expect(res1.proposedAction?.actionType).toBe('UPDATE_BUDGET')
      expect(res1.proposedAction?.payload.totalBudget).toBe(200000)

      // 2. "What are my five most urgent tasks?"
      const res2 = await explainUrgentTasksWithGemini({
        eventId: sampleEvent.id,
        eventTitle: sampleEvent.title,
        category: 'wedding',
        city: 'Kolkata',
        targetGuestCount: 150,
        totalBudget: 300000,
        currency: 'INR',
        query: 'What are my five most urgent tasks?',
        urgentTasks: [
          { id: '1', title: 'Task 1', deadline: '2026-11-05', priority: 'critical', phase: 'logistics', status: 'todo', isCriticalPath: true },
          { id: '2', title: 'Task 2', deadline: '2026-11-06', priority: 'high', phase: 'logistics', status: 'todo', isCriticalPath: true },
          { id: '3', title: 'Task 3', deadline: '2026-11-07', priority: 'high', phase: 'vendor', status: 'todo', isCriticalPath: false },
          { id: '4', title: 'Task 4', deadline: '2026-11-08', priority: 'medium', phase: 'vendor', status: 'todo', isCriticalPath: false },
          { id: '5', title: 'Task 5', deadline: '2026-11-09', priority: 'medium', phase: 'vendor', status: 'todo', isCriticalPath: false },
        ],
      })
      expect(res2.urgentTaskAnalyses.length).toBe(5)

      // 3. "Suggest affordable Bengali food options."
      const res3 = await explainUrgentTasksWithGemini({
        eventId: sampleEvent.id,
        eventTitle: sampleEvent.title,
        category: 'wedding',
        city: 'Kolkata',
        targetGuestCount: 150,
        totalBudget: 300000,
        currency: 'INR',
        query: 'Suggest affordable Bengali food options.',
      })
      expect(res3.headline).toContain('Affordable Authentic Bengali Celebration Feast')
      expect(res3.traditionAdvisories.some((a) => a.includes('Gondhoraj') || a.includes('Rosogolla') || a.includes('Lucchi'))).toBe(true)

      // 4. "Reduce decoration costs without compromising the overall theme."
      const res4 = await explainUrgentTasksWithGemini({
        eventId: sampleEvent.id,
        eventTitle: sampleEvent.title,
        category: 'wedding',
        city: 'Kolkata',
        targetGuestCount: 150,
        totalBudget: 300000,
        currency: 'INR',
        query: 'Reduce decoration costs without compromising the overall theme.',
      })
      expect(res4.headline).toContain('Indigenous Botanical')
      expect(res4.strategicSummary).toContain('Rajnigandha')

      // 5. "What happens if 50 more guests attend?"
      const res5 = await explainUrgentTasksWithGemini({
        eventId: sampleEvent.id,
        eventTitle: sampleEvent.title,
        category: 'wedding',
        city: 'Kolkata',
        targetGuestCount: 150,
        totalBudget: 300000,
        currency: 'INR',
        query: 'What happens if 50 more guests attend?',
      })
      expect(res5.headline).toContain('+50 Guests')
      expect(res5.headline).toContain('200 Total Headcount')
      expect(res5.proposedAction?.actionType).toBe('CREATE_WHAT_IF_SCENARIO')
      expect(res5.proposedAction?.payload.guestCount).toBe(200)

      // 6. "Explain why my budget is exceeding the limit."
      const res6 = await explainUrgentTasksWithGemini({
        eventId: sampleEvent.id,
        eventTitle: sampleEvent.title,
        category: 'wedding',
        city: 'Kolkata',
        targetGuestCount: 150,
        totalBudget: 300000,
        currency: 'INR',
        query: 'Explain why my budget is exceeding the limit.',
        budgetItems: [
          { category: 'catering', allocatedAmount: 180000, costStatus: 'quoted' },
          { category: 'venue', allocatedAmount: 120000, costStatus: 'confirmed' },
          { category: 'decor', allocatedAmount: 50000, costStatus: 'estimated' },
        ],
      })
      expect(res6.headline).toContain('Budget Variance Diagnostic')
      expect(res6.strategicSummary).toContain('exceeds the authorized budget limit')
    })
  })

  // =========================================================================
  // SCENARIO F: Invalid and Adversarial Inputs
  // =========================================================================
  describe('Scenario F: Invalid and Adversarial Inputs', () => {
    it('safely rejects negative budget, zero guests, extreme guests, invalid dates, and unauthorized operations', () => {
      // 1. Negative budget
      const negBudgetValidation = validateAIAction({
        id: 'action-neg',
        actionType: 'UPDATE_BUDGET',
        title: 'Negative Budget Action',
        explanation: 'Attack attempt',
        impactSummary: 'None',
        requiresConfirmation: true,
        validationStatus: 'valid',
        payload: { totalBudget: -50000 },
      })
      expect(negBudgetValidation.isValid).toBe(false)
      expect(negBudgetValidation.errors.some((e) => e.includes('greater than zero'))).toBe(true)

      // 2. Zero guests
      const zeroGuestsValidation = validateAIAction({
        id: 'action-zero',
        actionType: 'UPDATE_GUEST_COUNT',
        title: 'Zero Guests',
        explanation: 'Invalid headcount',
        impactSummary: 'None',
        requiresConfirmation: true,
        validationStatus: 'valid',
        payload: { guestCount: 0 },
      })
      expect(zeroGuestsValidation.isValid).toBe(false)
      expect(zeroGuestsValidation.errors.some((e) => e.includes('between 1 and 50,000'))).toBe(true)

      // 3. Extreme guests (>50,000)
      const extremeGuestsValidation = validateAIAction({
        id: 'action-extreme',
        actionType: 'UPDATE_GUEST_COUNT',
        title: 'Extreme Guests',
        explanation: 'Overflow headcount',
        impactSummary: 'None',
        requiresConfirmation: true,
        validationStatus: 'valid',
        payload: { guestCount: 100000 },
      })
      expect(extremeGuestsValidation.isValid).toBe(false)

      // 4. Invalid date format
      const invalidDateValidation = validateAIAction({
        id: 'action-date',
        actionType: 'UPDATE_TIMELINE',
        title: 'Invalid Date',
        explanation: 'Corrupt date',
        impactSummary: 'None',
        requiresConfirmation: true,
        validationStatus: 'valid',
        payload: { eventDate: '2026-99-99' },
      })
      expect(invalidDateValidation.isValid).toBe(false)
      expect(invalidDateValidation.errors.some((e) => e.includes('valid YYYY-MM-DD'))).toBe(true)

      // 5. Missing required title
      const missingTitleValidation = validateAIAction({
        id: 'action-missing-title',
        actionType: 'CREATE_EVENT',
        title: 'Create Event with Empty Title',
        explanation: 'Missing title',
        impactSummary: 'None',
        requiresConfirmation: true,
        validationStatus: 'valid',
        payload: { title: '', totalBudget: 200000, targetGuestCount: 100 },
      })
      expect(missingTitleValidation.isValid).toBe(false)
      expect(missingTitleValidation.errors.some((e) => e.includes('Event title is required'))).toBe(true)

      // 6. Object-Level Authorization (BOLA defense)
      const isOwner = verifyEventOwnership(sampleEvent, 'user-kolkata-primary')
      const isAttacker = verifyEventOwnership(sampleEvent, 'user-rogue-tenant-999')
      expect(isOwner).toBe(true)
      expect(isAttacker).toBe(false)

      // 7. Input sanitization (XSS and PII)
      const maliciousScript = '<script>alert("XSS")</script>Welcome'
      expect(sanitizeText(maliciousScript)).not.toContain('<script>')
      expect(sanitizePii('+91 98300 12345')).toBe('+91 98*** **345')
      expect(sanitizePii('celebration@celebrio.in')).toBe('ce***@celebrio.in')
    })
  })
})

