import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { generateConceptsWithGemini } from '../geminiService'
import { AIConceptGenerationRequest } from '../../src/types/ai'

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
    mockGenerateContent.mockImplementation(
      () =>
        new Promise(() => {
          // Intentionally do not resolve or reject to trigger timeout
        }),
    )

    // Set a very short timeout test if needed, or simulate timeout error
    mockGenerateContent.mockRejectedValue(new Error('AI_TIMEOUT: Gemini response timed out'))

    const result = await generateConceptsWithGemini(sampleRequest)

    expect(result.source).toBe('deterministic-demo')
    expect(result.model).toBe('fallback-rule-engine')
    expect(result.notes).toMatch(/Request timed out/i)
    expect(result.concepts).toHaveLength(3)
  })
})

