import { describe, it, expect } from 'vitest'
import {
  sanitizeAmount,
  formatCurrency,
  calculateBudgetSummary,
  generateCostSavingAlternatives,
  normalizeCategory,
} from '../budgetGuardian'
import { BudgetItem } from '@/types/budget'

describe('Budget Guardian - Deterministic Financial Math Engine', () => {
  describe('sanitizeAmount', () => {
    it('handles normal numbers and rounds to 2 decimal places', () => {
      expect(sanitizeAmount(100)).toBe(100)
      expect(sanitizeAmount(123.456)).toBe(123.46)
      // Floating point correction (0.1 + 0.2)
      expect(sanitizeAmount(0.1 + 0.2)).toBe(0.3)
    })

    it('parses formatted currency strings properly', () => {
      expect(sanitizeAmount('$1,250.50')).toBe(1250.5)
      expect(sanitizeAmount('€ 45,000')).toBe(45000)
      expect(sanitizeAmount('£ 800.75')).toBe(800.75)
    })

    it('safely handles null, undefined, NaN, and non-finite numbers', () => {
      expect(sanitizeAmount(null)).toBe(0)
      expect(sanitizeAmount(undefined)).toBe(0)
      expect(sanitizeAmount(NaN)).toBe(0)
      expect(sanitizeAmount(Infinity)).toBe(0)
      expect(sanitizeAmount(-Infinity)).toBe(0)
      expect(sanitizeAmount('not a number')).toBe(0)
    })

    it('handles negative values correctly', () => {
      // By default, negative is clamped to 0 for non-negative allocations
      expect(sanitizeAmount(-500)).toBe(0)
      // When allowNegative is true, preserves sign with rounding
      expect(sanitizeAmount(-500.556, true)).toBe(-500.56)
    })

    it('clamps absurdly large values to prevent overflow', () => {
      expect(sanitizeAmount(999_999_999_999)).toBe(10_000_000_000)
    })
  })

  describe('formatCurrency', () => {
    it('formats multiple currencies correctly', () => {
      expect(formatCurrency(5000, 'USD')).toMatch(/\$5,000/)
      expect(formatCurrency(5000, 'EUR')).toMatch(/€5,000/)
      expect(formatCurrency(5000, 'GBP')).toMatch(/£5,000/)
    })

    it('respects showCents parameter', () => {
      expect(formatCurrency(1250.5, 'USD', true)).toMatch(/\$1,250\.50/)
      expect(formatCurrency(1250.5, 'USD', false)).toMatch(/\$1,251|\$1,250/)
    })
  })

  describe('normalizeCategory', () => {
    it('normalizes legacy category slugs to canonical standards', () => {
      expect(normalizeCategory('catering-beverage')).toBe('catering')
      expect(normalizeCategory('decor-floral')).toBe('decor')
      expect(normalizeCategory('photography-media')).toBe('photography')
      expect(normalizeCategory('venue')).toBe('venue')
    })
  })

  describe('calculateBudgetSummary', () => {
    const mockItems: BudgetItem[] = [
      {
        id: '1',
        eventId: 'ev-1',
        category: 'venue',
        name: 'Venue Rental',
        costStatus: 'confirmed',
        estimatedAmount: 15000,
        quotedAmount: 15000,
        confirmedAmount: 15000,
        allocatedAmount: 15000,
        actualAmount: 15000,
        paidAmount: 7500,
        paymentStatus: 'deposit-paid',
      },
      {
        id: '2',
        eventId: 'ev-1',
        category: 'catering',
        name: 'Dinner Catering',
        costStatus: 'quoted',
        estimatedAmount: 18000,
        quotedAmount: 18000,
        confirmedAmount: 0,
        allocatedAmount: 18000,
        actualAmount: 18000,
        paidAmount: 5000,
        paymentStatus: 'deposit-paid',
      },
      {
        id: '3',
        eventId: 'ev-1',
        category: 'decor',
        name: 'Floral Styling',
        costStatus: 'estimated',
        estimatedAmount: 7000,
        quotedAmount: 7000,
        confirmedAmount: 0,
        allocatedAmount: 7000,
        actualAmount: 7000,
        paidAmount: 0,
        paymentStatus: 'planned',
      },
      {
        id: '4',
        eventId: 'ev-1',
        category: 'contingency',
        name: 'Contingency Reserve',
        costStatus: 'confirmed',
        estimatedAmount: 5000,
        quotedAmount: 5000,
        confirmedAmount: 5000,
        allocatedAmount: 5000,
        actualAmount: 0,
        paidAmount: 0,
        paymentStatus: 'planned',
        isContingency: true,
      },
    ]

    it('correctly calculates planned costs, contingency reserve, and remaining balance', () => {
      // Total = 50,000. Non-contingency = 15k + 18k + 7k = 40,000. Contingency = 5,000. Total Req = 45,000.
      const summary = calculateBudgetSummary(50000, mockItems)

      expect(summary.totalBudget).toBe(50000)
      expect(summary.plannedExpenditure).toBe(40000)
      expect(summary.contingencyReserve).toBe(5000)
      expect(summary.totalCommittedPlanned).toBe(45000)
      expect(summary.remainingBalance).toBe(5000) // 50,000 - 45,000
      expect(summary.differenceFromLimit).toBe(10000) // 50,000 - 40,000
      expect(summary.isOverBudget).toBe(false)
      expect(summary.overBudgetAmount).toBe(0)
    })

    it('ensures remaining balance does not double-count contingency', () => {
      const summary = calculateBudgetSummary(50000, mockItems)
      // Remaining must equal Total - (Planned + Contingency)
      expect(summary.remainingBalance).toBe(
        summary.totalBudget - (summary.plannedExpenditure + summary.contingencyReserve),
      )
    })

    it('computes category percentages relative to total budget', () => {
      const summary = calculateBudgetSummary(50000, mockItems)
      const venueSummary = summary.categories.find((c) => c.category === 'venue')!
      const cateringSummary = summary.categories.find((c) => c.category === 'catering')!

      // Venue is 15,000 / 50,000 = 30%
      expect(venueSummary.percentageOfTotal).toBe(30)
      // Catering is 18,000 / 50,000 = 36%
      expect(cateringSummary.percentageOfTotal).toBe(36)
    })

    it('tracks cost statuses: estimated, quoted, and confirmed totals', () => {
      const summary = calculateBudgetSummary(50000, mockItems)
      expect(summary.statusBreakdown.confirmedTotal).toBe(20000) // 15,000 (venue) + 5,000 (contingency)
      expect(summary.statusBreakdown.quotedTotal).toBe(18000) // 18,000 (catering)
      expect(summary.statusBreakdown.estimatedTotal).toBe(7000) // 7,000 (decor)
    })

    it('flags overspending and generates infeasibility explanation when (P + C) > T', () => {
      // Set total budget to 42,000 (while P+C is 45,000)
      const summary = calculateBudgetSummary(42000, mockItems)

      expect(summary.isOverBudget).toBe(true)
      expect(summary.overBudgetAmount).toBe(3000) // 45,000 - 42,000
      expect(summary.remainingBalance).toBe(-3000)
      expect(summary.warnings.some((w) => w.type === 'over-budget')).toBe(true)
      expect(summary.infeasibilityReason).toMatch(/over-budget deficit of \$3,000/i)
    })

    it('handles zero total budget safely without throwing errors or NaN percentages', () => {
      const summary = calculateBudgetSummary(0, mockItems)

      expect(summary.totalBudget).toBe(0)
      expect(summary.isOverBudget).toBe(true)
      expect(summary.warnings.some((w) => w.type === 'zero-budget')).toBe(true)
      summary.categories.forEach((cat) => {
        expect(isNaN(cat.percentageOfTotal)).toBe(false)
      })
    })

    it('handles negative total budget gracefully', () => {
      const summary = calculateBudgetSummary(-10000, mockItems)
      expect(summary.isOverBudget).toBe(true)
      expect(summary.warnings.some((w) => w.type === 'negative-budget')).toBe(true)
    })

    it('warns when contingency reserve is completely missing', () => {
      const noContingencyItems = mockItems.filter((i) => !i.isContingency && i.category !== 'contingency')
      const summary = calculateBudgetSummary(50000, noContingencyItems)

      expect(summary.contingencyReserve).toBe(0)
      expect(summary.warnings.some((w) => w.type === 'missing-contingency')).toBe(true)
    })
  })

  describe('generateCostSavingAlternatives', () => {
    it('provides concrete cost-saving alternatives without modifying items automatically', () => {
      const items: BudgetItem[] = [
        {
          id: 'b-cat',
          eventId: 'ev-1',
          category: 'catering',
          name: 'Plated 5-Course Dinner',
          costStatus: 'quoted',
          estimatedAmount: 20000,
          quotedAmount: 20000,
          confirmedAmount: 0,
          allocatedAmount: 20000,
          actualAmount: 20000,
          paidAmount: 5000,
          paymentStatus: 'deposit-paid',
        },
        {
          id: 'b-floral',
          eventId: 'ev-1',
          category: 'decor',
          name: 'Cascading Orchid Installations',
          costStatus: 'estimated',
          estimatedAmount: 9000,
          quotedAmount: 9000,
          confirmedAmount: 0,
          allocatedAmount: 9000,
          actualAmount: 9000,
          paidAmount: 0,
          paymentStatus: 'planned',
        },
      ]

      const alternatives = generateCostSavingAlternatives(45000, items)
      expect(alternatives.length).toBeGreaterThan(0)

      alternatives.forEach((alt) => {
        expect(alt.estimatedSavings).toBeGreaterThan(0)
        expect(alt.suggestedAmount).toBeLessThan(alt.currentAmount)
        expect(alt.rationale).toBeTruthy()
        expect(alt.tradeoffNotice).toBeTruthy()
      })

      // Ensure original items are unchanged
      expect(items[0].allocatedAmount).toBe(20000)
    })
  })

  describe('Consistency after repeated updates and deletions', () => {
    it('maintains arithmetic invariants through a sequence of adds, updates, and deletes', () => {
      let items: BudgetItem[] = []

      // Initial add
      items.push({
        id: '1',
        eventId: 'ev-1',
        category: 'venue',
        name: 'Venue',
        costStatus: 'estimated',
        estimatedAmount: 10000,
        quotedAmount: 10000,
        confirmedAmount: 0,
        allocatedAmount: 10000,
        actualAmount: 10000,
        paidAmount: 0,
        paymentStatus: 'planned',
      })

      let summary = calculateBudgetSummary(20000, items)
      expect(summary.plannedExpenditure).toBe(10000)
      expect(summary.remainingBalance).toBe(10000)

      // Add contingency
      items.push({
        id: '2',
        eventId: 'ev-1',
        category: 'contingency',
        name: 'Buffer',
        costStatus: 'confirmed',
        estimatedAmount: 2000,
        quotedAmount: 2000,
        confirmedAmount: 2000,
        allocatedAmount: 2000,
        actualAmount: 0,
        paidAmount: 0,
        paymentStatus: 'planned',
        isContingency: true,
      })

      summary = calculateBudgetSummary(20000, items)
      expect(summary.plannedExpenditure).toBe(10000)
      expect(summary.contingencyReserve).toBe(2000)
      expect(summary.totalCommittedPlanned).toBe(12000)
      expect(summary.remainingBalance).toBe(8000)

      // Update venue to 14,000
      items = items.map((i) => (i.id === '1' ? { ...i, allocatedAmount: 14000 } : i))
      summary = calculateBudgetSummary(20000, items)
      expect(summary.plannedExpenditure).toBe(14000)
      expect(summary.totalCommittedPlanned).toBe(16000)
      expect(summary.remainingBalance).toBe(4000)

      // Delete contingency
      items = items.filter((i) => i.id !== '2')
      summary = calculateBudgetSummary(20000, items)
      expect(summary.contingencyReserve).toBe(0)
      expect(summary.plannedExpenditure).toBe(14000)
      expect(summary.remainingBalance).toBe(6000)
    })
  })
})
