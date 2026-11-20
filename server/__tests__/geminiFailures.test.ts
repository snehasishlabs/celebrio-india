import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  generateConceptsWithGemini,
  explainTradeoffsWithGemini,
  explainUrgentTasksWithGemini,
} from '../geminiService'
import {
  AIConceptGenerationRequest,
  AITradeoffExplanationRequest,
  AICopilotTaskAdviceRequest,
} from '../../src/types/ai'

const mockGenerateContent = vi.fn()

// Mock @google/genai SDK
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class MockGoogleGenAI {
      models = {
        generateContent: mockGenerateContent,
      }
    },
  }
})

describe('Gemini Service Provider Failures & Malformed Output Recovery', () => {
  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'test-key-mock'
    mockGenerateContent.mockReset()
  })

  afterEach(() => {
    delete process.env.GEMINI_API_KEY
  })

  const sampleRequest: AIConceptGenerationRequest = {
    eventId: 'evt-fail-test',
    title: 'Autumn Harvest Celebration',
    category: 'community',
    city: 'Portland, OR',
    targetGuestCount: 150,
    totalBudget: 30000,
    currency: 'USD',
  }

  it('recovers gracefully when Gemini provider encounters a 403 or 401 authentication error', async () => {
    mockGenerateContent.mockRejectedValue(new Error('Google Generative AI 403: API key not valid. Please pass a valid API key.'))

    const result = await generateConceptsWithGemini(sampleRequest)

    expect(result.source).toBe('deterministic-demo')
    expect(result.model).toBe('fallback-rule-engine')
    expect(result.notes).toMatch(/Fallback recovery activated/i)
    expect(result.concepts).toHaveLength(3)
    expect(result.concepts[0].costEstimation.estimatedTotal).toBeGreaterThan(0)
    // Verify no secret leakage
    expect(JSON.stringify(result)).not.toContain('test-key-mock')
  })

  it('recovers gracefully when Gemini provider encounters a 500 error or rate limit', async () => {
    mockGenerateContent.mockRejectedValue(new Error('Google Generative AI 429: Resource has been exhausted'))

    const result = await generateConceptsWithGemini(sampleRequest)

    expect(result.source).toBe('deterministic-demo')
    expect(result.model).toBe('fallback-rule-engine')
    expect(result.notes).toMatch(/Fallback recovery activated/i)
    expect(result.concepts).toHaveLength(3)
    expect(result.concepts[0].costEstimation.estimatedTotal).toBeGreaterThan(0)
  })

  it('recovers gracefully when model returns malformed non-JSON output', async () => {
    mockGenerateContent.mockResolvedValue({
      text: 'Sorry, I cannot generate JSON right now. Here is some freeform text instead...',
    })

    const result = await generateConceptsWithGemini(sampleRequest)

    expect(result.source).toBe('deterministic-demo')
    expect(result.model).toBe('fallback-rule-engine')
    expect(result.concepts).toHaveLength(3)
  })

  it('recovers gracefully when model returns incomplete concepts array', async () => {
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify([{ title: 'Only One Concept' }]),
    })

    const result = await generateConceptsWithGemini(sampleRequest)

    expect(result.source).toBe('deterministic-demo')
    expect(result.model).toBe('fallback-rule-engine')
    expect(result.concepts).toHaveLength(3)
  })

  it('recovers gracefully when request times out', async () => {
    mockGenerateContent.mockRejectedValue(new Error('AI_TIMEOUT: Gemini response timed out'))

    const result = await generateConceptsWithGemini(sampleRequest)

    expect(result.source).toBe('deterministic-demo')
    expect(result.model).toBe('fallback-rule-engine')
    expect(result.notes).toMatch(/Request timed out/i)
    expect(result.concepts).toHaveLength(3)
  })

  it('recovers gracefully in explainTradeoffsWithGemini when Gemini encounters an error', async () => {
    mockGenerateContent.mockRejectedValue(new Error('AI_TIMEOUT: Trade-off generation timed out'))

    const tradeoffReq: AITradeoffExplanationRequest = {
      eventId: 'evt-fail-tradeoff',
      baseline: { category: 'wedding', totalBudget: 50000, guestCount: 100 },
      proposed: { totalBudget: 40000, guestCount: 80 },
      deltas: { budgetDelta: -10000, perGuestDelta: -20, contingencyDelta: -800 },
      affectedCategories: ['Catering'],
    }

    const result = await explainTradeoffsWithGemini(tradeoffReq)

    expect(result.source).toBe('deterministic-demo')
    expect(result.model).toBe('fallback-rule-engine')
    expect(result.strategicSummary).toMatch(/calibrated fallback mode/i)
    expect(result.culinaryRecommendations.length).toBeGreaterThan(0)
  })

  it('recovers gracefully in explainUrgentTasksWithGemini when Gemini encounters an error', async () => {
    mockGenerateContent.mockRejectedValue(new Error('Google Generative AI 500: Internal server error'))

    const copilotReq: AICopilotTaskAdviceRequest = {
      eventId: 'evt-fail-copilot',
      eventTitle: 'Test Celebration',
      category: 'wedding',
      city: 'Kolkata',
      targetGuestCount: 150,
      totalBudget: 300000,
      currency: 'INR',
      urgentTasks: [
        {
          id: 't-fail',
          title: 'Lock Venue',
          priority: 'critical',
          isCriticalPath: true,
          status: 'todo',
          phase: 'concept-planning',
        },
      ],
    }

    const result = await explainUrgentTasksWithGemini(copilotReq)

    expect(result.source).toBe('deterministic-demo')
    expect(result.model).toBe('fallback-rule-engine')
    expect(result.headline).toBeDefined()
    expect(result.urgentTaskAnalyses.length).toBeGreaterThan(0)
  })
})
