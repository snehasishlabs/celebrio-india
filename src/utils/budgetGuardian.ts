import {
  BudgetItem,
  BudgetCategory,
  BudgetCalculationResult,
  CategorySummary,
  BudgetWarning,
  CostSavingAlternative,
} from '@/types/budget'

export const STANDARD_CATEGORIES: {
  id: BudgetCategory
  name: string
  description: string
  suggestedPercent: number
}[] = [
  { id: 'venue', name: 'Venue & Facilities', description: 'Site rental, security, and load-in permits', suggestedPercent: 28 },
  { id: 'catering', name: 'Catering & Beverages', description: 'Food service, bar, sommelier, and dinnerware', suggestedPercent: 32 },
  { id: 'decor', name: 'Décor & Florals', description: 'Botanicals, lighting design, linens, and installations', suggestedPercent: 12 },
  { id: 'photography', name: 'Photography & Media', description: 'Photography, cinema highlight reel, and albums', suggestedPercent: 8 },
  { id: 'entertainment', name: 'Entertainment & Music', description: 'Live band, DJ, acoustic soloists, and audio staging', suggestedPercent: 8 },
  { id: 'clothing', name: 'Clothing & Styling', description: 'Attire, accessories, tailoring, and styling', suggestedPercent: 4 },
  { id: 'invitations', name: 'Invitations & Stationery', description: 'Letterpress paper suites, postage, and day-of signage', suggestedPercent: 2 },
  { id: 'transport', name: 'Transport & Logistics', description: 'Guest shuttles, bridal vehicles, and equipment freight', suggestedPercent: 2 },
  { id: 'permits', name: 'Permits & Municipal Fees', description: 'Noise permits, park concessions, and insurance policies', suggestedPercent: 1 },
  { id: 'miscellaneous', name: 'Miscellaneous & Tips', description: 'Vendor gratuities, emergency kits, and incidental fees', suggestedPercent: 3 },
  { id: 'contingency', name: 'Contingency Reserve', description: 'Deterministic safety buffer for unexpected price spikes', suggestedPercent: 8 },
]

export function normalizeCategory(category: BudgetCategory): BudgetCategory {
  switch (category) {
    case 'catering-beverage':
      return 'catering'
    case 'decor-floral':
      return 'decor'
    case 'photography-media':
      return 'photography'
    case 'production-av':
      return 'entertainment'
    case 'apparel-styling':
      return 'clothing'
    case 'stationery-gifts':
      return 'invitations'
    case 'transport-logistics':
      return 'transport'
    default:
      return category
  }
}

export function getCategoryDisplayName(category: BudgetCategory): string {
  const norm = normalizeCategory(category)
  const found = STANDARD_CATEGORIES.find((c) => c.id === norm)
  return found ? found.name : category.replace('-', ' ')
}

/**
 * Safely sanitizes numbers to prevent NaN, Infinity, negative values, and floating point errors.
 */
export function sanitizeAmount(val: unknown, allowNegative = false): number {
  if (val === null || val === undefined) return 0

  let num: number

  if (typeof val === 'number') {
    num = val
  } else if (typeof val === 'string') {
    // Strip out currency symbols, commas, and whitespace
    const cleaned = val.replace(/[^0-9.-]/g, '')
    num = parseFloat(cleaned)
  } else {
    return 0
  }

  if (isNaN(num) || !isFinite(num)) {
    return 0
  }

  if (!allowNegative && num < 0) {
    return 0
  }

  // Prevent absurdly massive values that cause overflow
  if (num > 10_000_000_000) {
    num = 10_000_000_000
  }

  // Round to 2 decimal places deterministically
  return Math.round((num + Number.EPSILON) * 100) / 100
}

/**
 * Formats currency values deterministically without mixing currencies.
 * Supports Indian numbering format (Lakhs / Crores) when currency is INR.
 */
export function formatCurrency(
  amount: unknown,
  currency = 'INR',
  showCents = false,
): string {
  const safeNum = sanitizeAmount(amount, true)
  const isINR = !currency || currency.toUpperCase() === 'INR'
  const locale = isINR ? 'en-IN' : 'en-US'
  const targetCurrency = isINR ? 'INR' : currency

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: targetCurrency,
      minimumFractionDigits: showCents ? 2 : 0,
      maximumFractionDigits: showCents ? 2 : 0,
    }).format(safeNum)
  } catch {
    const symbolMap: Record<string, string> = {
      INR: '₹',
      USD: '$',
      EUR: '€',
      GBP: '£',
      CAD: 'CA$',
      AUD: 'A$',
      JPY: '¥',
      CHF: 'CHF ',
    }
    const symbol = symbolMap[targetCurrency] || (isINR ? '₹' : '$')
    const formattedNum = safeNum.toLocaleString(locale, {
      minimumFractionDigits: showCents ? 2 : 0,
      maximumFractionDigits: showCents ? 2 : 0,
    })
    return `${symbol}${formattedNum}`
  }
}

/**
 * Concise Indian metric representation (e.g. ₹45 Lakhs or ₹1.50 Cr)
 */
export function formatIndianLakhsCrores(amount: unknown, currency = 'INR'): string {
  const safeNum = sanitizeAmount(amount, true)
  const isINR = !currency || currency.toUpperCase() === 'INR'

  if (!isINR) {
    return formatCurrency(safeNum, currency)
  }

  const abs = Math.abs(safeNum)
  const sign = safeNum < 0 ? '-' : ''

  if (abs >= 10000000) {
    const cr = (abs / 10000000).toFixed(2).replace(/\.00$/, '')
    return `${sign}₹${cr} Cr`
  }
  if (abs >= 100000) {
    const lk = (abs / 100000).toFixed(2).replace(/\.00$/, '')
    return `${sign}₹${lk} Lakhs`
  }

  return formatCurrency(safeNum, 'INR')
}

/**
 * Deterministic Budget Guardian Calculation Engine
 * 
 * Rules:
 * - Total Budget (T) is the user's spending limit.
 * - Planned Costs (P) are the sum of non-contingency allocations.
 * - Contingency (C) is a separately allocated reserve.
 * - Total Required = P + C.
 * - Remaining balance = T - (P + C). Does not double-count contingency.
 * - Difference from Limit = T - P.
 * - Over-budget when (P + C) > T.
 */
export function calculateBudgetSummary(
  totalBudgetInput: unknown,
  items: BudgetItem[] = [],
): BudgetCalculationResult {
  const totalBudget = sanitizeAmount(totalBudgetInput, true)
  const isNegativeBudget = totalBudget < 0
  const effectiveTotal = Math.max(0, totalBudget)

  let plannedExpenditure = 0
  let contingencyReserve = 0
  let actualSpent = 0
  let disbursedPaid = 0

  let estimatedTotal = 0
  let quotedTotal = 0
  let confirmedTotal = 0

  // Category aggregations map
  const categoryMap = new Map<
    BudgetCategory,
    { allocated: number; actual: number; count: number }
  >()

  // Initialize standard categories in order
  STANDARD_CATEGORIES.forEach((cat) => {
    categoryMap.set(cat.id, { allocated: 0, actual: 0, count: 0 })
  })

  // Process items deterministically
  items.forEach((item) => {
    const allocated = sanitizeAmount(item.allocatedAmount)
    const actual = sanitizeAmount(item.actualAmount || item.confirmedAmount || item.quotedAmount || item.allocatedAmount)
    const paid = sanitizeAmount(item.paidAmount)
    const normCategory = normalizeCategory(item.category)
    const isContingency = item.isContingency === true || normCategory === 'contingency'

    if (isContingency) {
      contingencyReserve = Math.round((contingencyReserve + allocated) * 100) / 100
    } else {
      plannedExpenditure = Math.round((plannedExpenditure + allocated) * 100) / 100
    }

    actualSpent = Math.round((actualSpent + actual) * 100) / 100
    disbursedPaid = Math.round((disbursedPaid + paid) * 100) / 100

    // Cost status breakdown
    const status = item.costStatus || 'estimated'
    if (status === 'confirmed') {
      confirmedTotal = Math.round((confirmedTotal + allocated) * 100) / 100
    } else if (status === 'quoted') {
      quotedTotal = Math.round((quotedTotal + allocated) * 100) / 100
    } else {
      estimatedTotal = Math.round((estimatedTotal + allocated) * 100) / 100
    }

    // Accumulate into category
    const catData = categoryMap.get(normCategory) || { allocated: 0, actual: 0, count: 0 }
    categoryMap.set(normCategory, {
      allocated: Math.round((catData.allocated + allocated) * 100) / 100,
      actual: Math.round((catData.actual + actual) * 100) / 100,
      count: catData.count + 1,
    })
  })

  const totalCommittedPlanned = Math.round((plannedExpenditure + contingencyReserve) * 100) / 100
  const remainingBalance = Math.round((effectiveTotal - totalCommittedPlanned) * 100) / 100
  const differenceFromLimit = Math.round((effectiveTotal - plannedExpenditure) * 100) / 100

  const isOverBudget = isNegativeBudget || totalCommittedPlanned > effectiveTotal
  const overBudgetAmount = isOverBudget
    ? Math.round(Math.max(0, totalCommittedPlanned - effectiveTotal) * 100) / 100
    : 0

  const allocationPercentage =
    effectiveTotal > 0
      ? Math.round((totalCommittedPlanned / effectiveTotal) * 1000) / 10
      : totalCommittedPlanned > 0
      ? 100
      : 0

  // Build category summaries with percentage of total budget
  const categories: CategorySummary[] = STANDARD_CATEGORIES.map((catDef) => {
    const data = categoryMap.get(catDef.id) || { allocated: 0, actual: 0, count: 0 }
    const percentageOfTotal =
      effectiveTotal > 0
        ? Math.round((data.allocated / effectiveTotal) * 1000) / 10
        : 0

    return {
      category: catDef.id,
      displayName: catDef.name,
      allocatedAmount: data.allocated,
      actualAmount: data.actual,
      percentageOfTotal,
      itemCount: data.count,
    }
  }).filter((cat) => cat.itemCount > 0 || cat.allocatedAmount > 0)

  // Generate deterministic warnings & infeasibility reasons
  const warnings: BudgetWarning[] = []

  if (isNegativeBudget) {
    warnings.push({
      id: 'warn-negative-budget',
      type: 'negative-budget',
      severity: 'critical',
      title: 'Invalid Negative Total Budget',
      description: `Spending limit is set to a negative number (${totalBudget}). Please specify a positive spending target.`,
    })
  } else if (effectiveTotal === 0) {
    warnings.push({
      id: 'warn-zero-budget',
      type: 'zero-budget',
      severity: 'warning',
      title: 'Total Spending Limit is Zero',
      description: 'Your total budget is currently $0. Enter a spending limit to begin budget allocation tracking.',
    })
  }

  if (isOverBudget && effectiveTotal > 0) {
    warnings.push({
      id: 'warn-over-budget',
      type: 'over-budget',
      severity: 'critical',
      title: 'Budget Infeasibility: Overspending Limit',
      description: `Planned allocations ($${plannedExpenditure.toLocaleString()}) plus contingency buffer ($${contingencyReserve.toLocaleString()}) exceed your total budget cap by $${overBudgetAmount.toLocaleString()}.`,
      recommendedAction: 'Review recommended cost-saving alternatives below or reduce non-essential category lines.',
    })
  }

  if (effectiveTotal > 0 && contingencyReserve === 0) {
    warnings.push({
      id: 'warn-missing-contingency',
      type: 'missing-contingency',
      severity: 'warning',
      title: 'No Contingency Reserve Allocated',
      description: 'Celebrio recommends allocating a 5% to 10% contingency buffer to absorb unexpected supplier surcharges and overtime.',
      recommendedAction: 'Add a Contingency line item or set aside 8% of your total budget.',
    })
  }

  // Check category concentration
  categories.forEach((cat) => {
    if (cat.percentageOfTotal > 45 && cat.category !== 'contingency') {
      warnings.push({
        id: `warn-heavy-${cat.category}`,
        type: 'heavy-allocation',
        severity: 'info',
        title: `Heavy Allocation in ${cat.displayName}`,
        description: `${cat.displayName} accounts for ${cat.percentageOfTotal}% of your total budget. Consider balancing allocations across guest experience areas.`,
      })
    }
  })

  const infeasibilityReason = isOverBudget
    ? `Total planned expenditure ($${plannedExpenditure.toLocaleString()}) and contingency reserve ($${contingencyReserve.toLocaleString()}) total $${totalCommittedPlanned.toLocaleString()}, creating an over-budget deficit of $${overBudgetAmount.toLocaleString()} against your $${effectiveTotal.toLocaleString()} limit.`
    : undefined

  return {
    totalBudget: effectiveTotal,
    plannedExpenditure,
    contingencyReserve,
    totalCommittedPlanned,
    actualSpent,
    disbursedPaid,
    remainingBalance,
    differenceFromLimit,
    isOverBudget,
    overBudgetAmount,
    allocationPercentage,
    categories,
    statusBreakdown: {
      estimatedTotal,
      quotedTotal,
      confirmedTotal,
    },
    warnings,
    infeasibilityReason,
  }
}

/**
 * Generates actionable, explicit cost-saving alternatives for user review.
 * NEVER changes user allocations automatically.
 */
export function generateCostSavingAlternatives(
  _totalBudgetInput: number,
  items: BudgetItem[],
): CostSavingAlternative[] {
  const alternatives: CostSavingAlternative[] = []

  items.forEach((item) => {
    const allocated = sanitizeAmount(item.allocatedAmount)
    const normCategory = normalizeCategory(item.category)
    const nameLower = item.name.toLowerCase()

    if (allocated <= 0 || item.isContingency) return

    // Catering alternatives
    if (normCategory === 'catering' && allocated > 4000) {
      const suggested = Math.round(allocated * 0.88)
      alternatives.push({
        id: `alt-${item.id}-menu`,
        itemId: item.id,
        category: 'catering',
        title: 'Transition Plated Entrée to Seasonal Family-Style Feast',
        currentAmount: allocated,
        suggestedAmount: suggested,
        estimatedSavings: allocated - suggested,
        rationale: 'Switching from individual synchronized plate drops to artisanal family-style sharing platters reduces kitchen staffing surcharges by 12% while boosting guest intimacy.',
        tradeoffNotice: 'Preserves the same organic farm-to-table culinary tier; simplifies dinner service logistics.',
      })
    }

    // Decor & Floral alternatives
    if (normCategory === 'decor' && allocated > 2500) {
      const suggested = Math.round(allocated * 0.82)
      alternatives.push({
        id: `alt-${item.id}-florals`,
        itemId: item.id,
        category: 'decor',
        title: 'Architectural Foliage & Ambient Candlelight Styling',
        currentAmount: allocated,
        suggestedAmount: suggested,
        estimatedSavings: allocated - suggested,
        rationale: 'Replacing 35% of fragile imported cut blooms with olive branches, eucalyptus garland, and brass taper hurricanes creates a rich twilight glow.',
        tradeoffNotice: 'Shifts aesthetic from floral-dense to candle-rich architectural ambiance.',
      })
    }

    // Invitations & Stationery alternatives
    if ((normCategory === 'invitations' || nameLower.includes('invit') || nameLower.includes('station')) && allocated > 800) {
      const suggested = Math.round(allocated * 0.6)
      alternatives.push({
        id: `alt-${item.id}-digital-rsvp`,
        itemId: item.id,
        category: 'invitations',
        title: 'Letterpress Invitation with Digital QR RSVP Concierge',
        currentAmount: allocated,
        suggestedAmount: suggested,
        estimatedSavings: allocated - suggested,
        rationale: 'Retain luxury physical invitation card while moving RSVP response cards and return postage to an interactive digital portal.',
        tradeoffNotice: 'Eliminates paper reply cards and return stamp fees; speeds up dietary headcount collection by 14 days.',
      })
    }

    // Entertainment alternatives
    if (normCategory === 'entertainment' && allocated > 3000) {
      const suggested = Math.round(allocated * 0.85)
      alternatives.push({
        id: `alt-${item.id}-music`,
        itemId: item.id,
        category: 'entertainment',
        title: 'Curated Aperitif Playlist with Peak-Hour Live Ensemble',
        currentAmount: allocated,
        suggestedAmount: suggested,
        estimatedSavings: allocated - suggested,
        rationale: 'Deploy live musicians during the 3 prime celebration hours and utilize a custom high-fidelity acoustic playlist during guest arrivals.',
        tradeoffNotice: 'Concentrates live performance energy when the room is fullest; saves overtime rehearsal fees.',
      })
    }

    // Photography alternatives
    if (normCategory === 'photography' && allocated > 3500) {
      const suggested = Math.round(allocated * 0.88)
      alternatives.push({
        id: `alt-${item.id}-photo`,
        itemId: item.id,
        category: 'photography',
        title: 'Core 6-Hour Coverage with Digital Gallery Priority',
        currentAmount: allocated,
        suggestedAmount: suggested,
        estimatedSavings: allocated - suggested,
        rationale: 'Focus primary cinema/photo crew on key arrival through first dance timeline, shifting late-night reception to guest Polaroid photobooth.',
        tradeoffNotice: 'Preserves editorial high-contrast album deliverables while reducing overtime hourly fees.',
      })
    }

    // Transport alternatives
    if (normCategory === 'transport' && allocated > 1200) {
      const suggested = Math.round(allocated * 0.75)
      alternatives.push({
        id: `alt-${item.id}-transport`,
        itemId: item.id,
        category: 'transport',
        title: 'Dedicated Group Shuttle Pass System',
        currentAmount: allocated,
        suggestedAmount: suggested,
        estimatedSavings: allocated - suggested,
        rationale: 'Book a scheduled multi-passenger executive van on continuous rotation instead of multiple private chauffeur vehicles.',
        tradeoffNotice: 'Guests depart on regular 20-minute cycles from the primary hotel block.',
      })
    }
  })

  // If still no alternatives but budget > 10000, provide a generic contingency alternative
  if (alternatives.length === 0 && items.length > 0) {
    const highestItem = [...items].sort((a, b) => b.allocatedAmount - a.allocatedAmount)[0]
    if (highestItem && highestItem.allocatedAmount > 2000) {
      const suggested = Math.round(highestItem.allocatedAmount * 0.9)
      alternatives.push({
        id: `alt-${highestItem.id}-general`,
        itemId: highestItem.id,
        category: highestItem.category,
        title: `Optimize ${highestItem.name} Scope`,
        currentAmount: highestItem.allocatedAmount,
        suggestedAmount: suggested,
        estimatedSavings: highestItem.allocatedAmount - suggested,
        rationale: `Negotiating a 10% scope refinement on ${highestItem.name} frees up meaningful budget margin.`,
        tradeoffNotice: 'Requires reviewing contractual deliverables with vendor.',
      })
    }
  }

  return alternatives.slice(0, 4)
}

/**
 * Identifies essential celebration categories that have not yet been allocated.
 */
export function detectMissingExpenseCategories(
  items: BudgetItem[],
  eventCategory: string = 'wedding',
): {
  missingCategories: { id: BudgetCategory; name: string; suggestedPercent: number; rationale: string }[]
} {
  const allocatedCategories = new Set(items.map((i) => normalizeCategory(i.category)))
  const missing: { id: BudgetCategory; name: string; suggestedPercent: number; rationale: string }[] = []

  const essentialWedding: { id: BudgetCategory; name: string; suggestedPercent: number; rationale: string }[] = [
    { id: 'venue', name: 'Venue & Facilities', suggestedPercent: 28, rationale: 'Core physical staging, dining hall, and load-in permits.' },
    { id: 'catering', name: 'Catering & Beverages', suggestedPercent: 32, rationale: 'Grand celebratory banquet, welcoming drinks, and sweets.' },
    { id: 'decor', name: 'Décor & Florals', suggestedPercent: 12, rationale: 'Mandap canopy, ceremonial lighting, and auspicious botanicals.' },
    { id: 'photography', name: 'Photography & Media', suggestedPercent: 8, rationale: 'Cinematic recording of rituals and family portraits.' },
    { id: 'contingency', name: 'Contingency Reserve', suggestedPercent: 8, rationale: 'Ring-fenced liquidity for unforeseen supplier overtime or guest surge.' },
  ]

  const checkList = eventCategory === 'wedding' ? essentialWedding : essentialWedding.filter((c) => c.id !== 'contingency')

  checkList.forEach((c) => {
    if (!allocatedCategories.has(c.id)) {
      missing.push(c)
    }
  })

  return { missingCategories: missing }
}

/**
 * Evaluates variance between initial estimates and formal vendor quotations.
 * Highlights supplier cost drift deterministically.
 */
export function compareEstimatedVsQuoted(items: BudgetItem[]): {
  estimatedTotal: number
  quotedTotal: number
  confirmedTotal: number
  quotedVariance: number
  driftPercentage: number
  hasHighDrift: boolean
  driftingItems: { itemId: string; name: string; estimated: number; quoted: number; variance: number }[]
} {
  let estimatedTotal = 0
  let quotedTotal = 0
  let confirmedTotal = 0
  const driftingItems: { itemId: string; name: string; estimated: number; quoted: number; variance: number }[] = []

  items.forEach((item) => {
    const allocated = sanitizeAmount(item.allocatedAmount)
    const status = item.costStatus || 'estimated'

    if (status === 'estimated') {
      estimatedTotal += allocated
    } else if (status === 'quoted') {
      const quoted = sanitizeAmount(item.quotedAmount || item.actualAmount || allocated)
      quotedTotal += quoted
      // If actual/quoted amount exceeds allocated estimate by > 10%
      if (quoted > allocated && allocated > 0) {
        const diff = quoted - allocated
        driftingItems.push({
          itemId: item.id,
          name: item.name,
          estimated: allocated,
          quoted,
          variance: diff,
        })
      }
    } else if (status === 'confirmed') {
      confirmedTotal += allocated
    }
  })

  const quotedVariance = Math.round((quotedTotal - estimatedTotal) * 100) / 100
  const driftPercentage = estimatedTotal > 0 ? Math.round((quotedVariance / estimatedTotal) * 100) : 0
  const hasHighDrift = driftPercentage > 15

  return {
    estimatedTotal: Math.round(estimatedTotal * 100) / 100,
    quotedTotal: Math.round(quotedTotal * 100) / 100,
    confirmedTotal: Math.round(confirmedTotal * 100) / 100,
    quotedVariance,
    driftPercentage,
    hasHighDrift,
    driftingItems,
  }
}
