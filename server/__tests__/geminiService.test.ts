import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  isGeminiConfigured,
  generateConceptsWithGemini,
  explainTradeoffsWithGemini,
} from '../geminiService'
import { AIConceptGenerationRequest } from '../../src/types/ai'

describe('Server Gemini AI Service (geminiService.ts)', () => {
  const originalKey = process.env.GEMINI_API_KEY

  beforeEach(() => {
    delete process.env.GEMINI_API_KEY
  })

  afterEach(() => {
    if (originalKey) {
      process.env.GEMINI_API_KEY = originalKey
    } else {
      delete process.env.GEMINI_API_KEY
    }
  })

  const sampleRequest: AIConceptGenerationRequest = {
    eventId: 'evt-test-100',
    title: 'Emerald Garden Anniversary',
    category: 'anniversary',
    city: 'Portland, OR',
    targetGuestCount: 60,
    totalBudget: 25000,
    currency: 'USD',
    themePreference: 'Botanical greenhouse with acoustic strings',
    priorities: ['Intimacy', 'Fine dining'],
    dietaryRequirements: ['Pescatarian'],
    accessibilityRequirements: ['Single-level seating'],
  }

  describe('isGeminiConfigured', () => {
    it('returns false when GEMINI_API_KEY is not set or empty', () => {
      delete process.env.GEMINI_API_KEY
      expect(isGeminiConfigured()).toBe(false)

      process.env.GEMINI_API_KEY = '   '
      expect(isGeminiConfigured()).toBe(false)
    })

    it('returns true when GEMINI_API_KEY is populated', () => {
      process.env.GEMINI_API_KEY = 'AIzaSyFakeKeyForTest12345'
      expect(isGeminiConfigured()).toBe(true)
    })
  })

  describe('Demo Mode Fallback & Honest Labeling', () => {
    it('generates high-fidelity demo concepts when API key is missing', async () => {
      delete process.env.GEMINI_API_KEY

      const result = await generateConceptsWithGemini(sampleRequest)
      expect(result.source).toBe('deterministic-demo')
      expect(result.model).toBe('demo-rule-engine')
      expect(result.disclaimer).toMatch(/Deterministic Demo Engine/i)
      expect(result.concepts).toHaveLength(3)

      const tiers = result.concepts.map((c) => c.tier)
      expect(tiers).toEqual(['budget-conscious', 'creative-distinctive', 'premium'])
    })

    it('strictly enforces deterministic budget arithmetic on all concepts', async () => {
      const budget = 25000
      const result = await generateConceptsWithGemini({ ...sampleRequest, totalBudget: budget })

      const budgetTier = result.concepts.find((c) => c.tier === 'budget-conscious')!
      const creativeTier = result.concepts.find((c) => c.tier === 'creative-distinctive')!
      const premiumTier = result.concepts.find((c) => c.tier === 'premium')!

      // Budget-conscious preserves buffer (~82%)
      expect(budgetTier.costEstimation.percentOfBudget).toBe(82)
      expect(budgetTier.costEstimation.estimatedTotal).toBe(Math.round(budget * 0.82))
      expect(budgetTier.costEstimation.varianceFromBudget).toBe(
        budgetTier.costEstimation.estimatedTotal - budget,
      )

      // Creative tier uses ~98%
      expect(creativeTier.costEstimation.percentOfBudget).toBe(98)
      expect(creativeTier.costEstimation.estimatedTotal).toBe(Math.round(budget * 0.98))

      // Premium tier matches 100%
      expect(premiumTier.costEstimation.percentOfBudget).toBe(100)
      expect(premiumTier.costEstimation.estimatedTotal).toBe(budget)
      expect(premiumTier.costEstimation.varianceFromBudget).toBe(0)
    })
  })

  describe('explainTradeoffsWithGemini', () => {
    it('returns structured tradeoff analysis with culinary & entertainment pivots in demo mode', async () => {
      delete process.env.GEMINI_API_KEY

      const tradeoffReq = {
        eventId: 'evt-test-100',
        baseline: {
          category: 'anniversary',
          totalBudget: 25000,
          guestCount: 60,
        },
        proposed: {
          totalBudget: 20000,
          guestCount: 50,
          dateDeltaDays: 0,
        },
        deltas: {
          budgetDelta: -5000,
          perGuestDelta: -16,
          contingencyDelta: -500,
        },
        affectedCategories: ['Catering', 'Floral'],
      }

      const result = await explainTradeoffsWithGemini(tradeoffReq)
      expect(result.source).toBe('deterministic-demo')
      expect(result.strategicSummary).toMatch(/Budget reduced by \$5,000/i)
      expect(result.culinaryRecommendations.length).toBeGreaterThan(0)
      expect(result.entertainmentAlternatives.length).toBeGreaterThan(0)
      expect(result.budgetSavingTips.length).toBeGreaterThan(0)
      expect(result.guestExperienceRiskMitigation.length).toBeGreaterThan(0)
    })
  })
})
