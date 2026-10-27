import { Vendor, VendorService, PaymentMilestone, VendorComparisonWorksheet } from '@/types/vendor'
import { BudgetItem } from '@/types/budget'
import { sanitizeAmount } from './budgetGuardian'
import { addDays } from './timelineEngine'

export interface VendorCategoryMeta {
  id: VendorService
  label: string
  description: string
  typicalBudgetPercent: number
  standardQuestions: string[]
  cancellationAdvice: string
}

export const VENDOR_CATEGORY_METAS: VendorCategoryMeta[] = [
  {
    id: 'venue',
    label: 'Venue & Location',
    description: 'Event space, physical grounds, permits, tables/chairs, and facility operations.',
    typicalBudgetPercent: 28,
    standardQuestions: [
      'What is the maximum noise ordinance curfew and load-out breakdown deadline?',
      'Are outside certified caterers and bar suppliers permitted, or is there an exclusive vendor list?',
      'What is the policy regarding live flame (candles), floral rigging, and floor tape?',
      'Is general liability insurance required, and what minimum coverage policy is mandated?',
    ],
    cancellationAdvice: 'Most premier venues require 50% non-refundable deposits. Ensure force-majeure clause protects against extreme weather.',
  },
  {
    id: 'catering',
    label: 'Catering & Dining',
    description: 'Food preparation, service staffing, culinary rentals, and table dining experience.',
    typicalBudgetPercent: 30,
    standardQuestions: [
      'What is your dedicated server-to-guest staffing ratio for seated versus family-style service?',
      'How are severe allergies and cross-contamination handled in field kitchens?',
      'Does the quote include table linens, flatware, stemware, and comprehensive kitchen cleanup?',
      'When is the final non-negotiable guest headcount lock date?',
    ],
    cancellationAdvice: 'Headcount reductions are typically allowed up to 14 days before; ingredient procurement costs are non-refundable inside 7 days.',
  },
  {
    id: 'florals-decor',
    label: 'Décor, Florals & Styling',
    description: 'Floral arrangements, candle styling, furniture rentals, drapery, and aesthetic focal points.',
    typicalBudgetPercent: 12,
    standardQuestions: [
      'Are centerpiece vessels, brass hurricanes, and arches rental items or purchases?',
      'What is the strike and post-event teardown protocol after midnight?',
      'How do you manage weather-related floral substitutions if seasonal blooms are damaged in transit?',
      'Will you handle moving ceremony floral arrangements to the reception room during cocktail hour?',
    ],
    cancellationAdvice: 'Floral wholesale orders are submitted 21 days in advance; after that date, floral purchase costs cannot be recovered.',
  },
  {
    id: 'photography-video',
    label: 'Photography & Cinema',
    description: 'Visual documentation, portraiture, drone cinema, and memory archiving.',
    typicalBudgetPercent: 9,
    standardQuestions: [
      'Will the primary named photographer shoot our celebration, or is an associate dispatched?',
      'What is the contractually guaranteed turnaround window for the highlight gallery and full album?',
      'Are raw unedited files, print rights, and high-resolution digital downloads included?',
      'What is the backup hardware and memory card redundancy protocol on the day of the event?',
    ],
    cancellationAdvice: 'Photographers reserve the date exclusively; retainers are usually non-refundable unless a replacement client is booked.',
  },
  {
    id: 'live-music-dj',
    label: 'Entertainment & Music',
    description: 'Live bands, acoustic ensembles, DJs, MC services, and sound engineering.',
    typicalBudgetPercent: 8,
    standardQuestions: [
      'What are your electrical power, circuit breaker, and stage footprint requirements?',
      'Do you provide MC announcements and wireless microphones for guest speeches?',
      'What is your contingency plan if a key musician or DJ experiences sudden illness?',
      'How long are musicians on stage before requiring a scheduled intermission?',
    ],
    cancellationAdvice: 'Musician union guidelines typically require 30 days notice for partial refund of performance fees.',
  },
  {
    id: 'sound-lighting-av',
    label: 'Sound, Lighting & AV Production',
    description: 'Ambient uplighting, wireless audio projection, microphones, and stage illumination.',
    typicalBudgetPercent: 5,
    standardQuestions: [
      'Do you supply an on-site audio engineer throughout speeches and performances?',
      'Are pin-spots and architectural wash lights battery-operated or cable-tethered?',
      'What is the backup plan for outdoor rain or power generator failure?',
    ],
    cancellationAdvice: 'Equipment reservation holds are usually 50% refundable up to 14 days before delivery.',
  },
  {
    id: 'transportation',
    label: 'Transport & Logistics',
    description: 'Guest shuttles, VIP chauffeur vehicles, valet coordination, and luggage transit.',
    typicalBudgetPercent: 3,
    standardQuestions: [
      'What is the grace period buffer for unexpected traffic delays between venues?',
      'Are continuous loop rotations included, or are pickups scheduled at fixed times?',
      'Are driver gratuities and toll fees included in the quoted contract price?',
    ],
    cancellationAdvice: 'Shuttle fleets allow free cancellation up to 72 hours before service in most metropolitan areas.',
  },
  {
    id: 'rentals',
    label: 'Rentals & Structures',
    description: 'Marquees, luxury restrooms, specialty chairs, lounge vignettes, and dance floors.',
    typicalBudgetPercent: 5,
    standardQuestions: [
      'What are the site access requirements and leveling tolerances for marquee tents?',
      'What is the accidental damage waiver policy on vintage glassware and fine china?',
      'What is the exact delivery and pickup window schedule?',
    ],
    cancellationAdvice: 'Warehouse reservation restocking fees apply inside 14 days.',
  },
]

/**
 * Returns curated questions for a specific vendor service category.
 */
export function getVendorCategoryQuestions(category: string): string[] {
  const norm = category.toLowerCase()
  const found = VENDOR_CATEGORY_METAS.find(
    (m) => m.id === norm || m.label.toLowerCase().includes(norm) || norm.includes(m.id),
  )
  return found ? found.standardQuestions : [
    'What deliverables are explicitly included in this quoted pricing?',
    'What are the payment milestones and cancellation deadlines?',
    'What happens if unforeseen circumstances disrupt our event date?',
  ]
}

/**
 * Generates calibrated payment milestones for a vendor contract.
 * Default: 50% Booking Deposit, 25% Interim Progress, 25% Final Settlement.
 */
export function generateDefaultPaymentMilestones(
  totalAmountInput: number,
  eventDate?: string,
): PaymentMilestone[] {
  const total = sanitizeAmount(totalAmountInput)
  if (total <= 0) return []

  const deposit = Math.round(total * 0.5)
  const midway = Math.round(total * 0.25)
  const final = Math.max(0, total - deposit - midway)

  const date1 = eventDate ? addDays(eventDate, -60) : ''
  const date2 = eventDate ? addDays(eventDate, -30) : ''
  const date3 = eventDate ? addDays(eventDate, -7) : ''

  return [
    {
      id: `ms-${Date.now()}-1`,
      name: 'Initial Booking Deposit (50%)',
      amount: deposit,
      dueDate: date1,
      isPaid: false,
      notes: 'Required upon contract execution to reserve date on vendor calendar.',
    },
    {
      id: `ms-${Date.now()}-2`,
      name: 'Interim Planning Progress (25%)',
      amount: midway,
      dueDate: date2,
      isPaid: false,
      notes: 'Due upon completion of detailed tasting, mockup, or specifications review.',
    },
    {
      id: `ms-${Date.now()}-3`,
      name: 'Final Settlement Balance (25%)',
      amount: final,
      dueDate: date3,
      isPaid: false,
      notes: 'Final balance due prior to load-in and execution.',
    },
  ]
}

/**
 * Calculates sum of paid milestones or deposits on a vendor profile.
 */
export function calculateVendorPaidTotal(vendor: Vendor): number {
  if (vendor.paymentMilestones && vendor.paymentMilestones.length > 0) {
    return vendor.paymentMilestones
      .filter((m) => m.isPaid)
      .reduce((sum, m) => sum + sanitizeAmount(m.amount), 0)
  }
  return vendor.depositPaid ? sanitizeAmount(vendor.depositAmount) : 0
}

/**
 * Synchronizes vendor pricing, deposits, and contract status to the single source of truth (Budget Items).
 * Pure deterministic function returning a new array of budget items.
 */
export function syncVendorToBudgetItems(
  vendor: Vendor,
  budgetItems: BudgetItem[],
): BudgetItem[] {
  const vendorCost = sanitizeAmount(vendor.finalCost || vendor.quotedCost)
  const paidTotal = calculateVendorPaidTotal(vendor)

  // Map contract status to budget cost status
  let nextCostStatus: 'estimated' | 'quoted' | 'confirmed' = 'estimated'
  if (['contract-signed', 'deposit-paid', 'completed'].includes(vendor.contractStatus)) {
    nextCostStatus = 'confirmed'
  } else if (['quote-received', 'negotiating'].includes(vendor.contractStatus)) {
    nextCostStatus = 'quoted'
  }

  // Map payment status
  let nextPaymentStatus: 'planned' | 'deposit-paid' | 'paid-in-full' | 'overdue' = 'planned'
  if (paidTotal >= vendorCost && vendorCost > 0) {
    nextPaymentStatus = 'paid-in-full'
  } else if (paidTotal > 0) {
    nextPaymentStatus = 'deposit-paid'
  }

  return budgetItems.map((item) => {
    // Match by explicit linkedBudgetItemId or matching vendorId
    const isLinked =
      (vendor.linkedBudgetItemId && item.id === vendor.linkedBudgetItemId) ||
      item.vendorId === vendor.id

    if (!isLinked) return item

    return {
      ...item,
      vendorId: vendor.id,
      quotedAmount: sanitizeAmount(vendor.quotedCost),
      confirmedAmount: nextCostStatus === 'confirmed' ? vendorCost : item.confirmedAmount,
      actualAmount: vendorCost > 0 ? vendorCost : item.actualAmount,
      paidAmount: paidTotal,
      costStatus: nextCostStatus,
      paymentStatus: nextPaymentStatus,
      notes: item.notes
        ? `${item.notes} | Vendor: ${vendor.name || 'Contractor'}`
        : `Vendor: ${vendor.name || 'Contractor'} (${vendor.contractStatus})`,
    }
  })
}

/**
 * Creates an empty comparison worksheet for a category when verified live data is unavailable.
 */
export function createDefaultComparisonWorksheet(category: VendorService): VendorComparisonWorksheet {
  return {
    category,
    notes: 'Compare independent candidate proposals side-by-side on pricing, contractual flexibility, and inclusions.',
    candidates: [
      {
        id: `cand-${Date.now()}-1`,
        name: 'Proposal A (Primary Candidate)',
        quotedCost: 0,
        inclusions: 'Full setup, 6-hour service, teardown',
        pros: 'Experienced team, strong portfolio',
        cons: 'Higher retainer deposit required',
        cancellationTerms: '50% refundable up to 30 days',
        score: 8,
      },
      {
        id: `cand-${Date.now()}-2`,
        name: 'Proposal B (Alternative Option)',
        quotedCost: 0,
        inclusions: 'A la carte delivery, customer teardown',
        pros: 'Flexible pricing, seasonal discounts',
        cons: 'Does not include dedicated onsite lead',
        cancellationTerms: 'Non-refundable deposit after 14 days',
        score: 7,
      },
    ],
  }
}

