import { describe, it, expect, beforeEach } from 'vitest'
import {
  calculateBudgetSummary,
  detectMissingExpenseCategories,
  compareEstimatedVsQuoted,
} from '@/utils/budgetGuardian'
import {
  simulateScenario,
} from '@/utils/scenarioEngine'
import {
  detectScheduleConflicts,
  recalculateScheduleForDateShift,
  generatePreparationTasks,
} from '@/utils/timelineEngine'
import { generateEventRecommendations } from '@/utils/recommendationEngine'
import { validateAIAction } from '@/utils/aiActionValidator'
import {
  INDIAN_EVENT_TEMPLATES,
  getIndianTemplateById,
} from '@/constants/indianEventTemplates'
import { explainUrgentTasksWithGemini } from '../../server/geminiService'
import { CelebrationEvent } from '@/types/event'
import { BudgetItem } from '@/types/budget'
import { TimelineTask } from '@/types/timeline'
import { Vendor } from '@/types/vendor'
import { AIActionProposal } from '@/types/ai'

describe('Celebrio India — Phase 3: Advanced AI Intelligence Upgrade', () => {
  let baseEvent: CelebrationEvent
  let baseBudgetItems: BudgetItem[]
  let baseTasks: TimelineTask[]
  let baseVendors: Vendor[]

  beforeEach(() => {
    baseEvent = {
      id: 'event-kolkata-bengali-1',
      title: "Ananya & Debabrata's Bengali Wedding",
      category: 'wedding',
      date: '2026-12-15',
      location: {
        venueName: 'Rajbari Heritage Courtyard',
        city: 'Kolkata',
        address: 'Baghbazar, Kolkata, West Bengal',
        isIndoor: false,
      },
      totalBudget: 300000,
      currency: 'INR',
      targetGuestCount: 150,
      confirmedGuestCount: 150,
      status: 'planning',
      syncState: 'in-sync',
      priorities: ['Catering & Feast', 'Sacred Mandap', 'Cinematic Photography'],
      dietaryRequirements: ['Fish & Meat specialties', 'Pure Veg counter'],
      accessibilityRequirements: [],
      preferences: {
        indoorOutdoor: 'hybrid',
        musicVibe: 'Classical Shehnai & Rabindra Sangeet',
        dressCode: 'Traditional Bengali Festive',
      },
      themePreference: 'Rajbari Heritage Grandeur',
      culturalPreferences: {
        traditionId: 'bengali-wedding',
        regionOrState: 'West Bengal',
        preferredLanguage: 'Bengali',
        ceremonyScheduleType: 'multi-day-3',
        selectedCeremonies: [
          'Aiburobhat',
          'Gaye Holud',
          'Saat Paake Ghaura & Sindoor Daan',
          'Bou Bhaat',
        ],
        auspiciousTimingPreference: 'Godhuli Lagna (Twilight Sunset)',
        foodTradition: 'Bengali Traditional Royal Feast',
        musicAndVibe: 'Live Shehnai, Rabindra Sangeet & Dhak',
        decorStyle: 'Alpana, Brass Urlis & Fresh Rajnigandha',
        isReligiousOrCultural: true,
      },
      createdAt: '2026-10-25T10:00:00Z',
      updatedAt: '2026-10-25T10:00:00Z',
    }

    baseBudgetItems = [
      {
        id: 'b-venue',
        eventId: baseEvent.id,
        category: 'venue',
        name: 'Heritage Courtyard Rental',
        estimatedAmount: 84000,
        quotedAmount: 84000,
        confirmedAmount: 84000,
        allocatedAmount: 84000,
        actualAmount: 84000,
        paidAmount: 20000,
        costStatus: 'confirmed',
        paymentStatus: 'deposit-paid',
        isContingency: false,
      },
      {
        id: 'b-catering',
        eventId: baseEvent.id,
        category: 'catering',
        name: 'Traditional Bengali Royal Feast (150 guests)',
        estimatedAmount: 96000,
        quotedAmount: 96000,
        confirmedAmount: 0,
        allocatedAmount: 96000,
        actualAmount: 96000,
        paidAmount: 0,
        costStatus: 'estimated',
        paymentStatus: 'planned',
        isContingency: false,
      },
      {
        id: 'b-decor',
        eventId: baseEvent.id,
        category: 'decor',
        name: 'Mandap Floral Architecture & Brass Urli',
        estimatedAmount: 42000,
        quotedAmount: 42000,
        confirmedAmount: 0,
        allocatedAmount: 42000,
        actualAmount: 42000,
        paidAmount: 0,
        costStatus: 'estimated',
        paymentStatus: 'planned',
        isContingency: false,
      },
      {
        id: 'b-photo',
        eventId: baseEvent.id,
        category: 'photography',
        name: 'Cinematic Cinema & Ritual Photography',
        estimatedAmount: 24000,
        quotedAmount: 24000,
        confirmedAmount: 0,
        allocatedAmount: 24000,
        actualAmount: 24000,
        paidAmount: 0,
        costStatus: 'estimated',
        paymentStatus: 'planned',
        isContingency: false,
      },
      {
        id: 'b-contingency',
        eventId: baseEvent.id,
        category: 'contingency',
        name: 'Contingency Reserve (8%)',
        estimatedAmount: 24000,
        quotedAmount: 24000,
        confirmedAmount: 24000,
        allocatedAmount: 24000,
        actualAmount: 24000,
        paidAmount: 0,
        costStatus: 'confirmed',
        paymentStatus: 'planned',
        isContingency: true,
      },
    ]

    baseTasks = [
      {
        id: 't-1',
        eventId: baseEvent.id,
        phase: 'concept-planning',
        title: 'Lock Venue & Disburse Booking Token',
        targetDate: '2026-11-01',
        deadline: '2026-11-01',
        status: 'completed',
        priority: 'critical',
        isMilestone: true,
        isCriticalPath: true,
        dependencyIds: [],
      },
      {
        id: 't-2',
        eventId: baseEvent.id,
        phase: 'vendor-curation',
        title: 'Approve Bengali Royal Catering Menu',
        targetDate: '2026-11-15',
        deadline: '2026-11-15',
        status: 'todo',
        priority: 'high',
        isMilestone: true,
        isCriticalPath: true,
        dependencyIds: ['t-1'],
      },
      {
        id: 't-3',
        eventId: baseEvent.id,
        phase: 'day-of-execution',
        title: 'Gaye Holud Morning Ritual',
        targetDate: '2026-12-14',
        deadline: '2026-12-14',
        startTime: '10:00',
        durationMinutes: 180,
        status: 'todo',
        priority: 'critical',
        isMilestone: true,
        isCriticalPath: true,
        dependencyIds: ['t-2'],
      },
    ]

    baseVendors = [
      {
        id: 'v-1',
        eventId: baseEvent.id,
        name: 'Rajbari Heritage Estates',
        service: 'venue',
        contactName: 'Mr. Mukherjee',
        phone: '+91 98300 12345',
        email: 'events@rajbari.in',
        quotedCost: 84000,
        finalCost: 84000,
        depositAmount: 20000,
        depositPaid: true,
        contractStatus: 'contract-signed',
        notes: 'Deposit paid.',
        paymentMilestones: [],
      },
    ]
  })

  // =========================================================================
  // 1. BUDGET GUARDIAN INTELLIGENCE
  // =========================================================================
  describe('1. Budget Guardian Intelligence', () => {
    it('calculates deterministic budget totals and protects 8% contingency in INR', () => {
      const summary = calculateBudgetSummary(baseEvent.totalBudget, baseBudgetItems)
      expect(summary.totalBudget).toBe(300000)
      expect(summary.contingencyReserve).toBe(24000)
      expect(summary.plannedExpenditure).toBe(246000)
      expect(summary.remainingBalance).toBe(30000)
      expect(summary.isOverBudget).toBe(false)
    })

    it('detects missing essential celebration expense categories', () => {
      // Omit photography and contingency
      const incompleteItems = baseBudgetItems.filter(
        (b) => b.category !== 'photography' && b.category !== 'contingency',
      )
      const { missingCategories } = detectMissingExpenseCategories(incompleteItems, 'wedding')
      const missingIds = missingCategories.map((c) => c.id)

      expect(missingIds).toContain('photography')
      expect(missingIds).toContain('contingency')
    })

    it('compares estimated costs with actual quotations and detects drift', () => {
      const itemsWithQuotes: BudgetItem[] = [
        ...baseBudgetItems,
        {
          id: 'b-decor-quote',
          eventId: baseEvent.id,
          category: 'decor',
          name: 'Floral Decor Formal Quotation',
          estimatedAmount: 40000,
          quotedAmount: 52000,
          confirmedAmount: 0,
          allocatedAmount: 40000,
          actualAmount: 52000,
          paidAmount: 0,
          costStatus: 'quoted',
          paymentStatus: 'planned',
          isContingency: false,
        },
      ]

      const comparison = compareEstimatedVsQuoted(itemsWithQuotes)
      expect(comparison.quotedTotal).toBe(52000)
      expect(comparison.driftingItems.length).toBeGreaterThan(0)
      expect(comparison.driftingItems[0].variance).toBe(12000)
    })
  })

  // =========================================================================
  // 2. GUEST COUNT CHANGES & VENUE CAPACITY
  // =========================================================================
  describe('2. Guest Count Changes & Venue Capacity', () => {
    it('scales variable costs while preserving fixed costs and confirmed decisions', () => {
      const result = simulateScenario(
        baseEvent,
        baseBudgetItems,
        baseTasks,
        baseVendors,
        {
          totalBudget: 350000,
          guestCount: 200, // +50 guests
          eventDate: '2026-12-15',
          venueType: 'hybrid',
        },
      )

      expect(result.comparison.deltas.guestCountDelta).toBe(50)
      expect(result.userConfirmedDecisionsPreserved).toBeGreaterThanOrEqual(2)

      // Catering scales up with guest ratio
      const cateringImpact = result.affectedCategories.find((c) => c.category === 'catering')
      expect(cateringImpact).toBeDefined()
      expect(cateringImpact!.proposedAllocation).toBeGreaterThan(cateringImpact!.originalAllocation)

      // Venue is confirmed; stays protected
      const venueVendor = result.affectedVendors.find((v) => v.service === 'venue')
      expect(venueVendor?.isContractLocked).toBe(true)
    })

    it('detects venue capacity over-subscription when guests exceed venue limit', () => {
      const result = simulateScenario(
        baseEvent,
        baseBudgetItems,
        baseTasks,
        baseVendors,
        {
          totalBudget: 300000,
          guestCount: 220,
          eventDate: '2026-12-15',
          venueType: 'indoor',
          venueCapacity: 160, // 220 guests > 160 capacity
        },
      )

      expect(result.hasCriticalWarnings).toBe(true)
      expect(result.venueCapacityWarning).toBeDefined()
      expect(result.venueCapacityWarning).toContain('Venue Capacity Exceeded')
      expect(result.infeasibilityReasons.some((r) => r.includes('Venue Capacity'))).toBe(true)
    })
  })

  // =========================================================================
  // 3. BUDGET REDUCTION SCENARIOS & TRADE-OFFS
  // =========================================================================
  describe('3. Budget Reduction Scenarios & Trade-Offs', () => {
    it('absorbs budget reductions through service style adjustments while protecting cultural ceremonies', () => {
      // Overallocate items to force deficit
      const highItems: BudgetItem[] = [
        ...baseBudgetItems,
        {
          id: 'b-high-catering',
          eventId: baseEvent.id,
          category: 'catering',
          name: 'Plated Luxury Dinner',
          estimatedAmount: 180000,
          quotedAmount: 180000,
          confirmedAmount: 0,
          allocatedAmount: 180000,
          actualAmount: 180000,
          paidAmount: 0,
          costStatus: 'estimated',
          paymentStatus: 'planned',
          isContingency: false,
        },
      ]

      const result = simulateScenario(
        baseEvent,
        highItems,
        baseTasks,
        baseVendors,
        {
          totalBudget: 240000, // reduced from 300k
          guestCount: 150,
          eventDate: '2026-12-15',
          venueType: 'indoor',
        },
      )

      expect(result.comparison.deltas.budgetDelta).toBe(-60000)
      expect(result.tradeoffs.length).toBeGreaterThanOrEqual(2)

      // Verifies cultural continuity trade-off protection
      const ritualProtection = result.tradeoffs.find((t) => t.id === 'to-cultural-continuity')
      expect(ritualProtection).toBeDefined()
      expect(ritualProtection?.title).toContain('Cultural Continuity')
    })
  })

  // =========================================================================
  // 4. INTELLIGENT TIMELINE ENGINE & CONFLICTS
  // =========================================================================
  describe('4. Intelligent Timeline Engine & Conflict Detection', () => {
    it('detects dependency order violations in timeline', () => {
      const conflictedTasks: TimelineTask[] = [
        {
          id: 'task-a',
          eventId: baseEvent.id,
          phase: 'concept-planning',
          title: 'Prerequisite Task',
          targetDate: '2026-11-20',
          deadline: '2026-11-20',
          status: 'todo',
          priority: 'critical',
          isMilestone: true,
          isCriticalPath: true,
          dependencyIds: [],
        },
        {
          id: 'task-b',
          eventId: baseEvent.id,
          phase: 'day-of-execution',
          title: 'Dependent Task Scheduled Early',
          targetDate: '2026-11-10', // Before task-a!
          deadline: '2026-11-10',
          status: 'todo',
          priority: 'critical',
          isMilestone: true,
          isCriticalPath: true,
          dependencyIds: ['task-a'],
        },
      ]

      const conflicts = detectScheduleConflicts(conflictedTasks)
      const depViolation = conflicts.find((c) => c.conflictType === 'dependency-violation')
      expect(depViolation).toBeDefined()
      expect(depViolation?.description).toContain('scheduled for 2026-11-10')
    })

    it('detects same-day time slot overlap between ceremonies without buffer', () => {
      const overlappingTasks: TimelineTask[] = [
        {
          id: 'task-gaye-holud',
          eventId: baseEvent.id,
          phase: 'day-of-execution',
          title: 'Gaye Holud Ceremony',
          targetDate: '2026-12-14',
          deadline: '2026-12-14',
          startTime: '10:00',
          durationMinutes: 180, // 10:00 AM to 1:00 PM
          status: 'todo',
          priority: 'critical',
          isMilestone: true,
          isCriticalPath: true,
          dependencyIds: [],
        },
        {
          id: 'task-lunch-feast',
          eventId: baseEvent.id,
          phase: 'day-of-execution',
          title: 'Celebratory Lunch Feast',
          targetDate: '2026-12-14',
          deadline: '2026-12-14',
          startTime: '12:00', // Overlaps with 10:00 - 13:00!
          durationMinutes: 120,
          status: 'todo',
          priority: 'high',
          isMilestone: true,
          isCriticalPath: false,
          dependencyIds: [],
        },
      ]

      const conflicts = detectScheduleConflicts(overlappingTasks)
      const overlapConflict = conflicts.find((c) => c.conflictType === 'overlap')
      expect(overlapConflict).toBeDefined()
      expect(overlapConflict?.description).toContain('Time conflict on 2026-12-14')
    })

    it('recalculates schedules dynamically when celebration date shifts', () => {
      const { updatedTasks, affectedTasksCount } = recalculateScheduleForDateShift(
        baseTasks,
        '2026-12-15',
        '2026-12-25', // +10 days
      )

      expect(affectedTasksCount).toBeGreaterThanOrEqual(1)

      // Completed task t-1 must preserve its completed status and original target
      const completedTask = updatedTasks.find((t) => t.id === 't-1')
      expect(completedTask?.status).toBe('completed')

      // Future task t-2 must shift forward by 10 days (from Nov 15 to Nov 25)
      const shiftedTask = updatedTasks.find((t) => t.id === 't-2')
      expect(shiftedTask?.targetDate).toBe('2026-11-25')
    })

    it('generates multi-day ceremony milestones based on cultural preferences', () => {
      const tasks = generatePreparationTasks(baseEvent)
      const ceremonyTasks = tasks.filter((t) => t.title.includes('Ceremony Run of Show'))
      expect(ceremonyTasks.length).toBeGreaterThanOrEqual(2)
    })
  })

  // =========================================================================
  // 5. CULTURAL PREFERENCE ENGINE (16 TEMPLATES)
  // =========================================================================
  describe('5. Cultural Preference Engine Across 16 Templates', () => {
    it('provides all 16 authentic Indian celebration templates', () => {
      expect(INDIAN_EVENT_TEMPLATES.length).toBeGreaterThanOrEqual(16)

      const ids = INDIAN_EVENT_TEMPLATES.map((t) => t.id)
      expect(ids).toContain('bengali-wedding')
      expect(ids).toContain('punjabi-wedding')
      expect(ids).toContain('south-indian-wedding')
      expect(ids).toContain('gujarati-wedding')
      expect(ids).toContain('maharashtrian-wedding')
      expect(ids).toContain('north-indian-wedding')
      expect(ids).toContain('durga-puja')
      expect(ids).toContain('diwali-gala')
      expect(ids).toContain('eid-gathering')
      expect(ids).toContain('onam-celebration')
      expect(ids).toContain('ganesh-chaturthi')
      expect(ids).toContain('holi-utsav')
      expect(ids).toContain('griha-pravesh')
      expect(ids).toContain('royal-engagement')
      expect(ids).toContain('jubilee-birthday')
      expect(ids).toContain('contemporary-fusion')
    })

    it('retrieves specific templates correctly via getIndianTemplateById', () => {
      const ganesh = getIndianTemplateById('ganesh-chaturthi')
      expect(ganesh.name).toContain('Ganesh Chaturthi')
      expect(ganesh.culturalPreferences.foodTradition).toContain('Modak')

      const holi = getIndianTemplateById('holi-utsav')
      expect(holi.name).toContain('Holi Milan')
      expect(holi.culturalPreferences.foodTradition).toContain('Thandai')

      const engagement = getIndianTemplateById('royal-engagement')
      expect(engagement.name).toContain('Royal Engagement')
    })
  })

  // =========================================================================
  // 6. PERSONALIZED AI RECOMMENDATION ENGINE
  // =========================================================================
  describe('6. Personalized AI Recommendation Engine', () => {
    it('generates personalized recommendations based on real event health', () => {
      // Event with low contingency (< 8%)
      const itemsWithoutContingency = baseBudgetItems.filter((b) => !b.isContingency)
      const { recommendations, alerts } = generateEventRecommendations(
        baseEvent,
        itemsWithoutContingency,
        baseTasks,
        baseVendors,
      )

      expect(recommendations.length).toBeGreaterThan(0)
      const contingencyRec = recommendations.find((r) => r.id === 'rec-contingency-low')
      expect(contingencyRec).toBeDefined()
      expect(contingencyRec?.issue).toContain('inadequate or missing contingency reserve')
      expect(contingencyRec?.whyItMatters).toBeDefined()
      expect(contingencyRec?.potentialImpact).toBeDefined()
      expect(contingencyRec?.suggestedAction).toBeDefined()

      expect(alerts.length).toBeGreaterThan(0)
    })
  })

  // =========================================================================
  // 7. STRUCTURED AI ARCHITECTURE & ACTION VALIDATION
  // =========================================================================
  describe('7. Structured AI Architecture & Action Validation', () => {
    it('validates valid structured AI action proposals successfully', () => {
      const validBudgetAction: AIActionProposal = {
        id: 'prop-1',
        actionType: 'UPDATE_BUDGET',
        title: 'Reduce Budget by ₹40,000',
        explanation: 'Transition to live buffet service while protecting all sacred rituals.',
        impactSummary: 'Reduces budget to ₹2,60,000 and ring-fences ₹20,800 contingency.',
        requiresConfirmation: true,
        validationStatus: 'valid',
        payload: {
          totalBudget: 260000,
          contingencyAmount: 20800,
        },
      }

      const result = validateAIAction(validBudgetAction, baseEvent)
      expect(result.isValid).toBe(true)
      expect(result.errors.length).toBe(0)
      expect(result.sanitizedProposal.validationStatus).toBe('valid')
    })

    it('strictly blocks invalid AI action proposals with descriptive business-rule errors', () => {
      const invalidAction: AIActionProposal = {
        id: 'prop-invalid',
        actionType: 'UPDATE_BUDGET',
        title: 'Negative Budget Hack',
        explanation: 'Attempting invalid negative budget.',
        impactSummary: 'Corrupts financial state.',
        requiresConfirmation: true,
        validationStatus: 'valid',
        payload: {
          totalBudget: -50000,
          contingencyAmount: 0,
        },
      }

      const result = validateAIAction(invalidAction, baseEvent)
      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.includes('greater than zero'))).toBe(true)
      expect(result.sanitizedProposal.validationStatus).toBe('invalid')
    })

    it('blocks event creation proposals missing required title or with invalid guest counts', () => {
      const badCreateAction: AIActionProposal = {
        id: 'prop-create-bad',
        actionType: 'CREATE_EVENT',
        title: '',
        explanation: 'Missing title',
        impactSummary: 'Fails',
        requiresConfirmation: true,
        validationStatus: 'valid',
        payload: {
          title: '   ',
          targetGuestCount: -10,
          totalBudget: 0,
        },
      }

      const result = validateAIAction(badCreateAction)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Event title is required.')
      expect(result.errors).toContain('Total budget must be a positive number in INR.')
      expect(result.errors).toContain('Target guest count must be between 1 and 50,000.')
    })
  })

  // =========================================================================
  // 8. NATURAL LANGUAGE COPILOT & DETERMINISTIC FALLBACK
  // =========================================================================
  describe('8. Natural Language Copilot & Deterministic Fallback', () => {
    it('understands "Plan a Bengali wedding for 150 guests in Kolkata" and returns structured proposal', async () => {
      const response = await explainUrgentTasksWithGemini({
        eventId: baseEvent.id,
        eventTitle: "Ananya's Celebration",
        category: 'wedding',
        city: 'Kolkata',
        targetGuestCount: 150,
        totalBudget: 300000,
        currency: 'INR',
        urgentTasks: [],
        query: 'Plan a Bengali wedding for 150 guests in Kolkata',
      })

      expect(response.headline).toContain('Bengali Wedding')
      expect(response.proposedAction).toBeDefined()
      expect(response.proposedAction?.actionType).toBe('CREATE_EVENT')
      expect(response.proposedAction?.payload.totalBudget).toBe(300000)
      expect(response.proposedAction?.payload.targetGuestCount).toBe(150)
    })

    it('understands "Reduce my budget by ₹40,000 without removing important functions"', async () => {
      const response = await explainUrgentTasksWithGemini({
        eventId: baseEvent.id,
        eventTitle: baseEvent.title,
        category: 'wedding',
        city: 'Kolkata',
        targetGuestCount: 150,
        totalBudget: 300000,
        currency: 'INR',
        urgentTasks: [],
        query: 'Reduce my budget by ₹40,000 without removing important functions',
      })

      expect(response.headline).toContain('Budget Optimization')
      expect(response.strategicSummary).toContain('40,000')
      expect(response.proposedAction).toBeDefined()
      expect(response.proposedAction?.actionType).toBe('UPDATE_BUDGET')
      expect(response.proposedAction?.payload.totalBudget).toBe(260000)
    })

    it('understands "Suggest vegetarian catering options" and provides authentic regional menu', async () => {
      const response = await explainUrgentTasksWithGemini({
        eventId: baseEvent.id,
        eventTitle: baseEvent.title,
        category: 'wedding',
        city: 'Kolkata',
        targetGuestCount: 150,
        totalBudget: 300000,
        currency: 'INR',
        urgentTasks: [],
        query: 'Suggest vegetarian catering options',
      })

      expect(response.headline).toContain('Vegetarian')
      expect(response.traditionAdvisories.some((t) => t.includes('Radhaballabhi') || t.includes('Basanti Pulao'))).toBe(true)
    })

    it('understands "What happens if 30 additional guests attend?" and generates what-if action', async () => {
      const response = await explainUrgentTasksWithGemini({
        eventId: baseEvent.id,
        eventTitle: baseEvent.title,
        category: 'wedding',
        city: 'Kolkata',
        targetGuestCount: 150,
        totalBudget: 300000,
        currency: 'INR',
        urgentTasks: [],
        query: 'What happens if 30 additional guests attend?',
      })

      expect(response.headline).toContain('+30 Guests')
      expect(response.proposedAction).toBeDefined()
      expect(response.proposedAction?.actionType).toBe('CREATE_WHAT_IF_SCENARIO')
      expect(response.proposedAction?.payload.guestCount).toBe(180)
    })
  })
})

