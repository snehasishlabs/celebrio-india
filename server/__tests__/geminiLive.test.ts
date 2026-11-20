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

describe('Server Gemini Live Generation (Mocked SDK)', () => {
  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'AIzaSyFakeKeyForTestingPurposes123'
    mockGenerateContent.mockReset()
  })

  afterEach(() => {
    delete process.env.GEMINI_API_KEY
  })

  it('successfully generates live concepts using gemini-2.5-flash with source: gemini-live', async () => {
    const mockModelConcepts = [
      {
        id: 'concept-test-budget',
        tier: 'budget-conscious',
        title: 'Minimalist Heritage Elegance',
        tagline: 'Authentic warmth with thoughtful curation',
        description: 'A celebration emphasizing seasonal florals and regional culinary highlights.',
        colorPalette: [
          { name: 'Ivory', hex: '#FAF6F0' },
          { name: 'Forest', hex: '#1B4332' },
          { name: 'Terracotta', hex: '#C86D51' },
          { name: 'Gold', hex: '#C5A059' },
        ],
        decor: {
          focalPoint: 'Brass urli with floating marigolds',
          lighting: 'Warm wash uplighting',
          tableSettings: 'Handloom linen runners',
          botanicals: 'Local tuberose and seasonal jasmine',
        },
        foodAndBeverage: {
          serviceStyle: 'Synchronized live buffet',
          highlights: ['Regional artisanal fish', 'Lentil delicacies'],
          signatureDrink: 'Gondhoraj Lebur Shorbot',
        },
        entertainment: {
          mainAct: 'Acoustic sitar & flute ensemble',
          interactiveElements: ['Guest keepsake calligrapher'],
        },
        guestExperience: {
          arrivalMoment: 'Traditional chandan tilak and welcome beverage',
          takeawayFavor: 'Handcrafted brass diya box',
          comfortFeatures: ['Shaded arrival lounge'],
        },
        tradeoffs: {
          advantages: ['High guest satisfaction', 'Authentic regional charm'],
          compromises: ['Standard lead-time required'],
        },
      },
      {
        id: 'concept-test-creative',
        tier: 'creative-distinctive',
        title: 'Artisanal Botanical Synthesis',
        tagline: 'Bespoke character with immersive guest interaction',
        description: 'Blends terracotta pottery styling with modern ambient lighting design.',
        colorPalette: [{ name: 'Sage', hex: '#778877' }],
        decor: { focalPoint: 'Terracotta arch', lighting: 'Edison glow', tableSettings: 'Ceramic plates', botanicals: 'Ferns' },
        foodAndBeverage: { serviceStyle: 'Chef counters', highlights: ['Custom tastings'], signatureDrink: 'Herb Spritz' },
        entertainment: { mainAct: 'Fusion quartet', interactiveElements: ['Perfume bar'] },
        guestExperience: { arrivalMoment: 'Aperitif hour', takeawayFavor: 'Mini terracotta pot', comfortFeatures: ['Comfort seating'] },
        tradeoffs: { advantages: ['Distinctive aesthetic'], compromises: ['Vendor coordination required'] },
      },
      {
        id: 'concept-test-premium',
        tier: 'premium',
        title: 'Royal Bengal Opulence',
        tagline: 'Uncompromising white-glove celebratory grandeur',
        description: 'High-luxury palace aesthetic with private chamber music and multi-course dining.',
        colorPalette: [{ name: 'Royal Gold', hex: '#D4AF37' }],
        decor: { focalPoint: 'Grand floral chandelier', lighting: 'Crystal candelabras', tableSettings: 'Gilded bone china', botanicals: 'Orchids' },
        foodAndBeverage: { serviceStyle: 'Formal plated feast', highlights: ['Signature banquet'], signatureDrink: 'Saffron Elixir' },
        entertainment: { mainAct: 'Orchestral ensemble', interactiveElements: ['Live portrait artist'] },
        guestExperience: { arrivalMoment: 'Royal trumpets & rose shower', takeawayFavor: 'Silver keepsake', comfortFeatures: ['VIP attendant suite'] },
        tradeoffs: { advantages: ['Exceptional grandeur'], compromises: ['Comprehensive coordination'] },
      },
    ]

    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify(mockModelConcepts),
    })

    const request: AIConceptGenerationRequest = {
      eventId: 'evt-live-001',
      title: 'Debabrata & Ananya Wedding',
      category: 'wedding',
      city: 'Kolkata',
      targetGuestCount: 150,
      totalBudget: 500000,
      currency: 'INR',
    }

    const response = await generateConceptsWithGemini(request)

    expect(response.source).toBe('gemini-live')
    expect(response.model).toBe('gemini-2.5-flash')
    expect(response.concepts).toHaveLength(3)
    expect(response.concepts[0].title).toBe('Minimalist Heritage Elegance')
    // Financial numbers are strictly enforced deterministically
    expect(response.concepts[0].costEstimation.percentOfBudget).toBe(82)
    expect(response.concepts[1].costEstimation.percentOfBudget).toBe(98)
    expect(response.concepts[2].costEstimation.percentOfBudget).toBe(100)
    // Never leaks the API key
    expect(JSON.stringify(response)).not.toContain('AIzaSyFakeKey')
  })

  it('successfully generates live trade-off explanations with source: gemini-live', async () => {
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({
        strategicSummary: 'Reducing budget by ₹50,000 can be smoothly absorbed by shifting from plated service to live buffet.',
        culinaryRecommendations: ['Transition to curated regional buffet stations', 'Feature seasonal mocktail bar'],
        entertainmentAlternatives: ['Book acoustic duo for cocktail reception with professional DJ for evening'],
        budgetSavingTips: ['Repurpose ceremony mandap florals for the dining stage', 'Use elegant digital RSVPs'],
        guestExperienceRiskMitigation: ['Provide shaded welcome reception area', 'Freeze final headcount 14 days prior'],
      }),
    })

    const request: AITradeoffExplanationRequest = {
      eventId: 'evt-live-002',
      baseline: { category: 'wedding', totalBudget: 400000, guestCount: 150 },
      proposed: { totalBudget: 350000, guestCount: 140 },
      deltas: { budgetDelta: -50000, perGuestDelta: -160, contingencyDelta: -4000 },
      affectedCategories: ['Catering', 'Decor'],
    }

    const response = await explainTradeoffsWithGemini(request)

    expect(response.source).toBe('gemini-live')
    expect(response.model).toBe('gemini-2.5-flash')
    expect(response.strategicSummary).toMatch(/Reducing budget by/i)
    expect(response.culinaryRecommendations).toHaveLength(2)
    expect(response.budgetSavingTips).toHaveLength(2)
  })

  it('successfully generates live Copilot task advice with source: gemini-live and proposedAction', async () => {
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({
        headline: 'Critical Planning Roadmap for Kolkata Celebration',
        strategicSummary: 'Locking heritage venue is the immediate anchor to protect your celebration date.',
        urgentTaskAnalyses: [
          {
            taskId: 't-venue',
            taskTitle: 'Execute Venue Contract',
            urgencyLevel: 'critical',
            daysUntilDeadline: 5,
            whyItMatters: 'Heritage banquets book 6 months ahead.',
            recommendedAction: 'Execute agreement and transfer deposit.',
            culturalContext: 'Verify sacred fire mandap space.',
          },
        ],
        traditionAdvisories: ['Coordinate Gaye Holud morning sunlight.'],
        budgetGuidance: 'Protect your 8% contingency buffer.',
        suggestedNextSteps: ['Sign venue agreement.', 'Approve catering draft.'],
        clarifyingQuestion: 'Do you need open courtyard space?',
        proposedAction: {
          actionType: 'UPDATE_BUDGET',
          title: 'Apply Budget Optimization',
          explanation: 'Re-align budget to protect contingency.',
          impactSummary: 'Ring-fences 8% reserve.',
          payload: { totalBudget: 300000 },
        },
      }),
    })

    const request: AICopilotTaskAdviceRequest = {
      eventId: 'evt-live-003',
      eventTitle: 'Kolkata Biye',
      category: 'wedding',
      city: 'Kolkata',
      targetGuestCount: 150,
      totalBudget: 300000,
      currency: 'INR',
      urgentTasks: [
        {
          id: 't-venue',
          title: 'Execute Venue Contract',
          priority: 'critical',
          isCriticalPath: true,
          phase: 'concept-planning',
          status: 'todo',
        },
      ],
    }

    const response = await explainUrgentTasksWithGemini(request)

    expect(response.source).toBe('gemini-live')
    expect(response.model).toBe('gemini-2.5-flash')
    expect(response.headline).toMatch(/Critical Planning Roadmap/i)
    expect(response.urgentTaskAnalyses[0].taskId).toBe('t-venue')
    expect(response.proposedAction?.actionType).toBe('UPDATE_BUDGET')
  })
})

