import { CelebrationEvent } from '@/types/event'
import { BudgetItem } from '@/types/budget'
import { TimelineTask } from '@/types/timeline'
import { Vendor } from '@/types/vendor'
import { AIRecommendation, PlanSyncAlert } from '@/types/ai'
import { calculateBudgetSummary, formatCurrency, sanitizeAmount } from './budgetGuardian'
import { calculateDaysRemaining, isTaskOverdue } from './timelineEngine'

/**
 * Generates personalized, context-aware celebration planning recommendations.
 * Pure deterministic engine based on real event data.
 * Every recommendation includes:
 * 1. What the issue is
 * 2. Why it matters
 * 3. Its potential impact
 * 4. A suggested action
 */
export function generateEventRecommendations(
  event: CelebrationEvent | null,
  budgetItems: BudgetItem[],
  tasks: TimelineTask[],
  vendors: Vendor[],
  referenceDate: Date = new Date(),
): {
  recommendations: AIRecommendation[]
  alerts: PlanSyncAlert[]
} {
  const recommendations: AIRecommendation[] = []
  const alerts: PlanSyncAlert[] = []

  if (!event) {
    return { recommendations, alerts }
  }

  const currency = event.currency || 'INR'
  const totalBudget = sanitizeAmount(event.totalBudget)
  const guestCount = Math.max(1, event.targetGuestCount || 1)
  const daysRem = event.date ? calculateDaysRemaining(event.date, referenceDate) : null
  const budgetSummary = calculateBudgetSummary(totalBudget, budgetItems)
  const nowIso = new Date().toISOString()

  // 1. Check Contingency Reserve (< 8% of total budget)
  const minContingency = Math.round(totalBudget * 0.08)
  if (totalBudget > 0 && budgetSummary.contingencyReserve < minContingency) {
    const deficit = minContingency - budgetSummary.contingencyReserve
    recommendations.push({
      id: 'rec-contingency-low',
      severity: 'critical',
      title: 'Insufficient Contingency Reserve',
      source: 'budget',
      issue: 'Your event has an inadequate or missing contingency reserve buffer.',
      whyItMatters:
        'Celebrations in India commonly incur 8–12% in unforeseen expenses such as extended venue hours, extra guest plates, and ceremonial supplies.',
      potentialImpact: `Without an 8% buffer (${formatCurrency(minContingency, currency)}), unexpected expenses of ${formatCurrency(deficit, currency)} must be paid directly out of pocket.`,
      suggestedAction: `Rebalance non-essential decor and styling lines to ring-fence a guaranteed ${formatCurrency(minContingency, currency)} contingency reserve.`,
      actionType: 'UPDATE_BUDGET',
      actionPayload: {
        totalBudget,
        contingencyAmount: minContingency,
      },
      createdAt: nowIso,
    })

    alerts.push({
      id: 'alert-contingency-buffer',
      severity: 'critical',
      title: 'Contingency Reserve Below 8% Safety Target',
      source: 'budget',
      description: `Current reserve is ${formatCurrency(budgetSummary.contingencyReserve, currency)}. Recommended minimum is ${formatCurrency(minContingency, currency)}.`,
      suggestedAction: 'Reallocate non-critical budget lines to protect emergency liquidity.',
      estimatedImpact: `Protects against up to ${formatCurrency(deficit, currency)} in unexpected surcharges.`,
      createdAt: nowIso,
    })
  }

  // 2. Check Catering Budget Limit (approaching or exceeding 36% of total spend)
  const cateringSummary = budgetSummary.categories.find((c) => c.category === 'catering')
  if (cateringSummary && totalBudget > 0) {
    const cateringPercent = cateringSummary.percentageOfTotal
    if (cateringPercent > 38 || (budgetSummary.isOverBudget && cateringPercent > 32)) {
      recommendations.push({
        id: 'rec-catering-limit',
        severity: 'warning',
        title: 'Catering Allocation Approaching Upper Ceiling',
        source: 'budget',
        issue: 'Your catering budget allocation is consuming an oversized portion of your overall finances.',
        whyItMatters:
          'While hospitality and cuisine are cultural cornerstones, spending over 38% on food compromises physical venue staging, safety, and photography coverage.',
        potentialImpact: `At ${formatCurrency(cateringSummary.allocatedAmount, currency)} (${cateringPercent}% of total), per-guest food cost is ${formatCurrency(Math.round(cateringSummary.allocatedAmount / guestCount), currency)}, leaving insufficient funds for other essential services.`,
        suggestedAction:
          'Consider transitioning from synchronized plated service to an authentic live buffet with regional anchor dishes, reducing labor overhead by 12–15%.',
        actionType: 'UPDATE_BUDGET',
        actionPayload: {
          category: 'catering',
          allocatedAmount: Math.round(totalBudget * 0.32),
        },
        createdAt: nowIso,
      })

      alerts.push({
        id: 'alert-catering-limit',
        severity: 'warning',
        title: 'Catering Allocation Above Recommended 32% Benchmark',
        source: 'budget',
        description: `Catering is currently allocated ${cateringPercent}% (${formatCurrency(cateringSummary.allocatedAmount, currency)}) of the total budget.`,
        suggestedAction: 'Review live buffet counters and streamline menu courses.',
        estimatedImpact: `Potential savings of up to ${formatCurrency(Math.round(totalBudget * 0.05), currency)}.`,
        createdAt: nowIso,
      })
    }
  }

  // 3. Check Pending Vendor Bookings vs Critical Categories
  const criticalServices = ['venue', 'catering', 'photography', 'decor']
  const confirmedServices = new Set(
    vendors
      .filter((v) => v.contractStatus === 'contract-signed' || v.contractStatus === 'deposit-paid')
      .map((v) => v.service),
  )
  const pendingCritical = criticalServices.filter((s) => !confirmedServices.has(s as any))

  if (pendingCritical.length > 0 && daysRem !== null && daysRem <= 90) {
    recommendations.push({
      id: 'rec-pending-vendors',
      severity: daysRem <= 30 ? 'critical' : 'warning',
      title: `${pendingCritical.length} Critical Supplier Contracts Still Pending`,
      source: 'vendor',
      issue: `Key suppliers for ${pendingCritical.join(', ')} have not yet been locked with signed agreements.`,
      whyItMatters:
        'In peak Indian wedding and festive seasons, premier decorators, photographers, and caterers receive multiple inquiries for auspicious dates (Shubh Muhurats).',
      potentialImpact: 'Risk of losing preferred vendors or paying late booking surcharges of 15–25%.',
      suggestedAction: `Prioritize contract execution and booking deposits for: ${pendingCritical.join(', ')}.`,
      actionType: 'ADD_VENDOR',
      actionPayload: { pendingCategories: pendingCritical },
      createdAt: nowIso,
    })

    alerts.push({
      id: 'alert-unconfirmed-vendors',
      severity: daysRem <= 30 ? 'critical' : 'warning',
      title: `${pendingCritical.length} Core Vendor Contracts Unconfirmed`,
      source: 'vendor',
      description: `Unsecured categories: ${pendingCritical.join(', ')}.`,
      suggestedAction: 'Finalize proposals and lock dates before supplier availability expires.',
      estimatedImpact: 'Prevents emergency vendor substitution and last-minute price gouging.',
      createdAt: nowIso,
    })
  }

  // 4. Decoration Setup & Lead-In Time Warnings
  const decorTask = tasks.find(
    (t) =>
      t.category === 'decor' ||
      t.title.toLowerCase().includes('mandap') ||
      t.title.toLowerCase().includes('floral') ||
      t.title.toLowerCase().includes('pandal'),
  )
  if (decorTask && daysRem !== null && daysRem <= 14 && decorTask.status !== 'completed') {
    recommendations.push({
      id: 'rec-decor-setup-window',
      severity: 'warning',
      title: 'Decoration & Mandap Load-In Schedule Buffer',
      source: 'timeline',
      issue: 'Elaborate mandap floristry and stage lighting require 6 to 8 hours of dedicated load-in access before guests arrive.',
      whyItMatters:
        'Fresh marigold canopies, floral carpets, and architectural lighting cannot be assembled in the presence of early arriving guests.',
      potentialImpact: 'Unfinished staging, active ladders, and clutter during early guest arrivals or muhurat photos.',
      suggestedAction:
        'Coordinate with the venue lead to ensure decorator access begins at least 6 hours prior to the first ritual.',
      actionType: 'ADD_TASK',
      actionPayload: {
        title: 'Confirm 6-Hour Early Venue Load-In Window for Decor Team',
        priority: 'high',
        category: 'decor',
      },
      createdAt: nowIso,
    })
  }

  // 5. Venue Capacity / Guest Surge Warning
  const currentVenue = event.location?.venueName || ''
  if (guestCount > 250 && (!currentVenue || currentVenue.toLowerCase().includes('tbd'))) {
    recommendations.push({
      id: 'rec-venue-capacity-check',
      severity: 'warning',
      title: 'High Headcount Requires Certified Venue Capacity Check',
      source: 'guest-list',
      issue: `With ${guestCount} target guests, venue capacity and parking transit require formal verification.`,
      whyItMatters:
        'Indian celebrations with high attendance experience concentrated arrival peaks, requiring rapid valet throughput and spacious dining circulation.',
      potentialImpact: 'Dining area bottlenecks, valet gridlock, and potential local civic sound or safety complaints.',
      suggestedAction:
        'Verify that your selected venue has a certified capacity of at least 20% higher than your expected guest count to allow dining seating and ritual mandap movement.',
      actionType: 'CREATE_WHAT_IF_SCENARIO',
      actionPayload: {
        guestCount,
        totalBudget,
      },
      createdAt: nowIso,
    })
  }

  // 6. Overdue Critical Path Tasks
  const overdueTasks = tasks.filter((t) => t.isCriticalPath && isTaskOverdue(t, referenceDate))
  if (overdueTasks.length > 0) {
    const topTask = overdueTasks[0]
    recommendations.push({
      id: 'rec-overdue-critical',
      severity: 'critical',
      title: `${overdueTasks.length} Critical Path Milestones Overdue`,
      source: 'timeline',
      issue: `Critical milestone "${topTask.title}" has passed its scheduled target deadline.`,
      whyItMatters:
        'Critical-path milestones directly gate downstream tasks. Delays here compress rehearsal and vendor confirmation buffers.',
      potentialImpact: 'Downstream schedule compression and increased stress during the final 7 days.',
      suggestedAction: `Resolve "${topTask.title}" immediately to unblock downstream coordination.`,
      actionType: 'UPDATE_TIMELINE',
      actionPayload: { taskId: topTask.id },
      createdAt: nowIso,
    })

    alerts.push({
      id: 'alert-critical-overdue',
      severity: 'critical',
      title: `Critical Path Delay: "${topTask.title}"`,
      source: 'timeline',
      description: `Task was due on ${topTask.targetDate || 'earlier date'}.`,
      suggestedAction: 'Complete milestone or adjust subsequent schedule.',
      estimatedImpact: 'Reclaims schedule margin and preserves vendor delivery guarantees.',
      createdAt: nowIso,
    })
  }

  return { recommendations, alerts }
}

