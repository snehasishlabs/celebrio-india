import { CelebrationEvent } from '@/types/event'
import { BudgetItem } from '@/types/budget'
import { TimelineTask } from '@/types/timeline'
import { Vendor } from '@/types/vendor'
import {
  ScenarioInput,
  ScenarioSimulationResult,
  PlanComparisonSideBySide,
  AffectedCategoryImpact,
  AffectedTaskImpact,
  AffectedVendorImpact,
  ScenarioTradeoff,
} from '@/types/simulation'
import { sanitizeAmount, calculateBudgetSummary, getCategoryDisplayName } from './budgetGuardian'
import {
  calculateDaysRemaining,
  getPlanningHorizon,
  getPlanningHorizonInfo,
  parseSafeDate,
  formatDateIso,
  isTaskOverdue,
  isTaskDueSoon,
} from './timelineEngine'

/**
 * Calculates per-guest cost ceiling.
 */
export function calculatePerGuestCost(totalBudget: number, guestCount: number): number {
  const safeBudget = sanitizeAmount(totalBudget)
  const safeGuests = Math.max(1, Math.round(guestCount || 0))
  return Math.round(safeBudget / safeGuests)
}

/**
 * Deterministically simulates what-if scenario impacts across budget, timeline, and vendors.
 * PURE FUNCTION: Never mutates inputs.
 */
export function simulateScenario(
  originalEvent: CelebrationEvent,
  originalBudgetItems: BudgetItem[],
  originalTasks: TimelineTask[],
  originalVendors: Vendor[],
  scenarioInput: ScenarioInput,
  referenceDate: Date = new Date(),
): ScenarioSimulationResult {
  const refMidnight = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate())
  const currSym = originalEvent.currency === 'INR' ? '₹' : (originalEvent.currency === 'EUR' ? '€' : (originalEvent.currency === 'GBP' ? '£' : '$'))

  // 1. Core Parameter Deltas
  const originalBudget = sanitizeAmount(originalEvent.totalBudget)
  const proposedBudget = sanitizeAmount(scenarioInput.totalBudget)
  const originalGuests = Math.max(1, originalEvent.targetGuestCount || 1)
  const proposedGuests = Math.max(1, scenarioInput.guestCount || 1)

  const originalPerGuest = calculatePerGuestCost(originalBudget, originalGuests)
  const proposedPerGuest = calculatePerGuestCost(proposedBudget, proposedGuests)

  const budgetDelta = proposedBudget - originalBudget
  const perGuestCostDelta = proposedPerGuest - originalPerGuest
  const guestCountDelta = proposedGuests - originalGuests

  // Date Deltas
  const origDateParsed = parseSafeDate(originalEvent.date)
  const propDateParsed = parseSafeDate(scenarioInput.eventDate)
  let daysDelta = 0
  if (origDateParsed && propDateParsed) {
    daysDelta = Math.round((propDateParsed.getTime() - origDateParsed.getTime()) / (1000 * 60 * 60 * 24))
  }

  // 2. Budget Recalculation & Category Impacts
  // Variable categories scale with guest ratio; fixed categories stay stable
  const guestRatio = proposedGuests / originalGuests
  const variableCategories = new Set(['catering', 'rentals', 'stationery', 'invitations', 'cake'])

  let userConfirmedDecisionsPreserved = 0

  // Pre-calculate unconfirmed allocation totals per category for proportional category adjustments
  const categoryUnconfirmedTotals: Record<string, number> = {}
  originalBudgetItems.forEach((item) => {
    if (!item.isContingency && item.category !== 'contingency' && item.costStatus !== 'confirmed') {
      categoryUnconfirmedTotals[item.category] = (categoryUnconfirmedTotals[item.category] || 0) + item.allocatedAmount
    }
  })

  const simulatedBudgetItems: BudgetItem[] = originalBudgetItems.map((item) => {
    // Dynamic contingency reserve: Always maintained at 8% of the proposed celebration budget
    if (item.isContingency || item.category === 'contingency') {
      const targetContingency = Math.round(proposedBudget * 0.08)
      return {
        ...item,
        allocatedAmount: targetContingency,
        actualAmount: targetContingency,
      }
    }

    // PRESERVE USER INTENT: Confirmed allocations are strictly protected
    if (item.costStatus === 'confirmed') {
      userConfirmedDecisionsPreserved++
      return { ...item }
    }

    let newAllocated = item.allocatedAmount

    // Check if user specified an explicit adjustment for this category
    if (scenarioInput.categoryAdjustments && scenarioInput.categoryAdjustments[item.category] !== undefined) {
      const targetCatTotal = sanitizeAmount(scenarioInput.categoryAdjustments[item.category])
      const unconfirmedTotal = categoryUnconfirmedTotals[item.category] || 0
      if (unconfirmedTotal > 0) {
        newAllocated = Math.round(targetCatTotal * (item.allocatedAmount / unconfirmedTotal))
      } else {
        newAllocated = targetCatTotal
      }
    } else if (variableCategories.has(item.category) && guestCountDelta !== 0 && !item.isContingency) {
      // 40% fixed baseline + 60% variable scaling with guest count
      newAllocated = Math.round(item.allocatedAmount * (0.4 + 0.6 * guestRatio))
    }

    return {
      ...item,
      allocatedAmount: newAllocated,
      actualAmount: item.costStatus === 'quoted' ? item.actualAmount : newAllocated,
    }
  })

  // Calculate summaries for original and proposed
  const originalSummary = calculateBudgetSummary(originalBudget, originalBudgetItems)
  const proposedSummary = calculateBudgetSummary(proposedBudget, simulatedBudgetItems)

  // Map category impacts
  const affectedCategories: AffectedCategoryImpact[] = originalSummary.categories.map((origCat) => {
    const propCat = proposedSummary.categories.find((c) => c.category === origCat.category)
    const proposedAlloc = propCat ? propCat.allocatedAmount : origCat.allocatedAmount
    const variance = proposedAlloc - origCat.allocatedAmount

    const isOver = proposedSummary.isOverBudget && propCat ? propCat.allocatedAmount > origCat.allocatedAmount : false

    let notes = 'Allocation remains aligned.'
    if (variance > 0) {
      notes = `Scales +${currSym}${variance.toLocaleString()} due to ${proposedGuests} guests headcount.`
    } else if (variance < 0) {
      notes = `Reduced by ${currSym}${Math.abs(variance).toLocaleString()} to fit adjusted target.`
    }

    return {
      category: origCat.category,
      categoryName: origCat.displayName || getCategoryDisplayName(origCat.category),
      originalAllocation: origCat.allocatedAmount,
      proposedAllocation: proposedAlloc,
      isOverAllocated: isOver,
      variance,
      notes,
    }
  })

  // 3. Timeline Recomputation & Task Urgency
  const simulatedTasks: AffectedTaskImpact[] = []
  let proposedOverdueCount = 0
  let proposedDueSoonCount = 0

  originalTasks.forEach((task) => {
    const origTaskDate = parseSafeDate(task.targetDate || task.deadline)
    let propDateStr = task.targetDate || task.deadline || ''

    if (origTaskDate && daysDelta !== 0) {
      const shifted = new Date(origTaskDate.getTime() + daysDelta * 86400000)
      propDateStr = formatDateIso(shifted)
    }

    const propTaskDate = parseSafeDate(propDateStr)
    let isNowUrgent = false
    let isInfeasible = false
    let proposedPriority = task.priority
    let reason = 'Schedule shifts in parallel with new target date.'

    if (task.status === 'completed') {
      // User-completed decisions are preserved!
      userConfirmedDecisionsPreserved++
      reason = 'Task already achieved; status preserved.'
    } else if (propTaskDate) {
      const daysUntilTask = Math.round((propTaskDate.getTime() - refMidnight.getTime()) / 86400000)

      if (daysUntilTask < 0) {
        isInfeasible = true
        proposedOverdueCount++
        proposedPriority = 'critical'
        reason = `Shifted deadline (${propDateStr}) falls in the past relative to today. Requires urgent replanning.`
      } else if (daysUntilTask <= 7) {
        isNowUrgent = true
        proposedDueSoonCount++
        proposedPriority = 'critical'
        reason = `Deadline now due in ${daysUntilTask} days. Escalated to critical priority.`
      }
    }

    simulatedTasks.push({
      taskId: task.id,
      title: task.title,
      originalDeadline: task.targetDate || 'TBD',
      proposedDeadline: propDateStr,
      originalPriority: task.priority,
      proposedPriority,
      isNowUrgent,
      isInfeasible,
      reason,
    })
  })

  // 4. Vendor Implications & Realistic Constraints
  const affectedVendors: AffectedVendorImpact[] = originalVendors.map((vendor) => {
    const isLocked =
      vendor.contractStatus === 'contract-signed' ||
      vendor.contractStatus === 'deposit-paid' ||
      vendor.contractStatus === 'completed'

    if (isLocked) {
      userConfirmedDecisionsPreserved++
    }

    let proposedCost = vendor.quotedCost
    let uncertaintyFlag = false
    let actionAdvice = 'Vendor proposal unaffected.'

    // Event date shift uncertainty
    if (daysDelta !== 0) {
      if (isLocked) {
        uncertaintyFlag = true
        actionAdvice = `Contract signed for ${originalEvent.date}. Direct confirmation required: supplier cannot be assumed available on ${scenarioInput.eventDate}.`
      } else {
        actionAdvice = `Inquiry candidate; update RFP with new date (${scenarioInput.eventDate}).`
      }
    }

    // Guest surge impacts catering/rentals
    if (guestCountDelta !== 0 && (vendor.service === 'catering' || vendor.service === 'rentals')) {
      if (!isLocked) {
        proposedCost = Math.round(vendor.quotedCost * (0.3 + 0.7 * guestRatio))
        actionAdvice = `Estimated pricing adjusted for ${proposedGuests} guests (${guestCountDelta > 0 ? '+' : ''}${guestCountDelta}).`
      } else {
        actionAdvice = `Contract locked for original headcount (${originalGuests}). Verify venue capacity and per-plate overage rates.`
      }
    }

    return {
      vendorId: vendor.id,
      vendorName: vendor.name || 'Supplier Candidate',
      service: vendor.service,
      contractStatus: vendor.contractStatus,
      originalCost: vendor.finalCost || vendor.quotedCost,
      proposedCost,
      isContractLocked: isLocked,
      uncertaintyFlag,
      actionAdvice,
    }
  })

  // 5. Trade-offs & Compromises
  const tradeoffs: ScenarioTradeoff[] = []

  if (proposedSummary.isOverBudget) {
    const deficit = Math.abs(proposedSummary.remainingBalance)
    const isIndian = currSym === '₹' || !!originalEvent.culturalPreferences

    tradeoffs.push({
      id: 'to-catering-service',
      title: isIndian
        ? 'Live Buffet Service with Signature Regional Specialties'
        : 'Family-Style Service Transition',
      category: 'Catering',
      description: isIndian
        ? 'Switch from formal multi-course table service to an elegant live buffet while strictly preserving authentic regional anchor dishes and fresh dessert counters.'
        : 'Switch from synchronized plated dinner to artisanal shared platters.',
      savingsOrCost: Math.min(deficit, Math.round(proposedBudget * 0.05)),
      impactType: 'savings',
      compromiseSummary: isIndian
        ? 'Reduces server staffing overhead while ensuring guests enjoy continuous warm culinary replenishment.'
        : 'Reduces staffing labor costs by 12% while maintaining gourmet food tier.',
    })

    tradeoffs.push({
      id: 'to-foliage-styling',
      title: isIndian
        ? 'Indigenous Botanical & Brass Diya Ambiance'
        : 'Architectural Foliage & Candlelight Styling',
      category: 'Décor & Floral',
      description: isIndian
        ? 'Replace fragile imported cut flowers with local fragrant Rajnigandha (tuberose), marigold canopies, mango-leaf torans, and floating brass pradips.'
        : 'Replace fragile imported blooms with olive branches, eucalyptus garland, and brass hurricanes.',
      savingsOrCost: Math.min(deficit, Math.round(proposedBudget * 0.04)),
      impactType: 'savings',
      compromiseSummary: isIndian
        ? 'Creates deeply authentic celebratory warmth with 20% lower wholesale botanical spend.'
        : 'Creates rich twilight ambiance without high wholesale cut-flower premiums.',
    })

    if (isIndian) {
      tradeoffs.push({
        id: 'to-cultural-continuity',
        title: 'Cultural Continuity & Ritual Protection',
        category: 'Traditions',
        description: 'All culturally selected ceremonies and family rituals remain fully preserved and protected in the timeline.',
        savingsOrCost: 0,
        impactType: 'neutral',
        compromiseSummary: 'Budget reductions are absorbed entirely by logistics and styling without sacrificing sacred or celebratory ceremonies.',
      })
    }
  }

  if (daysDelta < -14) {
    tradeoffs.push({
      id: 'to-parallel-tastings',
      title: 'Parallelized Vendor Alignment Sprints',
      category: 'Timeline',
      description: 'Combine catering tastings with onsite technical audio walkthroughs.',
      savingsOrCost: 0,
      impactType: 'neutral',
      compromiseSummary: 'Reclaims 10 days of schedule buffer to accommodate accelerated date.',
    })
  }

  if (guestCountDelta >= 20) {
    tradeoffs.push({
      id: 'to-staffing-logistics',
      title: 'Banquet Staffing & Dual Buffet Deployment',
      category: 'Catering & Staffing',
      description: `With +${guestCountDelta} guests, deploy dual synchronized buffet counters and contract ${Math.ceil(guestCountDelta / 15)} additional service personnel.`,
      savingsOrCost: Math.round(guestCountDelta * 180),
      impactType: 'cost',
      compromiseSummary: 'Eliminates meal queue bottlenecks and keeps elder dining transitions effortless.',
    })
    tradeoffs.push({
      id: 'to-passed-hors-doeuvres',
      title: 'Passed Cocktail Stations',
      category: 'Guest Experience',
      description: 'Deploy roving tasting bites during cocktail hour instead of formal seated course.',
      savingsOrCost: Math.round(guestCountDelta * 25),
      impactType: 'savings',
      compromiseSummary: 'Eases table furniture rental requirements for the extra guests.',
    })
  }

  // 6. Infeasibility & Critical Warnings
  const infeasibilityReasons: string[] = []

  let venueCapacityWarning: string | undefined = undefined
  const effectiveCapacity =
    scenarioInput.venueCapacity && scenarioInput.venueCapacity > 0
      ? scenarioInput.venueCapacity
      : (originalEvent.location?.capacity && originalEvent.location.capacity > 0
        ? originalEvent.location.capacity
        : (originalGuests >= 100 && proposedGuests > Math.round(originalGuests * 1.15)
          ? Math.round(originalGuests * 1.15)
          : undefined))

  if (effectiveCapacity && proposedGuests > effectiveCapacity) {
    const overCapacity = proposedGuests - effectiveCapacity
    venueCapacityWarning = `Venue Capacity Exceeded: Proposed ${proposedGuests} guests exceeds certified facility limit (${effectiveCapacity}) by ${overCapacity} attendees. Requires hall expansion or guest rotation.`
    infeasibilityReasons.push(venueCapacityWarning)
  }

  if (scenarioInput.venueName && scenarioInput.venueName.trim() && scenarioInput.venueName !== originalEvent.location.venueName) {
    infeasibilityReasons.push(
      `Venue Relocation Notice: Relocating from "${originalEvent.location.venueName}" to "${scenarioInput.venueName}" requires renegotiating vendor load-in guidelines, curfew permissions, and security deposit transfer.`
    )
    tradeoffs.push({
      id: 'to-venue-relocation-transit',
      title: 'Coordinate Venue Transition & Logistics',
      category: 'Logistics',
      description: `Transmit updated venue address (${scenarioInput.venueName}) and arrival access instructions to all booked vendors.`,
      savingsOrCost: 0,
      impactType: 'neutral',
      compromiseSummary: 'Ensures no day-of disruption or delivery delays to the previous address.',
    })
  }

  if (proposedSummary.isOverBudget) {
    infeasibilityReasons.push(
      `Budget Deficit: Proposed allocations exceed spending ceiling by ${currSym}${Math.abs(
        proposedSummary.remainingBalance,
      ).toLocaleString()}.`,
    )
  }

  if (proposedOverdueCount > 0) {
    infeasibilityReasons.push(
      `Schedule Conflict: ${proposedOverdueCount} milestones fall into past deadlines due to date acceleration.`,
    )
  }

  const lockedVendorsWithDateShift = affectedVendors.filter((v) => v.uncertaintyFlag)
  if (lockedVendorsWithDateShift.length > 0) {
    infeasibilityReasons.push(
      `Supplier Availability: ${lockedVendorsWithDateShift.length} confirmed vendor contracts must be renegotiated for the new date.`,
    )
  }

  // 7. Side by Side Plan Comparison
  const origDaysRem = calculateDaysRemaining(originalEvent.date, referenceDate)
  const propDaysRem = calculateDaysRemaining(scenarioInput.eventDate, referenceDate)

  const comparison: PlanComparisonSideBySide = {
    original: {
      totalBudget: originalBudget,
      guestCount: originalGuests,
      eventDate: originalEvent.date,
      perGuestCost: originalPerGuest,
      contingencyReserve: originalSummary.contingencyReserve,
      plannedSpending: originalSummary.plannedExpenditure,
      remainingBalance: originalSummary.remainingBalance,
      planningHorizon: getPlanningHorizonInfo(getPlanningHorizon(origDaysRem)).label,
      overdueTaskCount: originalTasks.filter((t) => isTaskOverdue(t, referenceDate)).length,
      dueSoonTaskCount: originalTasks.filter((t) => isTaskDueSoon(t, 7, referenceDate)).length,
      confirmedVendorCount: originalVendors.filter((v) => v.contractStatus === 'contract-signed' || v.contractStatus === 'deposit-paid').length,
    },
    proposed: {
      totalBudget: proposedBudget,
      guestCount: proposedGuests,
      eventDate: scenarioInput.eventDate,
      perGuestCost: proposedPerGuest,
      contingencyReserve: proposedSummary.contingencyReserve,
      plannedSpending: proposedSummary.plannedExpenditure,
      remainingBalance: proposedSummary.remainingBalance,
      planningHorizon: getPlanningHorizonInfo(getPlanningHorizon(propDaysRem)).label,
      overdueTaskCount: proposedOverdueCount,
      dueSoonTaskCount: proposedDueSoonCount,
      confirmedVendorCount: originalVendors.filter((v) => v.contractStatus === 'contract-signed' || v.contractStatus === 'deposit-paid').length,
    },
    deltas: {
      budgetDelta,
      perGuestCostDelta,
      contingencyDelta: proposedSummary.contingencyReserve - originalSummary.contingencyReserve,
      daysDelta,
      guestCountDelta,
    },
  }

  // Generate clear summary
  let summary = `Scenario changes budget by ${budgetDelta >= 0 ? '+' : ''}${currSym}${budgetDelta.toLocaleString()} and guest count by ${guestCountDelta >= 0 ? '+' : ''}${guestCountDelta}.`
  if (proposedSummary.isOverBudget) {
    summary += ` Warning: results in ${currSym}${Math.abs(proposedSummary.remainingBalance).toLocaleString()} overspend.`
  } else {
    summary += ` Plan remains mathematically balanced with ${currSym}${proposedSummary.remainingBalance.toLocaleString()} remaining headroom.`
  }

  return {
    comparison,
    affectedCategories,
    affectedTasks: simulatedTasks,
    affectedVendors,
    simulatedBudgetItems,
    tradeoffs,
    hasCriticalWarnings: infeasibilityReasons.length > 0,
    venueCapacityWarning,
    infeasibilityReasons,
    userConfirmedDecisionsPreserved,
    summary,
  }
}

