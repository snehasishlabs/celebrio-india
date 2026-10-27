import { describe, it, expect } from 'vitest'
import {
  calculatePerGuestCost,
  simulateScenario,
} from '../scenarioEngine'
import { CelebrationEvent } from '@/types/event'
import { BudgetItem } from '@/types/budget'
import { TimelineTask } from '@/types/timeline'
import { Vendor } from '@/types/vendor'
import { ScenarioInput } from '@/types/simulation'

describe('Scenario Engine - Adaptive What-If Planning & Replanning', () => {
  const refDate = new Date(2026, 9, 27) // Oct 27, 2026

  const baseEvent: CelebrationEvent = {
    id: 'ev-test',
    title: 'Autumn Conservatory Gala',
    category: 'wedding',
    date: '2026-11-20',
    location: { venueName: 'The Conservatory', city: 'San Francisco' },
    totalBudget: 50000,
    currency: 'USD',
    targetGuestCount: 100,
    confirmedGuestCount: 0,
    status: 'planning',
    syncState: 'in-sync',
    priorities: ['Catering', 'Floral'],
    dietaryRequirements: ['Vegetarian'],
    accessibilityRequirements: [],
    preferences: { indoorOutdoor: 'indoor' },
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
  }

  const baseBudgetItems: BudgetItem[] = [
    {
      id: 'b-venue',
      eventId: 'ev-test',
      category: 'venue',
      name: 'Conservatory Rental',
      costStatus: 'confirmed', // USER-CONFIRMED DECISION
      estimatedAmount: 15000,
      quotedAmount: 15000,
      confirmedAmount: 15000,
      allocatedAmount: 15000,
      actualAmount: 15000,
      paidAmount: 7500,
      paymentStatus: 'deposit-paid',
    },
    {
      id: 'b-catering',
      eventId: 'ev-test',
      category: 'catering',
      name: 'Plated Organic Dinner',
      costStatus: 'estimated', // Flexible estimate
      estimatedAmount: 16000,
      quotedAmount: 16000,
      confirmedAmount: 0,
      allocatedAmount: 16000,
      actualAmount: 16000,
      paidAmount: 0,
      paymentStatus: 'planned',
    },
    {
      id: 'b-contingency',
      eventId: 'ev-test',
      category: 'contingency',
      name: 'Contingency Reserve',
      costStatus: 'confirmed',
      estimatedAmount: 4000,
      quotedAmount: 4000,
      confirmedAmount: 4000,
      allocatedAmount: 4000,
      actualAmount: 0,
      paidAmount: 0,
      paymentStatus: 'planned',
      isContingency: true,
    },
  ]

  const baseTasks: TimelineTask[] = [
    {
      id: 'task-1',
      eventId: 'ev-test',
      phase: 'concept-planning',
      title: 'Lock Venue & Deposit',
      targetDate: '2026-10-15',
      status: 'completed', // USER-COMPLETED DECISION
      priority: 'critical',
      isMilestone: true,
      isCriticalPath: true,
      dependencyIds: [],
    },
    {
      id: 'task-2',
      eventId: 'ev-test',
      phase: 'logistics-coordination',
      title: 'Final Headcount Due to Catering',
      targetDate: '2026-11-06',
      status: 'todo',
      priority: 'critical',
      isMilestone: true,
      isCriticalPath: true,
      dependencyIds: ['task-1'],
    },
    {
      id: 'task-3',
      eventId: 'ev-test',
      phase: 'day-of-execution',
      title: 'Celebration Day',
      targetDate: '2026-11-20',
      status: 'todo',
      priority: 'critical',
      isMilestone: true,
      isCriticalPath: true,
      dependencyIds: ['task-2'],
    },
  ]

  const baseVendors: Vendor[] = [
    {
      id: 'v-venue',
      eventId: 'ev-test',
      name: 'The Royal Conservatory',
      service: 'venue',
      contractStatus: 'deposit-paid', // CONTRACT LOCKED
      quotedCost: 15000,
      finalCost: 15000,
      depositAmount: 7500,
      depositPaid: true,
    },
    {
      id: 'v-catering',
      eventId: 'ev-test',
      name: 'Heirloom Table',
      service: 'catering',
      contractStatus: 'researching', // PROSPECTING CANDIDATE
      quotedCost: 16000,
      depositAmount: 4000,
      depositPaid: false,
    },
  ]

  describe('calculatePerGuestCost', () => {
    it('calculates per-guest costs accurately', () => {
      expect(calculatePerGuestCost(50000, 100)).toBe(500)
    })

    it('recalculates per-guest cost when guest count increases', () => {
      // 50,000 / 125 guests = $400/guest
      expect(calculatePerGuestCost(50000, 125)).toBe(400)
    })

    it('handles edge case of zero or negative guest count safely', () => {
      expect(calculatePerGuestCost(50000, 0)).toBe(50000)
      expect(calculatePerGuestCost(50000, -10)).toBe(50000)
    })
  })

  describe('simulateScenario - Deterministic Replanning Engine', () => {
    it('increasing guest count recalculates per-guest costs and scales variable catering', () => {
      const scenarioInput: ScenarioInput = {
        totalBudget: 50000,
        guestCount: 150, // +50 guests (+50%)
        eventDate: '2026-11-20',
        venueType: 'indoor',
      }

      const result = simulateScenario(baseEvent, baseBudgetItems, baseTasks, baseVendors, scenarioInput, refDate)

      // Per guest cost dropped from 500 to 333
      expect(result.comparison.proposed.perGuestCost).toBe(333)
      expect(result.comparison.deltas.perGuestCostDelta).toBe(-167)
      expect(result.comparison.deltas.guestCountDelta).toBe(50)

      // Catering scales up
      const cateringImpact = result.affectedCategories.find((c) => c.category === 'catering')!
      expect(cateringImpact.proposedAllocation).toBeGreaterThan(cateringImpact.originalAllocation)
    })

    it('reducing the budget detects overspending and flags critical warnings', () => {
      const scenarioInput: ScenarioInput = {
        totalBudget: 30000, // Reduced from 50,000 to 30,000 (-40%)
        guestCount: 100,
        eventDate: '2026-11-20',
        venueType: 'indoor',
      }

      const result = simulateScenario(baseEvent, baseBudgetItems, baseTasks, baseVendors, scenarioInput, refDate)

      expect(result.comparison.proposed.remainingBalance).toBeLessThan(0)
      expect(result.hasCriticalWarnings).toBe(true)
      expect(result.infeasibilityReasons.some((r) => r.toLowerCase().includes('budget deficit'))).toBe(true)

      // Generates actionable tradeoffs to help resolve deficit
      expect(result.tradeoffs.length).toBeGreaterThan(0)
      expect(result.tradeoffs[0].impactType).toBe('savings')
    })

    it('moving the event date recalculates relevant deadlines and flags urgent tasks', () => {
      // Move event date 2 weeks earlier: Nov 20 -> Nov 06
      const scenarioInput: ScenarioInput = {
        totalBudget: 50000,
        guestCount: 100,
        eventDate: '2026-11-06',
        venueType: 'indoor',
      }

      const result = simulateScenario(baseEvent, baseBudgetItems, baseTasks, baseVendors, scenarioInput, refDate)

      expect(result.comparison.deltas.daysDelta).toBe(-14)

      // Celebration day deadline shifted to Nov 06
      const celebrationTask = result.affectedTasks.find((t) => t.title === 'Celebration Day')!
      expect(celebrationTask.proposedDeadline).toBe('2026-11-06')

      // Headcount deadline shifted from Nov 06 to Oct 23 (in the past relative to Oct 27)
      const headcountTask = result.affectedTasks.find((t) => t.title.includes('Headcount'))!
      expect(headcountTask.isInfeasible).toBe(true)
      expect(headcountTask.reason).toMatch(/falls in the past/i)
    })

    it('user-approved decisions and completed tasks are NOT silently overwritten', () => {
      const scenarioInput: ScenarioInput = {
        totalBudget: 25000, // Radical budget cut
        guestCount: 50,
        eventDate: '2026-11-10',
        venueType: 'indoor',
      }

      const result = simulateScenario(baseEvent, baseBudgetItems, baseTasks, baseVendors, scenarioInput, refDate)

      // Confirmed venue allocation is strictly preserved at 15,000
      const venueImpact = result.affectedCategories.find((c) => c.category === 'venue')!
      expect(venueImpact.originalAllocation).toBe(15000)
      expect(venueImpact.proposedAllocation).toBe(15000)

      // Completed task retains completed note and is not marked infeasible
      const completedTask = result.affectedTasks.find((t) => t.taskId === 'task-1')!
      expect(completedTask.reason).toMatch(/status preserved/i)
      expect(completedTask.isInfeasible).toBe(false)

      // Records preserved decisions count
      expect(result.userConfirmedDecisionsPreserved).toBeGreaterThanOrEqual(2)
    })

    it('flags vendor uncertainty when date moves for legally contracted suppliers', () => {
      const scenarioInput: ScenarioInput = {
        totalBudget: 50000,
        guestCount: 100,
        eventDate: '2026-12-15', // Date moved forward
        venueType: 'indoor',
      }

      const result = simulateScenario(baseEvent, baseBudgetItems, baseTasks, baseVendors, scenarioInput, refDate)

      const venueVendor = result.affectedVendors.find((v) => v.service === 'venue')!
      expect(venueVendor.uncertaintyFlag).toBe(true)
      expect(venueVendor.actionAdvice).toMatch(/direct confirmation required/i)

      // Inflexible candidate has uncertainty warning in infeasibilityReasons
      expect(result.infeasibilityReasons.some((r) => r.toLowerCase().includes('supplier availability'))).toBe(true)
    })
  })
})

