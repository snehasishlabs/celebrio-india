import { describe, it, expect, beforeEach } from 'vitest'
import { validateConceptRequest, validateTradeoffRequest, RateLimiter } from '../validator'

describe('Server Request Validation (validator.ts)', () => {
  describe('validateConceptRequest', () => {
    const validPayload = {
      eventId: 'evt-12345',
      title: 'Serene Botanical Wedding',
      category: 'wedding',
      city: 'Seattle, WA',
      targetGuestCount: 120,
      totalBudget: 45000,
      currency: 'USD',
      themePreference: 'Modern rustic with eucalyptus foliage',
      priorities: ['Photography', 'Catering quality'],
      dietaryRequirements: ['Vegetarian', 'Gluten-free'],
      accessibilityRequirements: ['Wheelchair accessible entrance'],
    }

    it('validates a compliant celebration planning payload successfully', () => {
      const res = validateConceptRequest(validPayload)
      expect(res.isValid).toBe(true)
      expect(res.errors).toHaveLength(0)
      expect(res.sanitized).toBeDefined()
      expect(res.sanitized?.title).toBe('Serene Botanical Wedding')
      expect(res.sanitized?.targetGuestCount).toBe(120)
      expect(res.sanitized?.totalBudget).toBe(45000)
    })

    it('rejects missing or empty title', () => {
      const res = validateConceptRequest({ ...validPayload, title: '' })
      expect(res.isValid).toBe(false)
      expect(res.errors[0]).toMatch(/title is required/i)
    })

    it('rejects titles exceeding 100 characters', () => {
      const longTitle = 'A'.repeat(101)
      const res = validateConceptRequest({ ...validPayload, title: longTitle })
      expect(res.isValid).toBe(false)
      expect(res.errors[0]).toMatch(/exceeds maximum length/i)
    })

    it('rejects unallowed event categories', () => {
      const res = validateConceptRequest({ ...validPayload, category: 'unknown-category' })
      expect(res.isValid).toBe(false)
      expect(res.errors[0]).toMatch(/category must be one of/i)
    })

    it('rejects out-of-bound guest counts (< 1 or > 10,000)', () => {
      const tooLow = validateConceptRequest({ ...validPayload, targetGuestCount: 0 })
      expect(tooLow.isValid).toBe(false)

      const tooHigh = validateConceptRequest({ ...validPayload, targetGuestCount: 15000 })
      expect(tooHigh.isValid).toBe(false)

      const nonInteger = validateConceptRequest({ ...validPayload, targetGuestCount: 45.5 })
      expect(nonInteger.isValid).toBe(false)
    })

    it('rejects non-finite, negative, or excessive budget numbers', () => {
      const negative = validateConceptRequest({ ...validPayload, totalBudget: -500 })
      expect(negative.isValid).toBe(false)

      const tooLow = validateConceptRequest({ ...validPayload, totalBudget: 50 })
      expect(tooLow.isValid).toBe(false)

      const excessive = validateConceptRequest({ ...validPayload, totalBudget: 100000000 })
      expect(excessive.isValid).toBe(false)

      const nanVal = validateConceptRequest({ ...validPayload, totalBudget: NaN })
      expect(nanVal.isValid).toBe(false)
    })

    it('bounds array item counts and lengths for priorities and dietary requirements', () => {
      const excessiveArray = Array.from({ length: 15 }, (_, i) => `Priority ${i}`)
      const res = validateConceptRequest({ ...validPayload, priorities: excessiveArray })
      expect(res.isValid).toBe(false)
      expect(res.errors[0]).toMatch(/contains more than 10 items/i)
    })
  })

  describe('validateTradeoffRequest', () => {
    const validTradeoff = {
      eventId: 'evt-tradeoff-1',
      baseline: {
        category: 'wedding',
        totalBudget: 50000,
        guestCount: 100,
      },
      proposed: {
        totalBudget: 42000,
        guestCount: 90,
        dateDeltaDays: -14,
        venueType: 'indoor',
      },
      deltas: {
        budgetDelta: -8000,
        perGuestDelta: -33,
        contingencyDelta: -800,
      },
      affectedCategories: ['Catering', 'Décor'],
    }

    it('validates a well-formed tradeoff replanning request', () => {
      const res = validateTradeoffRequest(validTradeoff)
      expect(res.isValid).toBe(true)
      expect(res.sanitized?.deltas.budgetDelta).toBe(-8000)
    })

    it('rejects request with missing baseline or deltas', () => {
      const missingBaseline = validateTradeoffRequest({ ...validTradeoff, baseline: null })
      expect(missingBaseline.isValid).toBe(false)

      const missingDeltas = validateTradeoffRequest({ ...validTradeoff, deltas: null })
      expect(missingDeltas.isValid).toBe(false)
    })
  })

  describe('RateLimiter', () => {
    let limiter: RateLimiter

    beforeEach(() => {
      limiter = new RateLimiter(3, 10000) // 3 requests per 10s
    })

    it('allows requests within threshold and blocks excess requests', () => {
      const ip = '192.168.1.1'
      expect(limiter.check(ip).allowed).toBe(true)
      expect(limiter.check(ip).allowed).toBe(true)
      expect(limiter.check(ip).allowed).toBe(true)

      const fourth = limiter.check(ip)
      expect(fourth.allowed).toBe(false)
      expect(fourth.remaining).toBe(0)
      expect(fourth.retryAfterSeconds).toBeGreaterThan(0)
    })

    it('tracks distinct client IPs independently', () => {
      const ip1 = '192.168.1.1'
      const ip2 = '10.0.0.1'

      limiter.check(ip1)
      limiter.check(ip1)
      limiter.check(ip1)
      expect(limiter.check(ip1).allowed).toBe(false)

      // IP 2 is still fresh
      expect(limiter.check(ip2).allowed).toBe(true)
    })

    it('resets all limits on demand', () => {
      const ip = '192.168.1.1'
      limiter.check(ip)
      limiter.check(ip)
      limiter.check(ip)
      expect(limiter.check(ip).allowed).toBe(false)

      limiter.reset()
      expect(limiter.check(ip).allowed).toBe(true)
    })
  })
})

