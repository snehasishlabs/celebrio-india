import { describe, it, expect } from 'vitest'
import {
  generateDefaultPaymentMilestones,
  calculateVendorPaidTotal,
  syncVendorToBudgetItems,
  getVendorCategoryQuestions,
  createDefaultComparisonWorksheet,
} from '../vendorEngine'
import { Vendor } from '@/types/vendor'
import { BudgetItem } from '@/types/budget'

describe('Vendor Engine - Procurement, Vetting & Budget Synchronization', () => {
  describe('generateDefaultPaymentMilestones', () => {
    it('creates 50% deposit, 25% progress, 25% final balance structure', () => {
      const milestones = generateDefaultPaymentMilestones(10000, '2026-12-01')
      expect(milestones).toHaveLength(3)

      expect(milestones[0].amount).toBe(5000)
      expect(milestones[0].name).toMatch(/Initial Booking Deposit/i)
      expect(milestones[0].isPaid).toBe(false)
      expect(milestones[0].dueDate).toBe('2026-10-02') // -60 days

      expect(milestones[1].amount).toBe(2500)
      expect(milestones[1].dueDate).toBe('2026-11-01') // -30 days

      expect(milestones[2].amount).toBe(2500)
      expect(milestones[2].dueDate).toBe('2026-11-24') // -7 days

      const total = milestones.reduce((sum, m) => sum + m.amount, 0)
      expect(total).toBe(10000)
    })

    it('handles zero or negative amounts safely', () => {
      expect(generateDefaultPaymentMilestones(0)).toEqual([])
      expect(generateDefaultPaymentMilestones(-500)).toEqual([])
    })
  })

  describe('calculateVendorPaidTotal', () => {
    it('sums paid milestones when milestone schedule is defined', () => {
      const vendor: Vendor = {
        id: 'ven-1',
        eventId: 'ev-1',
        service: 'catering',
        quotedCost: 8000,
        depositAmount: 4000,
        depositPaid: false,
        contractStatus: 'contract-signed',
        paymentMilestones: [
          { id: 'm1', name: 'Deposit', amount: 4000, dueDate: '2026-10-01', isPaid: true },
          { id: 'm2', name: 'Progress', amount: 2000, dueDate: '2026-11-01', isPaid: true },
          { id: 'm3', name: 'Final', amount: 2000, dueDate: '2026-11-20', isPaid: false },
        ],
      }

      expect(calculateVendorPaidTotal(vendor)).toBe(6000)
    })

    it('falls back to depositAmount when depositPaid is true without milestones', () => {
      const vendor: Vendor = {
        id: 'ven-2',
        eventId: 'ev-1',
        service: 'venue',
        quotedCost: 15000,
        depositAmount: 7500,
        depositPaid: true,
        contractStatus: 'deposit-paid',
      }

      expect(calculateVendorPaidTotal(vendor)).toBe(7500)
    })

    it('returns 0 when no payments made', () => {
      const vendor: Vendor = {
        id: 'ven-3',
        eventId: 'ev-1',
        service: 'photography',
        quotedCost: 4000,
        depositAmount: 2000,
        depositPaid: false,
        contractStatus: 'quote-received',
      }

      expect(calculateVendorPaidTotal(vendor)).toBe(0)
    })
  })

  describe('syncVendorToBudgetItems (Single Source of Truth)', () => {
    const initialBudgetItems: BudgetItem[] = [
      {
        id: 'bgt-venue',
        eventId: 'ev-1',
        category: 'venue',
        name: 'Historic Ballroom Venue',
        costStatus: 'estimated',
        estimatedAmount: 12000,
        quotedAmount: 12000,
        confirmedAmount: 0,
        allocatedAmount: 12000,
        actualAmount: 12000,
        paidAmount: 0,
        paymentStatus: 'planned',
      },
      {
        id: 'bgt-catering',
        eventId: 'ev-1',
        category: 'catering',
        name: 'Organic Plated Dining',
        costStatus: 'estimated',
        estimatedAmount: 10000,
        quotedAmount: 10000,
        confirmedAmount: 0,
        allocatedAmount: 10000,
        actualAmount: 10000,
        paidAmount: 0,
        paymentStatus: 'planned',
      },
    ]

    it('synchronizes quote received to linked budget item', () => {
      const vendor: Vendor = {
        id: 'ven-caterer',
        eventId: 'ev-1',
        name: 'Artisan Gastronomy',
        service: 'catering',
        linkedBudgetItemId: 'bgt-catering',
        quotedCost: 11500,
        depositAmount: 3000,
        depositPaid: false,
        contractStatus: 'quote-received',
      }

      const synced = syncVendorToBudgetItems(vendor, initialBudgetItems)
      const cateringItem = synced.find((i) => i.id === 'bgt-catering')!

      expect(cateringItem.quotedAmount).toBe(11500)
      expect(cateringItem.costStatus).toBe('quoted')
      expect(cateringItem.paidAmount).toBe(0)
      expect(cateringItem.paymentStatus).toBe('planned')

      // Unlinked venue item remains untouched
      const venueItem = synced.find((i) => i.id === 'bgt-venue')!
      expect(venueItem.quotedAmount).toBe(12000)
      expect(venueItem.costStatus).toBe('estimated')
    })

    it('locks confirmed cost status and updates paid amount when contract signed with deposit paid', () => {
      const vendor: Vendor = {
        id: 'ven-ballroom',
        eventId: 'ev-1',
        name: 'The Grand Orangerie',
        service: 'venue',
        linkedBudgetItemId: 'bgt-venue',
        quotedCost: 14000,
        finalCost: 13500, // Negotiated discount
        depositAmount: 6750,
        depositPaid: true,
        contractStatus: 'deposit-paid',
      }

      const synced = syncVendorToBudgetItems(vendor, initialBudgetItems)
      const venueItem = synced.find((i) => i.id === 'bgt-venue')!

      expect(venueItem.quotedAmount).toBe(14000)
      expect(venueItem.actualAmount).toBe(13500)
      expect(venueItem.confirmedAmount).toBe(13500)
      expect(venueItem.costStatus).toBe('confirmed')
      expect(venueItem.paidAmount).toBe(6750)
      expect(venueItem.paymentStatus).toBe('deposit-paid')
    })

    it('sets paymentStatus to paid-in-full when milestone payments match total cost', () => {
      const vendor: Vendor = {
        id: 'ven-catering-paid',
        eventId: 'ev-1',
        service: 'catering',
        linkedBudgetItemId: 'bgt-catering',
        quotedCost: 10000,
        finalCost: 10000,
        depositAmount: 5000,
        depositPaid: true,
        contractStatus: 'completed',
        paymentMilestones: [
          { id: 'm1', name: 'Deposit', amount: 5000, dueDate: '2026-10-01', isPaid: true },
          { id: 'm2', name: 'Balance', amount: 5000, dueDate: '2026-11-01', isPaid: true },
        ],
      }

      const synced = syncVendorToBudgetItems(vendor, initialBudgetItems)
      const cateringItem = synced.find((i) => i.id === 'bgt-catering')!

      expect(cateringItem.paidAmount).toBe(10000)
      expect(cateringItem.paymentStatus).toBe('paid-in-full')
      expect(cateringItem.costStatus).toBe('confirmed')
    })
  })

  describe('getVendorCategoryQuestions', () => {
    it('returns pre-curated vetting questions by category', () => {
      const venueQuestions = getVendorCategoryQuestions('venue')
      expect(venueQuestions.length).toBeGreaterThanOrEqual(3)
      expect(venueQuestions.some((q) => q.toLowerCase().includes('curfew') || q.toLowerCase().includes('noise'))).toBe(true)

      const cateringQuestions = getVendorCategoryQuestions('catering')
      expect(cateringQuestions.some((q) => q.toLowerCase().includes('staffing') || q.toLowerCase().includes('allergies'))).toBe(true)

      const fallbackQuestions = getVendorCategoryQuestions('custom-unknown-service')
      expect(fallbackQuestions.length).toBeGreaterThan(0)
    })
  })

  describe('createDefaultComparisonWorksheet', () => {
    it('generates a clean 2-candidate worksheet template', () => {
      const sheet = createDefaultComparisonWorksheet('photography-video')
      expect(sheet.category).toBe('photography-video')
      expect(sheet.candidates).toHaveLength(2)
      expect(sheet.candidates[0].score).toBeDefined()
    })
  })
})

