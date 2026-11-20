import {
  AIConceptGenerationRequest,
  AITradeoffExplanationRequest,
  AICopilotTaskAdviceRequest,
} from '../src/types/ai'

const ALLOWED_CATEGORIES = new Set(['wedding', 'birthday', 'anniversary', 'community'])

export interface ValidationResult<T> {
  isValid: boolean
  errors: string[]
  sanitized?: T
}

/**
 * Validates and bounds concept generation requests on the server side.
 * Enforces strict limits on string lengths, guest counts, and resource-consuming inputs.
 */
export function validateConceptRequest(body: unknown): ValidationResult<AIConceptGenerationRequest> {
  const errors: string[] = []

  if (!body || typeof body !== 'object') {
    return { isValid: false, errors: ['Request body must be a valid JSON object'] }
  }

  const data = body as Record<string, unknown>

  // eventId
  const rawEventId = data.eventId
  if (typeof rawEventId !== 'string' || !rawEventId.trim()) {
    errors.push('eventId is required and must be a non-empty string')
  } else if (rawEventId.length > 64) {
    errors.push('eventId exceeds maximum length of 64 characters')
  }

  // title
  const rawTitle = data.title
  if (typeof rawTitle !== 'string' || !rawTitle.trim()) {
    errors.push('title is required and must be a non-empty string')
  } else if (rawTitle.length > 100) {
    errors.push('title exceeds maximum length of 100 characters')
  }

  // category
  const rawCategory = data.category
  if (typeof rawCategory !== 'string' || !ALLOWED_CATEGORIES.has(rawCategory)) {
    errors.push("category must be one of: 'wedding', 'birthday', 'anniversary', 'community'")
  }

  // targetGuestCount
  const rawGuestCount = data.targetGuestCount
  if (typeof rawGuestCount !== 'number' || !Number.isInteger(rawGuestCount) || rawGuestCount < 1 || rawGuestCount > 10000) {
    errors.push('targetGuestCount must be an integer between 1 and 10,000')
  }

  // totalBudget
  const rawBudget = data.totalBudget
  if (typeof rawBudget !== 'number' || isNaN(rawBudget) || rawBudget < 100 || rawBudget > 50000000) {
    errors.push('totalBudget must be a finite number between 100 and 50,000,000')
  }

  // currency
  const rawCurrency = data.currency
  if (typeof rawCurrency !== 'string' || rawCurrency.length > 5) {
    errors.push('currency must be a valid currency code (e.g. USD, EUR, GBP)')
  }

  // themePreference (optional)
  let sanitizedTheme: string | undefined
  if (data.themePreference !== undefined && data.themePreference !== null) {
    if (typeof data.themePreference !== 'string') {
      errors.push('themePreference must be a string')
    } else if (data.themePreference.length > 120) {
      errors.push('themePreference exceeds maximum length of 120 characters')
    } else {
      sanitizedTheme = data.themePreference.trim()
    }
  }

  // city (optional)
  let sanitizedCity: string | undefined
  if (data.city !== undefined && data.city !== null) {
    if (typeof data.city !== 'string') {
      errors.push('city must be a string')
    } else if (data.city.length > 80) {
      errors.push('city exceeds maximum length of 80 characters')
    } else {
      sanitizedCity = data.city.trim()
    }
  }

  // helper for string arrays (priorities, dietary, accessibility)
  const sanitizeStringArray = (field: string, maxItems: number, maxItemLength: number): string[] => {
    const val = data[field]
    if (val === undefined || val === null) return []
    if (!Array.isArray(val)) {
      errors.push(`${field} must be an array of strings`)
      return []
    }
    if (val.length > maxItems) {
      errors.push(`${field} contains more than ${maxItems} items`)
    }
    return val
      .slice(0, maxItems)
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim().slice(0, maxItemLength))
      .filter((item) => item.length > 0)
  }

  const priorities = sanitizeStringArray('priorities', 10, 80)
  const dietaryRequirements = sanitizeStringArray('dietaryRequirements', 10, 60)
  const accessibilityRequirements = sanitizeStringArray('accessibilityRequirements', 10, 60)

  if (errors.length > 0) {
    return { isValid: false, errors }
  }

  return {
    isValid: true,
    errors: [],
    sanitized: {
      eventId: (rawEventId as string).trim(),
      title: (rawTitle as string).trim(),
      category: rawCategory as 'wedding' | 'birthday' | 'anniversary' | 'community',
      city: sanitizedCity,
      targetGuestCount: rawGuestCount as number,
      totalBudget: rawBudget as number,
      currency: (rawCurrency as string).trim().toUpperCase(),
      themePreference: sanitizedTheme,
      priorities,
      dietaryRequirements,
      accessibilityRequirements,
    },
  }
}

/**
 * Validates what-if tradeoff replanning explanation requests
 */
export function validateTradeoffRequest(body: unknown): ValidationResult<AITradeoffExplanationRequest> {
  const errors: string[] = []

  if (!body || typeof body !== 'object') {
    return { isValid: false, errors: ['Request body must be a valid JSON object'] }
  }

  const data = body as Record<string, unknown>

  if (typeof data.eventId !== 'string' || !data.eventId.trim()) {
    errors.push('eventId is required')
  }

  if (!data.baseline || typeof data.baseline !== 'object') {
    errors.push('baseline configuration is required')
  }

  if (!data.proposed || typeof data.proposed !== 'object') {
    errors.push('proposed scenario configuration is required')
  }

  if (!data.deltas || typeof data.deltas !== 'object') {
    errors.push('deltas object is required')
  }

  if (errors.length > 0) {
    return { isValid: false, errors }
  }

  const baseline = data.baseline as Record<string, unknown>
  const proposed = data.proposed as Record<string, unknown>
  const deltas = data.deltas as Record<string, unknown>

  return {
    isValid: true,
    errors: [],
    sanitized: {
      eventId: String(data.eventId).trim().slice(0, 64),
      baseline: {
        category: String(baseline.category || 'celebration').slice(0, 32),
        totalBudget: Number(baseline.totalBudget) || 0,
        guestCount: Number(baseline.guestCount) || 1,
      },
      proposed: {
        totalBudget: Number(proposed.totalBudget) || 0,
        guestCount: Number(proposed.guestCount) || 1,
        dateDeltaDays: typeof proposed.dateDeltaDays === 'number' ? proposed.dateDeltaDays : undefined,
        venueType: typeof proposed.venueType === 'string' ? proposed.venueType.slice(0, 50) : undefined,
      },
      deltas: {
        budgetDelta: Number(deltas.budgetDelta) || 0,
        perGuestDelta: Number(deltas.perGuestDelta) || 0,
        contingencyDelta: Number(deltas.contingencyDelta) || 0,
      },
      affectedCategories: Array.isArray(data.affectedCategories)
        ? data.affectedCategories.slice(0, 15).map((c) => String(c).slice(0, 40))
        : [],
    },
  }
}

/**
 * Validates Copilot task advice requests.
 */
export function validateCopilotTaskAdviceRequest(body: unknown): ValidationResult<AICopilotTaskAdviceRequest> {
  const errors: string[] = []

  if (!body || typeof body !== 'object') {
    return { isValid: false, errors: ['Request body must be a valid JSON object'] }
  }

  const data = body as Record<string, unknown>

  // eventId
  const rawEventId = data.eventId
  if (typeof rawEventId !== 'string' || !rawEventId.trim()) {
    errors.push('eventId is required and must be a non-empty string')
  }

  // eventTitle
  const rawTitle = data.eventTitle || data.title
  if (typeof rawTitle !== 'string' || !rawTitle.trim()) {
    errors.push('eventTitle is required')
  }

  // category
  const rawCategory = data.category
  if (typeof rawCategory !== 'string' || !ALLOWED_CATEGORIES.has(rawCategory)) {
    errors.push("category must be one of: 'wedding', 'birthday', 'anniversary', 'community'")
  }

  // targetGuestCount
  const rawGuestCount = data.targetGuestCount
  if (typeof rawGuestCount !== 'number' || rawGuestCount < 1) {
    errors.push('targetGuestCount must be a positive integer')
  }

  // totalBudget
  const rawBudget = data.totalBudget
  if (typeof rawBudget !== 'number' || rawBudget < 100) {
    errors.push('totalBudget must be a finite number of at least 100')
  }

  if (errors.length > 0) {
    return { isValid: false, errors }
  }

  // Urgent tasks sanitization (limit to top 15 tasks)
  const rawTasks = Array.isArray(data.urgentTasks) ? data.urgentTasks : []
  const sanitizedTasks = rawTasks.slice(0, 15).map((item: unknown) => {
    const t = (item && typeof item === 'object') ? (item as Record<string, unknown>) : {}
    return {
      id: String(t.id || '').slice(0, 64),
      title: String(t.title || 'Task').slice(0, 150),
      deadline: typeof t.deadline === 'string' ? t.deadline.slice(0, 30) : undefined,
      isCriticalPath: Boolean(t.isCriticalPath),
      priority: String(t.priority || 'medium').slice(0, 20),
      phase: String(t.phase || 'concept-planning').slice(0, 40),
      status: String(t.status || 'todo').slice(0, 20),
    }
  })

  const rawTraditions = Array.isArray(data.traditions) ? data.traditions.slice(0, 10).map((t) => String(t).slice(0, 50)) : []
  const rawBudgetItems = Array.isArray(data.budgetItems)
    ? data.budgetItems.slice(0, 15).map((item: unknown) => {
        const b = (item && typeof item === 'object') ? (item as Record<string, unknown>) : {}
        return {
          category: String(b.category || 'general').slice(0, 40),
          allocatedAmount: Number(b.allocatedAmount) || 0,
          costStatus: String(b.costStatus || 'estimated').slice(0, 20),
        }
      })
    : undefined

  return {
    isValid: true,
    errors: [],
    sanitized: {
      eventId: String(rawEventId).slice(0, 64),
      eventTitle: String(rawTitle).slice(0, 120),
      category: String(rawCategory),
      city: typeof data.city === 'string' ? data.city.slice(0, 80) : undefined,
      eventDate: typeof data.eventDate === 'string' ? data.eventDate.slice(0, 30) : undefined,
      targetGuestCount: Number(rawGuestCount) || 1,
      totalBudget: Number(rawBudget) || 1000,
      currency: typeof data.currency === 'string' ? data.currency.slice(0, 5) : 'INR',
      traditions: rawTraditions,
      urgentTasks: sanitizedTasks,
      budgetItems: rawBudgetItems,
      query: typeof data.query === 'string' ? data.query.slice(0, 300) : undefined,
    },
  }
}

/**
 * Lightweight in-memory rate limiter per IP / token.
 * Default: 20 requests per minute per IP.
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map()
  private maxRequests: number
  private windowMs: number

  constructor(maxRequests = 20, windowMs = 60000) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
  }

  public check(clientId: string): { allowed: boolean; remaining: number; retryAfterSeconds?: number } {
    const now = Date.now()
    const timestamps = this.requests.get(clientId) || []
    
    // Purge expired timestamps outside the window
    const recent = timestamps.filter((time) => now - time < this.windowMs)

    if (recent.length >= this.maxRequests) {
      const oldest = recent[0]
      const retryAfterSeconds = Math.ceil((oldest + this.windowMs - now) / 1000)
      this.requests.set(clientId, recent)
      return { allowed: false, remaining: 0, retryAfterSeconds }
    }

    recent.push(now)
    this.requests.set(clientId, recent)
    return { allowed: true, remaining: this.maxRequests - recent.length }
  }

  public reset(): void {
    this.requests.clear()
  }
}
