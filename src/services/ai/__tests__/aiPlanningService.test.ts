import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  fetchServerHealth,
  generateCelebrationConcepts,
  explainScenarioTradeoffs,
} from '../aiPlanningService'
import { SAMPLE_EVENT } from '@/services/storage/sampleData'

describe('Client AI Planning Service (aiPlanningService.ts)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('fetchServerHealth', () => {
    it('returns server health when endpoint responds successfully', async () => {
      const mockHealth = {
        status: 'ok',
        hasGeminiKey: true,
        model: 'gemini-2.5-flash',
        mode: 'live',
        version: '1.0.0',
      }

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockHealth,
      } as Response)

      const result = await fetchServerHealth()
      expect(result.status).toBe('ok')
      expect(result.hasGeminiKey).toBe(true)
      expect(result.mode).toBe('live')
    })

    it('falls back to demo mode when server is offline or fails', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      const result = await fetchServerHealth()
      expect(result.mode).toBe('demo')
      expect(result.hasGeminiKey).toBe(false)
    })
  })

  describe('generateCelebrationConcepts', () => {
    it('returns live concepts when server responds with 200', async () => {
      const mockApiResponse = {
        source: 'gemini-live',
        model: 'gemini-2.5-flash',
        concepts: [
          {
            id: 'c1',
            eventId: SAMPLE_EVENT.id,
            tier: 'budget-conscious',
            title: 'Live AI Budget Concept',
            tagline: 'Tagline',
            description: 'Desc',
            colorPalette: [],
            decor: { focalPoint: '', lighting: '', tableSettings: '', botanicals: '' },
            foodAndBeverage: { serviceStyle: '', highlights: [], signatureDrink: '' },
            entertainment: { mainAct: '', interactiveElements: [] },
            guestExperience: { arrivalMoment: '', takeawayFavor: '', comfortFeatures: [] },
            costEstimation: { estimatedTotal: 30000, varianceFromBudget: -15000, percentOfBudget: 67, disclaimer: '' },
            tradeoffs: { advantages: [], compromises: [] },
          },
          {
            id: 'c2',
            eventId: SAMPLE_EVENT.id,
            tier: 'creative-distinctive',
            title: 'Live AI Creative Concept',
            tagline: 'Tagline',
            description: 'Desc',
            colorPalette: [],
            decor: { focalPoint: '', lighting: '', tableSettings: '', botanicals: '' },
            foodAndBeverage: { serviceStyle: '', highlights: [], signatureDrink: '' },
            entertainment: { mainAct: '', interactiveElements: [] },
            guestExperience: { arrivalMoment: '', takeawayFavor: '', comfortFeatures: [] },
            costEstimation: { estimatedTotal: 44000, varianceFromBudget: -1000, percentOfBudget: 98, disclaimer: '' },
            tradeoffs: { advantages: [], compromises: [] },
          },
          {
            id: 'c3',
            eventId: SAMPLE_EVENT.id,
            tier: 'premium',
            title: 'Live AI Premium Concept',
            tagline: 'Tagline',
            description: 'Desc',
            colorPalette: [],
            decor: { focalPoint: '', lighting: '', tableSettings: '', botanicals: '' },
            foodAndBeverage: { serviceStyle: '', highlights: [], signatureDrink: '' },
            entertainment: { mainAct: '', interactiveElements: [] },
            guestExperience: { arrivalMoment: '', takeawayFavor: '', comfortFeatures: [] },
            costEstimation: { estimatedTotal: 45000, varianceFromBudget: 0, percentOfBudget: 100, disclaimer: '' },
            tradeoffs: { advantages: [], compromises: [] },
          },
        ],
        generatedAt: new Date().toISOString(),
        disclaimer: 'Live AI disclaimer',
      }

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      } as Response)

      const result = await generateCelebrationConcepts(SAMPLE_EVENT)
      expect(result.source).toBe('gemini-live')
      expect(result.concepts).toHaveLength(3)
    })

    it('falls back to deterministic engine gracefully if server request fails', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Server unavailable'))

      const result = await generateCelebrationConcepts(SAMPLE_EVENT)
      expect(result.source).toBe('deterministic-demo')
      expect(result.concepts).toHaveLength(3)
      expect(result.disclaimer).toMatch(/Deterministic Engine/i)
    })
  })

  describe('explainScenarioTradeoffs', () => {
    it('returns trade-off alternatives from server or fallback seamlessly', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Offline'))

      const result = await explainScenarioTradeoffs({
        eventId: SAMPLE_EVENT.id,
        baseline: { category: 'wedding', totalBudget: 45000, guestCount: 80 },
        proposed: { totalBudget: 35000, guestCount: 70 },
        deltas: { budgetDelta: -10000, perGuestDelta: -62, contingencyDelta: -1000 },
        affectedCategories: ['Catering', 'Décor'],
      })

      expect(result.source).toBe('deterministic-demo')
      expect(result.strategicSummary).toMatch(/Budget reduced/i)
      expect(result.culinaryRecommendations.length).toBeGreaterThan(0)
    })
  })
})

