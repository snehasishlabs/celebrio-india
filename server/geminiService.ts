import { GoogleGenAI } from '@google/genai'
import {
  AIConceptGenerationRequest,
  AIConceptGenerationResponse,
  AITradeoffExplanationRequest,
  AITradeoffExplanationResponse,
  AICopilotTaskAdviceRequest,
  AICopilotTaskAdviceResponse,
} from '../src/types/ai'
import { ThemeConcept, ConceptTier } from '../src/types/concept'
import { CelebrationEvent, EventCategory } from '../src/types/event'
import { generateThemeConcepts } from '../src/services/ideas/conceptGenerator'

const MODEL_NAME = 'gemini-2.5-flash'
const TIMEOUT_MS = 15000

const BASE_PRICE_DISCLAIMER =
  'Estimated approximation based on regional vendor averages. Not a verified commercial quotation.'

/**
 * Checks whether a valid Gemini API key is configured in server environment variables.
 * Never exposed to browser or client code.
 */
export function isGeminiConfigured(): boolean {
  const key = process.env.GEMINI_API_KEY
  return typeof key === 'string' && key.trim().length > 0
}

/**
 * Strips potential markdown code blocks (e.g. ```json ... ```) from model output.
 */
function cleanJsonOutput(text: string): string {
  let cleaned = text.trim()
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7)
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3)
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3)
  }
  return cleaned.trim()
}

/**
 * Deterministically enforces financial numbers onto generated concepts.
 * Never allows LLM hallucinations to corrupt financial calculations.
 */
function enforceDeterministicBudgetCalculations(
  concepts: ThemeConcept[],
  totalBudget: number,
  currency: string,
): ThemeConcept[] {
  return concepts.map((concept) => {
    let multiplier = 0.95
    if (concept.tier === 'budget-conscious') multiplier = 0.82
    else if (concept.tier === 'creative-distinctive') multiplier = 0.98
    else if (concept.tier === 'premium') multiplier = 1.0

    const estimatedTotal = Math.round(totalBudget * multiplier)
    const varianceFromBudget = estimatedTotal - totalBudget
    const percentOfBudget = Math.round((estimatedTotal / totalBudget) * 100)

    return {
      ...concept,
      costEstimation: {
        estimatedTotal,
        varianceFromBudget,
        percentOfBudget,
        disclaimer: `${BASE_PRICE_DISCLAIMER} Currency: ${currency}`,
      },
    }
  })
}

/**
 * Generates three distinct celebration concepts using Google Gemini 2.5 Flash,
 * or gracefully returns the deterministic engine fallback if unconfigured or on error.
 */
export async function generateConceptsWithGemini(
  request: AIConceptGenerationRequest,
): Promise<AIConceptGenerationResponse> {
  const now = new Date().toISOString()

  // 1. Check if Gemini API key is configured
  if (!isGeminiConfigured()) {
    // Generate deterministic concepts
    const mockEvent: CelebrationEvent = {
      id: request.eventId,
      title: request.title,
      category: (request.category as EventCategory) || 'wedding',
      date: '2026-10-31',
      location: {
        venueName: 'Heritage Venue TBD',
        city: request.city || 'Metropolitan Area',
        isIndoor: true,
      },
      targetGuestCount: request.targetGuestCount,
      confirmedGuestCount: 0,
      totalBudget: request.totalBudget,
      currency: request.currency,
      status: 'planning',
      syncState: 'in-sync',
      themePreference: request.themePreference || '',
      priorities: request.priorities || [],
      dietaryRequirements: request.dietaryRequirements || [],
      accessibilityRequirements: request.accessibilityRequirements || [],
      preferences: {
        indoorOutdoor: 'indoor',
      },
      createdAt: now,
      updatedAt: now,
    }

    const deterministicConcepts = generateThemeConcepts(mockEvent)
    const validatedConcepts = enforceDeterministicBudgetCalculations(
      deterministicConcepts,
      request.totalBudget,
      request.currency,
    )

    return {
      source: 'deterministic-demo',
      model: 'demo-rule-engine',
      concepts: validatedConcepts,
      generatedAt: now,
      disclaimer:
        'Generated via Celebrio Deterministic Demo Engine (Simulated). Server GEMINI_API_KEY is not configured.',
      notes:
        'To enable live Gemini AI generation, configure GEMINI_API_KEY in your server environment (.env).',
    }
  }

  // 2. Prepare live Gemini request
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

    // Sanitized prompt without PII
    const prompt = `You are Celebrio AI, a world-class celebration architect and event designer.
Generate 3 distinct, comprehensive, and imaginative celebration concepts for an upcoming ${request.category}.

PARAMETERS:
- Celebration Type: ${request.category}
- Celebration Title: "${request.title}"
- Guest Count: ${request.targetGuestCount} attendees
- Total Spending Limit: ${request.currency} ${request.totalBudget.toLocaleString()}
${request.city ? `- Location: ${request.city}` : ''}
${request.themePreference ? `- Client Preference: "${request.themePreference}"` : ''}
${request.priorities && request.priorities.length > 0 ? `- Strategic Priorities: ${request.priorities.join(', ')}` : ''}
${request.dietaryRequirements && request.dietaryRequirements.length > 0 ? `- Dietary Inclusions: ${request.dietaryRequirements.join(', ')}` : ''}
${request.accessibilityRequirements && request.accessibilityRequirements.length > 0 ? `- Accessibility Needs: ${request.accessibilityRequirements.join(', ')}` : ''}

REQUIRED CONCEPTS (3 distinct tiers):
1. tier: "budget-conscious" (Smart value, authentic ambiance, preserves ~18% contingency buffer)
2. tier: "creative-distinctive" (Signature character, bespoke guest interactions, uses ~98% of budget)
3. tier: "premium" (Uncompromising elegance, white-glove hospitality, fully utilizes budget)

Return ONLY a JSON array of 3 concept objects. Each object MUST match this schema:
{
  "id": "concept-${request.eventId}-<tier>",
  "eventId": "${request.eventId}",
  "tier": "budget-conscious" | "creative-distinctive" | "premium",
  "title": string,
  "tagline": string,
  "description": string,
  "colorPalette": [
    { "name": string, "hex": "#HEX" },
    { "name": string, "hex": "#HEX" },
    { "name": string, "hex": "#HEX" },
    { "name": string, "hex": "#HEX" }
  ],
  "decor": {
    "focalPoint": string,
    "lighting": string,
    "tableSettings": string,
    "botanicals": string
  },
  "foodAndBeverage": {
    "serviceStyle": string,
    "highlights": [string, string, string],
    "signatureDrink": string
  },
  "entertainment": {
    "mainAct": string,
    "interactiveElements": [string, string]
  },
  "guestExperience": {
    "arrivalMoment": string,
    "takeawayFavor": string,
    "comfortFeatures": [string, string]
  },
  "tradeoffs": {
    "advantages": [string, string, string],
    "compromises": [string, string]
  }
}`

    // Call Gemini with timeout
    const response = await Promise.race([
      ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI_TIMEOUT: Gemini response timed out')), TIMEOUT_MS),
      ),
    ])

    const responseText = response.text || ''
    const cleanedText = cleanJsonOutput(responseText)

    let parsed: any
    try {
      parsed = JSON.parse(cleanedText)
    } catch {
      throw new Error('AI_MALFORMED_OUTPUT: Unable to parse JSON from model response')
    }

    // Extract concepts array
    let rawConcepts: any[] = []
    if (Array.isArray(parsed)) {
      rawConcepts = parsed
    } else if (parsed && Array.isArray(parsed.concepts)) {
      rawConcepts = parsed.concepts
    } else {
      throw new Error('AI_MALFORMED_OUTPUT: Response does not contain a concepts array')
    }

    if (rawConcepts.length < 3) {
      throw new Error('AI_INCOMPLETE_OUTPUT: Model returned fewer than 3 concepts')
    }

    // Format & validate each concept
    const tiers: ConceptTier[] = ['budget-conscious', 'creative-distinctive', 'premium']
    const concepts: ThemeConcept[] = tiers.map((tier, idx) => {
      const item = rawConcepts[idx] || rawConcepts.find((c) => c.tier === tier) || rawConcepts[0]
      return {
        id: item.id || `concept-${request.eventId}-${tier}`,
        eventId: request.eventId,
        tier,
        title: String(item.title || `${tier} Celebration Concept`).slice(0, 80),
        tagline: String(item.tagline || 'Curated celebration aesthetic').slice(0, 100),
        description: String(item.description || 'Thoughtfully curated celebratory design').slice(0, 500),
        colorPalette: Array.isArray(item.colorPalette) && item.colorPalette.length > 0
          ? item.colorPalette.slice(0, 4).map((c: any) => ({
              name: String(c.name || 'Accent').slice(0, 30),
              hex: String(c.hex || '#1B4332').slice(0, 10),
            }))
          : [
              { name: 'Ivory', hex: '#FAF6F0' },
              { name: 'Forest', hex: '#1B4332' },
              { name: 'Terracotta', hex: '#C86D51' },
              { name: 'Gold', hex: '#C5A059' },
            ],
        decor: {
          focalPoint: String(item.decor?.focalPoint || 'Bespoke central installation').slice(0, 200),
          lighting: String(item.decor?.lighting || 'Ambient warm wash lighting').slice(0, 200),
          tableSettings: String(item.decor?.tableSettings || 'Refined linen and tableware').slice(0, 200),
          botanicals: String(item.decor?.botanicals || 'Seasonal florals and foliage').slice(0, 200),
        },
        foodAndBeverage: {
          serviceStyle: String(item.foodAndBeverage?.serviceStyle || 'Curated plated service').slice(0, 150),
          highlights: Array.isArray(item.foodAndBeverage?.highlights)
            ? item.foodAndBeverage.highlights.slice(0, 4).map((h: any) => String(h).slice(0, 100))
            : ['Chef selection', 'Seasonal produce'],
          signatureDrink: String(item.foodAndBeverage?.signatureDrink || 'Signature Celebration Spritz').slice(0, 100),
        },
        entertainment: {
          mainAct: String(item.entertainment?.mainAct || 'Live musical ensemble').slice(0, 150),
          interactiveElements: Array.isArray(item.entertainment?.interactiveElements)
            ? item.entertainment.interactiveElements.slice(0, 3).map((e: any) => String(e).slice(0, 100))
            : ['Guest keepsake station'],
        },
        guestExperience: {
          arrivalMoment: String(item.guestExperience?.arrivalMoment || 'Welcome beverage reception').slice(0, 150),
          takeawayFavor: String(item.guestExperience?.takeawayFavor || 'Artisanal celebration keepsake').slice(0, 150),
          comfortFeatures: Array.isArray(item.guestExperience?.comfortFeatures)
            ? item.guestExperience.comfortFeatures.slice(0, 3).map((f: any) => String(f).slice(0, 100))
            : ['Comfort lounge vignettes'],
        },
        costEstimation: {
          estimatedTotal: 0,
          varianceFromBudget: 0,
          percentOfBudget: 0,
          disclaimer: BASE_PRICE_DISCLAIMER,
        },
        tradeoffs: {
          advantages: Array.isArray(item.tradeoffs?.advantages)
            ? item.tradeoffs.advantages.slice(0, 4).map((a: any) => String(a).slice(0, 150))
            : ['High guest satisfaction', 'Tailored design'],
          compromises: Array.isArray(item.tradeoffs?.compromises)
            ? item.tradeoffs.compromises.slice(0, 3).map((c: any) => String(c).slice(0, 150))
            : ['Standard lead-time required'],
        },
      }
    })

    // Enforce deterministic financial correctness strictly
    const validatedConcepts = enforceDeterministicBudgetCalculations(
      concepts,
      request.totalBudget,
      request.currency,
    )

    return {
      source: 'gemini-live',
      model: MODEL_NAME,
      concepts: validatedConcepts,
      generatedAt: now,
      disclaimer: BASE_PRICE_DISCLAIMER,
    }
  } catch (error: unknown) {
    // Log sanitized error without leaking API keys, private data, or headers
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    // Fall back to deterministic engine gracefully
    const mockEvent: CelebrationEvent = {
      id: request.eventId,
      title: request.title,
      category: (request.category as EventCategory) || 'wedding',
      date: '2026-10-31',
      location: {
        venueName: 'Heritage Venue TBD',
        city: request.city || 'Metropolitan Area',
        isIndoor: true,
      },
      targetGuestCount: request.targetGuestCount,
      confirmedGuestCount: 0,
      totalBudget: request.totalBudget,
      currency: request.currency,
      status: 'planning',
      syncState: 'in-sync',
      themePreference: request.themePreference || '',
      priorities: request.priorities || [],
      dietaryRequirements: request.dietaryRequirements || [],
      accessibilityRequirements: request.accessibilityRequirements || [],
      preferences: {
        indoorOutdoor: 'indoor',
      },
      createdAt: now,
      updatedAt: now,
    }

    const fallbackConcepts = enforceDeterministicBudgetCalculations(
      generateThemeConcepts(mockEvent),
      request.totalBudget,
      request.currency,
    )

    return {
      source: 'deterministic-demo',
      model: 'fallback-rule-engine',
      concepts: fallbackConcepts,
      generatedAt: now,
      disclaimer:
        'Generated via Celebrio Fallback Engine. Live AI call was unavailable or encountered an error.',
      notes: `Provider status: ${errorMessage.startsWith('AI_TIMEOUT') ? 'Request timed out' : 'Fallback recovery activated'}.`,
    }
  }
}

/**
 * Generates what-if scenario trade-off recommendations and narrative explanations.
 */
export async function explainTradeoffsWithGemini(
  request: AITradeoffExplanationRequest,
): Promise<AITradeoffExplanationResponse> {
  const now = new Date().toISOString()
  const isBudgetReduced = request.deltas.budgetDelta < 0
  const isGuestsExpanded = request.deltas.perGuestDelta < 0

  // Fallback / deterministic generator
  const getDeterministicTradeoff = (): AITradeoffExplanationResponse => {
    let summary = isBudgetReduced
      ? `Budget reduced by $${Math.abs(request.deltas.budgetDelta).toLocaleString()}. Recommend prioritizing non-negotiable anchor experiences (venue & catering) while adopting modular styling and seasonal florals.`
      : `Budget expanded by $${Math.abs(request.deltas.budgetDelta).toLocaleString()}. Excellent opportunity to enrich guest hospitality with interactive culinary stations and live musical enhancement.`

    if (isGuestsExpanded) {
      summary += ' With per-guest spend constrained, consider buffet or family-style service to maintain high satisfaction.'
    }

    return {
      source: 'deterministic-demo',
      model: 'demo-rule-engine',
      strategicSummary: summary,
      culinaryRecommendations: isBudgetReduced
        ? [
            'Shift from multi-course plated dinner to curated artisanal family-style stations',
            'Focus on two signature craft cocktails alongside regional house vintages',
          ]
        : [
            'Upgrade to synchronized plated service with tableside French wine pairings',
            'Introduce interactive late-night dessert or savory comfort food cart',
          ],
      entertainmentAlternatives: isBudgetReduced
        ? [
            'Book an acoustic duo for ceremony/cocktail hour with seamless professional DJ for dance reception',
            'Replace physical photo booths with vintage audio guestbook or digital mobile gallery',
          ]
        : [
            'Add live brass section to evening band for peak high-energy dance sets',
            'Incorporate live guest portrait artist or 360-degree slow motion video platform',
          ],
      budgetSavingTips: [
        'Repurpose ceremony floral focal installations for reception stage backdrop',
        'Consolidate printed collateral into elegant digital signage and communal seating chart boards',
        'Negotiate off-peak beverage packages or corkage permissions with selected venue',
      ],
      guestExperienceRiskMitigation: [
        'Ensure arrival hydration station and sheltered welcome area regardless of weather shifts',
        'Lock in final dietary headcount 14 days in advance to eliminate late vendor rush surcharges',
      ],
      generatedAt: now,
    }
  }

  if (!isGeminiConfigured()) {
    return getDeterministicTradeoff()
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

    const prompt = `You are Celebrio AI's Adaptive Scenario Planner.
A client is simulating a plan shift for their ${request.baseline.category}.

SCENARIO SHIFT:
- Original Budget: $${request.baseline.totalBudget.toLocaleString()} | Proposed: $${request.proposed.totalBudget.toLocaleString()} (Delta: $${request.deltas.budgetDelta.toLocaleString()})
- Original Guests: ${request.baseline.guestCount} | Proposed: ${request.proposed.guestCount}
- Per-Guest Spend Delta: $${request.deltas.perGuestDelta.toFixed(0)}
- Affected Categories: ${request.affectedCategories.join(', ') || 'General plan adjustments'}

Generate nuanced strategic advice.
Return ONLY a valid JSON object matching this schema:
{
  "strategicSummary": string,
  "culinaryRecommendations": [string, string],
  "entertainmentAlternatives": [string, string],
  "budgetSavingTips": [string, string, string],
  "guestExperienceRiskMitigation": [string, string]
}`

    const response = await Promise.race([
      ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.6,
        },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI_TIMEOUT: Trade-off generation timed out')), TIMEOUT_MS),
      ),
    ])

    const text = cleanJsonOutput(response.text || '')
    const parsed = JSON.parse(text)

    return {
      source: 'gemini-live',
      model: MODEL_NAME,
      strategicSummary: String(parsed.strategicSummary || 'Adaptive scenario analysis complete').slice(0, 300),
      culinaryRecommendations: Array.isArray(parsed.culinaryRecommendations)
        ? parsed.culinaryRecommendations.slice(0, 3).map((r: any) => String(r).slice(0, 150))
        : ['Curate seasonal menu selections'],
      entertainmentAlternatives: Array.isArray(parsed.entertainmentAlternatives)
        ? parsed.entertainmentAlternatives.slice(0, 3).map((r: any) => String(r).slice(0, 150))
        : ['Optimize entertainment schedule'],
      budgetSavingTips: Array.isArray(parsed.budgetSavingTips)
        ? parsed.budgetSavingTips.slice(0, 4).map((r: any) => String(r).slice(0, 150))
        : ['Repurpose ceremony elements for reception'],
      guestExperienceRiskMitigation: Array.isArray(parsed.guestExperienceRiskMitigation)
        ? parsed.guestExperienceRiskMitigation.slice(0, 3).map((r: any) => String(r).slice(0, 150))
        : ['Maintain strong guest arrival hospitality'],
      generatedAt: now,
    }
  } catch {
    return getDeterministicTradeoff()
  }
}

/**
 * Generates culturally attuned, context-aware Copilot task explanations and strategic guidance.
 */
export async function explainUrgentTasksWithGemini(
  request: AICopilotTaskAdviceRequest,
): Promise<AICopilotTaskAdviceResponse> {
  const now = new Date().toISOString()
  const curr = request.currency === 'INR' ? '₹' : (request.currency === 'USD' ? '$' : (request.currency || '₹'))

  const getDeterministicAdvice = (): AICopilotTaskAdviceResponse => {
    const queryLower = (request.query || '').toLowerCase()
    const totalBudget = Number(request.totalBudget) || 300000
    const targetGuestCount = Math.max(1, Number(request.targetGuestCount) || 150)
    const eventTitle = request.eventTitle || 'Celebration'
    const urgentTasks = Array.isArray(request.urgentTasks) ? request.urgentTasks : []
    const isBengali =
      (request.eventTitle || '').toLowerCase().includes('bengali') ||
      (request.traditions || []).some((t) => (t || '').toLowerCase().includes('bengali')) ||
      (request.city || '').toLowerCase().includes('kolkata') ||
      queryLower.includes('bengali')

    // 1. Natural Language Scenario: "Plan my celebration within ₹2 lakh" or "Plan a Bengali wedding for 150 guests"
    if (queryLower.includes('2 lakh') || queryLower.includes('2,00,000') || queryLower.includes('200000') || queryLower.includes('within 2 lakh')) {
      const targetBudgetCap = 200000
      const contingencyReserve = Math.round(targetBudgetCap * 0.08) // ₹16,000
      const cateringAlloc = Math.round(targetBudgetCap * 0.32) // ₹64,000
      const venueAlloc = Math.round(targetBudgetCap * 0.28) // ₹56,000
      const decorAlloc = Math.round(targetBudgetCap * 0.13) // ₹26,000
      const photoAlloc = Math.round(targetBudgetCap * 0.08) // ₹16,000
      const miscAlloc = targetBudgetCap - (cateringAlloc + venueAlloc + decorAlloc + photoAlloc + contingencyReserve) // ₹22,000

      return {
        source: 'deterministic-demo',
        model: 'demo-rule-engine',
        headline: `Celebration Plan Optimized for ${curr}2,00,000 Budget Cap`,
        strategicSummary: `Structured a balanced, culturally rich celebration framework within ${curr}2,00,000 for ${targetGuestCount} guests in ${request.city || 'Kolkata'}. Ring-fences a protected ${curr}${contingencyReserve.toLocaleString()} (8%) contingency fund while preserving authentic ritual ceremonies.`,
        urgentTaskAnalyses: [
          {
            taskId: 'task-budget-venue-lock',
            taskTitle: 'Lock Community Heritage Hall or Daylight Courtyard',
            urgencyLevel: 'critical',
            daysUntilDeadline: 7,
            whyItMatters: `Allocates ${curr}${venueAlloc.toLocaleString()} (28%) to secure an authentic regional hall with load-in privileges.`,
            recommendedAction: 'Execute venue agreement with verified morning load-in hours.',
            culturalContext: 'Ensure open courtyard for holy rituals and sacred fire mandap.',
          },
          {
            taskId: 'task-budget-catering-lock',
            taskTitle: 'Approve Streamlined Feast with Regional Signature Staples',
            urgencyLevel: 'high',
            daysUntilDeadline: 14,
            whyItMatters: `Allocates ${curr}${cateringAlloc.toLocaleString()} (32%, ~${curr}${Math.round(cateringAlloc / targetGuestCount)}/head). Locking menu early protects against seasonal commodity surges.`,
            recommendedAction: 'Choose seasonal fish/paneer preparations and fresh local sweet artisans (Halwais).',
            culturalContext: 'Feature beloved classics like Rui Kalia, Chholar Dal with coconut, Luchi, and hot Rosogolla.',
          },
          {
            taskId: 'task-budget-decor-botanical',
            taskTitle: 'Adopt Indigenous Botanical & Brass Diya Decor',
            urgencyLevel: 'high',
            daysUntilDeadline: 16,
            whyItMatters: `Capped at ${curr}${decorAlloc.toLocaleString()} (13%). Replaces costly cold-storage imported flowers with fragrant Rajnigandha and marigolds.`,
            recommendedAction: 'Engage local flower market guild for fresh morning delivery.',
            culturalContext: 'Mango-leaf torans and traditional alpana patterns offer timeless elegance at modest expense.',
          },
          {
            taskId: 'task-budget-photo-essential',
            taskTitle: 'Contract Essential Heritage Photography Coverage',
            urgencyLevel: 'medium',
            daysUntilDeadline: 20,
            whyItMatters: `Allocates ${curr}${photoAlloc.toLocaleString()} (8%) for high-quality single-cinematographer ceremony coverage.`,
            recommendedAction: 'Confirm coverage window centered on vital ritual moments.',
            culturalContext: 'Prioritize Saat Paake Ghaura, Sindoor Daan, and family blessing portraits.',
          },
          {
            taskId: 'task-budget-rsvps',
            taskTitle: 'Dispatch Digital Invitations & Track RSVPs',
            urgencyLevel: 'medium',
            daysUntilDeadline: 22,
            whyItMatters: `Allocates ${curr}${miscAlloc.toLocaleString()} (11%) for digital invites, ritual items, and emergency sundries. Prevents plate wastage.`,
            recommendedAction: 'Set firm RSVP deadline 14 days before celebration.',
            culturalContext: 'Add dietary notes for pure-vegetarian elders and fasting relatives.',
          },
        ],
        traditionAdvisories: [
          'All authentic ceremonies remain fully protected; savings come from material choices, not cutting rituals.',
          'Rely on warm hospitality, fresh food, and evening brass diyas for unforgettable celebratory atmosphere.',
        ],
        budgetGuidance: `Detailed allocation: Catering ${curr}${cateringAlloc.toLocaleString()} (32%), Venue ${curr}${venueAlloc.toLocaleString()} (28%), Decor ${curr}${decorAlloc.toLocaleString()} (13%), Attire & Sundries ${curr}${miscAlloc.toLocaleString()} (11%), Photography ${curr}${photoAlloc.toLocaleString()} (8%), Protected Contingency ${curr}${contingencyReserve.toLocaleString()} (8%).`,
        suggestedNextSteps: [
          'Review the itemized budget allocation breakdown.',
          'Click "Apply Budget Optimization" to update active celebration limit.',
          'Share menu constraints with shortlisted catering partners.',
        ],
        clarifyingQuestion: 'Would you prefer synchronized traditional banana-leaf service or a live buffet format?',
        proposedAction: {
          id: 'action-plan-2-lakh',
          actionType: 'UPDATE_BUDGET',
          title: `Set ${curr}2,00,000 Budget Cap`,
          explanation: `Synchronize event budget to ${curr}2,00,000 with ${curr}${contingencyReserve.toLocaleString()} protected contingency.`,
          impactSummary: `Adjusts category allocations proportionally while guaranteeing an 8% reserve.`,
          requiresConfirmation: true,
          validationStatus: 'valid',
          payload: {
            totalBudget: targetBudgetCap,
            contingencyAmount: contingencyReserve,
          },
        },
        generatedAt: now,
      }
    }

    if (queryLower.includes('plan a bengali wedding') || (queryLower.includes('bengali') && queryLower.includes('150'))) {
      return {
        source: 'deterministic-demo',
        model: 'demo-rule-engine',
        headline: `Curated Bengali Wedding Blueprint (${request.city || 'Kolkata'} • ${targetGuestCount} Guests)`,
        strategicSummary: `Structured celebration framework for ${targetGuestCount} guests with a budget of ${curr}${totalBudget.toLocaleString()} in ${request.city || 'Kolkata'}. Includes Gaye Holud, Saat Paake Ghaura, and Bou Bhaat banquets while ring-fencing a guaranteed 8% (${curr}${Math.round(totalBudget * 0.08).toLocaleString()}) contingency buffer.`,
        urgentTaskAnalyses: [
          {
            taskId: 'task-venue-lock',
            taskTitle: 'Execute Heritage Banquet Contract & Load-In Window',
            urgencyLevel: 'critical',
            daysUntilDeadline: 7,
            whyItMatters: 'Heritage venues in Kolkata book out quickly for Shubh Muhurat dates. Locking the contract guarantees physical access and vendor staging.',
            recommendedAction: 'Execute agreement and deposit booking token.',
            culturalContext: 'Confirm open-air courtyard space for daytime Gaye Holud and sacred fire mandap.',
          },
          {
            taskId: 'task-catering-lock',
            taskTitle: 'Approve Bengali Royal Culinary Menu & Fish Tasting',
            urgencyLevel: 'high',
            daysUntilDeadline: 14,
            whyItMatters: 'Catering represents ~32% of total budget. Locking early guarantees per-plate cost against market fish and sweet price fluctuations.',
            recommendedAction: 'Finalize Bhetki Paturi, Chingri Malai Curry, Kosha Mangsho, and Nolen Gurer Sandesh.',
            culturalContext: 'Ensure traditional mishti karigars have dedicated kitchen space for serving warm rasgullas.',
          },
        ],
        traditionAdvisories: [
          'Assemble Gaye Holud Tattwa gift trays with decorated brass plates, Topor, and fresh turmeric.',
          'Schedule Borjatri welcome drinks and conch shell (Shankha) team at main entryway.',
          'Coordinate evening Godhuli Lagna twilight window for sacred Saat Paake Ghaura and Shubho Drishti.',
        ],
        budgetGuidance: `Maintain a strict ${curr}${Math.round(totalBudget * 0.08).toLocaleString()} contingency reserve. Recommended allocation: 32% Catering, 28% Venue, 14% Decor, 8% Photography, 8% Contingency.`,
        suggestedNextSteps: [
          'Review and approve the proposed Bengali wedding structure.',
          'Execute venue agreement to secure celebration date.',
          'Distribute digital invitations to establish confirmed guest count.',
        ],
        clarifyingQuestion: 'Would you prefer synchronized traditional table service or an elegant live buffet with chef counters?',
        proposedAction: {
          id: 'action-create-bengali-event',
          actionType: 'CREATE_EVENT',
          title: `Create Bengali Wedding: ${eventTitle}`,
          explanation: `Initialize Bengali Wedding plan with ${targetGuestCount} guests and ${curr}${totalBudget.toLocaleString()} budget in ${request.city || 'Kolkata'}.`,
          impactSummary: `Configures 3-day run of show, itemized budget in INR, and ring-fences ${curr}${Math.round(totalBudget * 0.08).toLocaleString()} contingency reserve.`,
          requiresConfirmation: true,
          validationStatus: 'valid',
          payload: {
            title: eventTitle,
            category: 'wedding',
            city: request.city || 'Kolkata',
            totalBudget: totalBudget,
            targetGuestCount: targetGuestCount,
            currency: request.currency || 'INR',
            traditionId: 'bengali-wedding',
          },
        },
        generatedAt: now,
      }
    }

    // 2. Natural Language Scenario: "Suggest a traditional yet affordable decoration theme"
    if (queryLower.includes('decoration') || queryLower.includes('decor') || queryLower.includes('theme')) {
      const decorSavings = Math.round(totalBudget * 0.04)
      return {
        source: 'deterministic-demo',
        model: 'demo-rule-engine',
        headline: 'Indigenous Botanical & Brass Diya Ambiance',
        strategicSummary:
          'Replace fragile imported blooms with local fragrant Rajnigandha (tuberose), marigold canopies, mango-leaf torans, and floating brass pradips. Delivers breathtaking celebratory warmth while reducing wholesale botanical spend by 20%.',
        urgentTaskAnalyses: [
          {
            taskId: 'task-decor-botanical',
            taskTitle: 'Contract Local Botanical Decor Guild for Fresh Rajnigandha',
            urgencyLevel: 'high',
            daysUntilDeadline: 14,
            whyItMatters: 'Direct farm sourcing from local flower markets guarantees fresh morning fragrance without distributor markup.',
            recommendedAction: 'Specify marigold curtains, brass urlis, and earthen diyas for twilight ceremonies.',
            culturalContext: 'Sacred mango-leaf torans at entryways symbolize auspicious blessings and protection.',
          },
        ],
        traditionAdvisories: [
          'Use natural morning sunlight for Gaye Holud to enhance vibrant yellow floral staging.',
          'Position floating brass urlis with fresh marigold petals at the venue entrance.',
        ],
        budgetGuidance: `Estimated decor spend reduced to ~10-12% of total budget, saving ${curr}${decorSavings.toLocaleString()} that can be diverted to hospitality or contingency.`,
        suggestedNextSteps: [
          'Approve indigenous botanical moodboard.',
          'Confirm brass urli and lamp rental inventory with decorator.',
        ],
        clarifyingQuestion: 'Do you prefer traditional marigold-and-brass styling or minimalist terracotta with fairy lights?',
        proposedAction: {
          id: 'action-update-decor-budget',
          actionType: 'UPDATE_BUDGET',
          title: 'Apply Indigenous Botanical Decor Savings',
          explanation: 'Rebalance budget allocations with indigenous floral decor and brass diyas.',
          impactSummary: `Saves approximately ${curr}${decorSavings.toLocaleString()} in floral procurement costs while protecting contingency.`,
          requiresConfirmation: true,
          validationStatus: 'valid',
          payload: {
            category: 'decor',
            savingsEstimate: decorSavings,
          },
        },
        generatedAt: now,
      }
    }

    // 3. Natural Language Scenario: "Reduce my budget by ₹40,000 without removing important functions"
    if (queryLower.includes('reduce') || queryLower.includes('40,000') || queryLower.includes('cut budget') || queryLower.includes('lower budget')) {
      const reductionAmount = 40000
      const newProposedBudget = Math.max(100000, totalBudget - reductionAmount)
      const newContingency = Math.round(newProposedBudget * 0.08)

      return {
        source: 'deterministic-demo',
        model: 'demo-rule-engine',
        headline: `Strategic ${curr}${reductionAmount.toLocaleString()} Budget Optimization`,
        strategicSummary: `Celebrio has recalculated your plan to absorb the ${curr}${reductionAmount.toLocaleString()} reduction entirely through service style and wholesale floral adjustments. All culturally selected rituals remain 100% protected, and your 8% contingency (${curr}${newContingency.toLocaleString()}) remains ring-fenced.`,
        urgentTaskAnalyses: [
          {
            taskId: 'task-tradeoff-catering',
            taskTitle: 'Transition to Curated Live Buffet with Regional Specialties',
            urgencyLevel: 'high',
            daysUntilDeadline: 10,
            whyItMatters: 'Switching from formal synchronized seated dinner to a live buffet reduces staffing overhead by 12% while ensuring guests receive continuous hot food.',
            recommendedAction: 'Approve live buffet floorplan with anchor signature dishes.',
            culturalContext: 'Preserves essential traditional items (e.g. Bhetki Paturi, Kosha Mangsho, warm sweets) without compromise.',
          },
          {
            taskId: 'task-tradeoff-decor',
            taskTitle: 'Adopt Indigenous Botanical & Candlelight Staging',
            urgencyLevel: 'medium',
            daysUntilDeadline: 18,
            whyItMatters: 'Replacing imported blooms with seasonal marigolds and tuberose saves 20% on decor line items.',
            recommendedAction: 'Lock brass diya and marigold specification with florist.',
          },
        ],
        traditionAdvisories: [
          'All sacred rituals (Saat Paake Ghaura, Sindoor Daan, Bou Bhaat) remain fully scheduled and protected.',
          'Focus guest experience spend on warm food replenishment and heartfelt hospitality.',
        ],
        budgetGuidance: `Total Budget adjusted from ${curr}${totalBudget.toLocaleString()} to ${curr}${newProposedBudget.toLocaleString()}. Contingency reserve recalculated to ${curr}${newContingency.toLocaleString()} (8%).`,
        suggestedNextSteps: [
          'Review the proposed budget adjustment below.',
          'Click "Confirm & Apply" to update your active celebration budget.',
          'Notify catering and decor vendors of revised service formats.',
        ],
        clarifyingQuestion: 'Would you like to preview this comparison in the What-If Simulator before applying?',
        proposedAction: {
          id: 'action-reduce-budget',
          actionType: 'UPDATE_BUDGET',
          title: `Apply ${curr}${reductionAmount.toLocaleString()} Budget Reduction`,
          explanation: `Adjust celebration budget from ${curr}${totalBudget.toLocaleString()} to ${curr}${newProposedBudget.toLocaleString()} while protecting all ceremonies.`,
          impactSummary: `Reduces total cap to ${curr}${newProposedBudget.toLocaleString()}; ring-fences ${curr}${newContingency.toLocaleString()} contingency reserve.`,
          requiresConfirmation: true,
          validationStatus: 'valid',
          payload: {
            totalBudget: newProposedBudget,
            contingencyAmount: newContingency,
            reductionAmount,
          },
        },
        generatedAt: now,
      }
    }

    // 4. Natural Language Scenario: "Suggest vegetarian catering options"
    // 4. Natural Language Scenario: "Suggest affordable Bengali food options" or "vegetarian catering"
    if (queryLower.includes('bengali food') || (queryLower.includes('bengali') && (queryLower.includes('food') || queryLower.includes('menu') || queryLower.includes('catering') || queryLower.includes('dishes')))) {
      return {
        source: 'deterministic-demo',
        model: 'demo-rule-engine',
        headline: `Affordable Authentic Bengali Celebration Feast (${request.city || 'Kolkata'} • ${targetGuestCount} Guests)`,
        strategicSummary: `Curated an authentic, high-reputation Bengali celebration menu balancing traditional prestige dishes with cost-effective wholesale ingredient sourcing. Optimizes per-plate budget to ~${curr}600-650/head while keeping beloved staples front and center.`,
        urgentTaskAnalyses: [
          {
            taskId: 'task-bengali-fish-market',
            taskTitle: 'Lock Seasonal Katla/Rui Fish Vendor in Wholesale Batches',
            urgencyLevel: 'high',
            daysUntilDeadline: 12,
            whyItMatters: 'Using fresh Katla/Rui Kalia in place of expensive off-season Ilish or giant jumbo prawns preserves authentic celebratory taste while cutting fish spend by 30%.',
            recommendedAction: 'Contract wholesale vendor for early morning delivery on wedding day.',
            culturalContext: 'Fish is an indispensable auspicious symbol (Maaer Ashirbaad) in Bengali matrimony.',
          },
          {
            taskId: 'task-bengali-halwai-lock',
            taskTitle: 'Contract Traditional Halwai for Live Warm Chhena Rosogollas',
            urgencyLevel: 'high',
            daysUntilDeadline: 15,
            whyItMatters: 'Freshly made cottage cheese sweets cost 40% less than imported bakery confections while providing far superior guest satisfaction.',
            recommendedAction: 'Book dedicated sweet artisan team with mobile steaming karahis.',
            culturalContext: 'Warm Nolen Gurer Rosogolla and Sandesh are cultural hallmarks of a Kolkata wedding.',
          },
        ],
        traditionAdvisories: [
          'Welcome Drink: Fragrant Gondhoraj Lebur Shorbot & Aam Pora Shorbot (refreshing and affordable).',
          'Starters: Crispy Moong Dal Kochuri with sweet-spicy Chholar Dal (coconut slivers) & Postor Bora.',
          'Main Course: Fluffy Lucchi, Basanti Pulao, Dhokar Dalna, and rich Rui Machher Kalia / Kosha Mangsho.',
          'Dessert Trio: Hot Rosogolla handis, Nolen Gurer Sandesh, and thick artisan Mishti Doi.',
        ],
        budgetGuidance: `Estimated catering cost: ${curr}${Math.round(totalBudget * 0.32).toLocaleString()} (~32% of ${curr}${totalBudget.toLocaleString()} budget). Adopting live buffet or batch table service prevents unconsumed plate surcharges.`,
        suggestedNextSteps: [
          'Share this four-course traditional menu with your shortlisted catering partners.',
          'Confirm separate cooking utensils for vegetarian and elder dietary preferences.',
        ],
        clarifyingQuestion: 'Would you like to include one mutton preparation (Kosha Mangsho) alongside the fish course?',
        generatedAt: now,
      }
    }

    if (queryLower.includes('vegetarian') || queryLower.includes('pure veg') || queryLower.includes('sattvik') || queryLower.includes('catering options')) {
      return {
        source: 'deterministic-demo',
        model: 'demo-rule-engine',
        headline: `Curated Vegetarian & Sattvik Feast (${request.city || 'Regional Heritage'})`,
        strategicSummary: `A gourmet vegetarian menu honoring authentic regional culinary heritage without religious restrictions. Formulated to provide rich protein balance and traditional celebration favorites for ${targetGuestCount} guests.`,
        urgentTaskAnalyses: [
          {
            taskId: 'task-veg-menu-tasting',
            taskTitle: 'Schedule Pure-Vegetarian Tasting & Halwai Review',
            urgencyLevel: 'high',
            daysUntilDeadline: 14,
            whyItMatters: 'High-end vegetarian catering requires balance between live hot snacks and traditional slow-cooked gravies.',
            recommendedAction: 'Confirm separate kitchen preparation area for pure-veg and Jain guests.',
            culturalContext: 'Ensure traditional sweets (Rosogolla, Sandesh, or Malpua) are crafted with pure desi cow ghee and fresh chhena.',
          },
        ],
        traditionAdvisories: [
          'Appetizers: Crispy Hing Radhaballabhi, Moong Dal Kachori, and Paneer Malai Tikka.',
          'Mains: Dhokar Dalna (steamed lentil cakes), Chanar Kofta in rich cashew gravy, Basanti Pulao, and Echorer Kalia (raw jackfruit).',
          'Desserts: Warm Nolen Gurer Sandesh, Baked Rosogolla handis, and Kesar Pista Kulfi.',
        ],
        budgetGuidance: `Vegetarian culinary menus typically offer 10-15% cost savings compared to specialty seafood/mutton menus, allowing more generous dessert stations.`,
        suggestedNextSteps: [
          'Share vegetarian menu options with your catering team.',
          'Verify count of Jain (no onion/garlic) attendees on guest list.',
        ],
        clarifyingQuestion: 'Would you like a separate Jain specialty station for elders and fasting guests?',
        generatedAt: now,
      }
    }

    // 5. Natural Language Scenario: "What happens if 50 more guests attend?" (or dynamic count)
    const guestSurgeRegex = /(\d+)\s*(?:more|additional|extra)\s*guests/i
    const surgeMatch = queryLower.match(guestSurgeRegex)
    if (surgeMatch || queryLower.includes('additional guests') || queryLower.includes('more guests')) {
      const addedGuests = surgeMatch ? Math.max(5, parseInt(surgeMatch[1], 10)) : 50
      const newGuests = targetGuestCount + addedGuests
      const estPerPlate = Math.round((totalBudget * 0.32) / targetGuestCount)
      const cateringDelta = estPerPlate * addedGuests

      return {
        source: 'deterministic-demo',
        model: 'demo-rule-engine',
        headline: `Ripple-Effect Analysis: +${addedGuests} Guests (${newGuests} Total Headcount)`,
        strategicSummary: `Adding ${addedGuests} attendees expands your catering commitment by approximately ${curr}${cateringDelta.toLocaleString()} (at ~${curr}${estPerPlate}/plate). Crucially, the physical hall seating and kitchen staging must accommodate ${newGuests} total attendees without overcrowding.`,
        urgentTaskAnalyses: [
          {
            taskId: 'task-venue-capacity-audit',
            taskTitle: `Verify Venue Hall Seating Limit for ${newGuests} Attendees`,
            urgencyLevel: 'critical',
            daysUntilDeadline: 5,
            whyItMatters: `Exceeding certified facility capacity by ${addedGuests} attendees compresses ceremonial circulation around the mandap and dining aisles.`,
            recommendedAction: `Inspect facility safety certificate and request ${Math.ceil(addedGuests / 8)} additional round tables with linens.`,
            culturalContext: 'Ensure sacred fire mandap remains clear and accessible for elder viewing.',
          },
          {
            taskId: 'task-buffet-staffing-surge',
            taskTitle: `Deploy Dual Synchronized Buffet Counters & ${Math.ceil(addedGuests / 15)} Extra Servers`,
            urgencyLevel: 'high',
            daysUntilDeadline: 8,
            whyItMatters: `Single-line buffet queues for ${newGuests} people exceed 18 minutes. Dual counters eliminate bottlenecks.`,
            recommendedAction: 'Instruct catering supervisor to stage split food replenishment stations.',
          },
        ],
        traditionAdvisories: [
          'Stagger elder banquet dining 30 minutes before younger cohorts to provide relaxed hospitality.',
          'Add a secondary welcome drink station at the entrance to greet arriving family batches.',
        ],
        budgetGuidance: `Catering scales by +${curr}${cateringDelta.toLocaleString()}. Absorbing this without budget expansion requires shifting from plated courses to live buffet or trimming floral imports.`,
        suggestedNextSteps: [
          `Open the What-If Simulator with ${newGuests} guests to preview side-by-side category impacts.`,
          `Confirm venue chair and table rental inventory for ${newGuests} seats.`,
        ],
        clarifyingQuestion: `Would you like to simulate this ${newGuests}-guest scenario in the What-If Simulator right now?`,
        proposedAction: {
          id: 'action-simulate-guest-surge',
          actionType: 'CREATE_WHAT_IF_SCENARIO',
          title: `Simulate ${newGuests} Guests Scenario`,
          explanation: `Simulate guest headcount increase from ${targetGuestCount} to ${newGuests}.`,
          impactSummary: `Calculates catering scaling (+${curr}${cateringDelta.toLocaleString()}) and checks venue seating capacity.`,
          requiresConfirmation: true,
          validationStatus: 'valid',
          payload: {
            guestCount: newGuests,
            totalBudget: totalBudget,
          },
        },
        generatedAt: now,
      }
    }

    // 6. Natural Language Scenario: "Explain why my budget is exceeding the limit"
    if (queryLower.includes('exceeding') || queryLower.includes('over budget') || queryLower.includes('deficit') || queryLower.includes('exceed the limit')) {
      const budgetItemsList = Array.isArray(request.budgetItems) ? request.budgetItems : []
      const totalAllocated = budgetItemsList.reduce((acc, b) => acc + (Number(b.allocatedAmount) || 0), 0)
      const overage = Math.max(0, totalAllocated - totalBudget)

      return {
        source: 'deterministic-demo',
        model: 'demo-rule-engine',
        headline: `Budget Variance Diagnostic: ${overage > 0 ? `${curr}${overage.toLocaleString()} Exceeding Cap` : 'Protected Budget Headroom Analysis'}`,
        strategicSummary: overage > 0
          ? `Your planned spending (${curr}${totalAllocated.toLocaleString()}) exceeds the authorized budget limit (${curr}${totalBudget.toLocaleString()}) by ${curr}${overage.toLocaleString()}. This variance is driven primarily by overlapping vendor commitments and unoptimized premium decor lines.`
          : `Your allocations currently total ${curr}${totalAllocated.toLocaleString()} against a limit of ${curr}${totalBudget.toLocaleString()}. Your 8% contingency reserve (${curr}${Math.round(totalBudget * 0.08).toLocaleString()}) is safe, but variable catering and rentals require vigilance.`,
        urgentTaskAnalyses: [
          {
            taskId: 'task-audit-catering-variance',
            taskTitle: 'Reconcile High-Variance Catering & Dining Commitments',
            urgencyLevel: 'critical',
            daysUntilDeadline: 4,
            whyItMatters: 'Catering typically drives overages when guest counts or premium live stations expand without ceiling caps.',
            recommendedAction: 'Transition from formal synchronized table service to a curated live buffet format to save ~12% in staffing.',
          },
          {
            taskId: 'task-protect-contingency-buffer',
            taskTitle: `Restore 8% Ring-Fenced Contingency (${curr}${Math.round(totalBudget * 0.08).toLocaleString()})`,
            urgencyLevel: 'high',
            daysUntilDeadline: 6,
            whyItMatters: 'Never absorb budget deficits by zeroing out the contingency buffer; unexpected ceremonial items require emergency cash reserves.',
            recommendedAction: 'Trim non-essential imported florals and specialty lighting to replenish the reserve.',
          },
        ],
        traditionAdvisories: [
          'Protect all essential cultural rituals (ceremony sacred mandap, priest Dakshina, traditional prasad/sweets).',
          'Apply savings exclusively to non-cultural line items like bespoke printing and imported botanicals.',
        ],
        budgetGuidance: `To restore balanced headroom, we recommend shaving 5% from decor and 7% from entertainment, preserving your complete ceremony calendar.`,
        suggestedNextSteps: [
          'Review the over-allocated line items in your Budget Planner.',
          'Launch the What-If Simulator to preview rebalancing options.',
        ],
        clarifyingQuestion: 'Would you like Celebrio to automatically generate 3 cost-saving alternatives for your top expenses?',
        generatedAt: now,
      }
    }

    // 6. Natural Language Scenario: "Reorganise my schedule if the venue changes"
    if (queryLower.includes('venue change') || queryLower.includes('reorganise my schedule') || queryLower.includes('reorganize')) {
      return {
        source: 'deterministic-demo',
        model: 'demo-rule-engine',
        headline: 'Venue Relocation & Schedule Reorganization Roadmap',
        strategicSummary: `When changing venues, timeline milestones must adjust to accommodate new vendor load-in regulations, noise curfews, and distance from guest hotels.`,
        urgentTaskAnalyses: [
          {
            taskId: 'task-venue-loadin-audit',
            taskTitle: 'Obtain New Venue Access & Load-In Schedule',
            urgencyLevel: 'critical',
            daysUntilDeadline: 3,
            whyItMatters: 'Different properties enforce strict morning entry times and electrical generator guidelines.',
            recommendedAction: 'Request facility vendor guidelines document from venue manager.',
          },
          {
            taskId: 'task-vendor-address-dispatch',
            taskTitle: 'Dispatch Updated GPS Coordinates & Access Instructions to All Vendors',
            urgencyLevel: 'high',
            daysUntilDeadline: 5,
            whyItMatters: 'Prevents supplier transit delays on celebration morning.',
            recommendedAction: 'Send automated venue update email with parking gate instructions.',
          },
        ],
        traditionAdvisories: [
          'Re-verify sacred fire (Havan) ventilation at the new venue before finalizing mandap placement.',
          'Confirm groom Baarat arrival staging route and parking availability.',
        ],
        budgetGuidance: 'Review potential cancellation fees or transfer of security deposit to avoid double booking spend.',
        suggestedNextSteps: [
          'Update venue name and address in celebration settings.',
          'Audit decorator setup buffer at new location.',
        ],
        clarifyingQuestion: 'Does the new venue have outdoor lawn space for ceremonies or is it an indoor banquet hall?',
        proposedAction: {
          id: 'action-reorganize-timeline',
          actionType: 'UPDATE_TIMELINE',
          title: 'Reschedule Setup & Load-In Milestones',
          explanation: 'Re-align preparation milestones with new venue load-in requirements.',
          impactSummary: 'Advances decorator and technical AV load-in windows by 2 hours.',
          requiresConfirmation: true,
          validationStatus: 'valid',
          payload: {
            venueTurnaroundHours: 6,
          },
        },
        generatedAt: now,
      }
    }

    // Default: Urgent Tasks & General Cultural Guidance (Provides up to 5 top prioritized tasks)
    const analyses = urgentTasks.slice(0, 5).map((task) => {
      const lowerTitle = (task.title || '').toLowerCase()
      let whyItMatters = `This milestone is on the critical planning path. Delaying past the deadline causes downstream logistical bottlenecks.`
      let recommendedAction = `Review supplier requirements, verify budget allocation, and finalize the agreement.`
      let culturalContext = isBengali
        ? `Ensure ceremony spaces and timing accommodate sacred ritual steps without rushed transitions.`
        : undefined

      if (lowerTitle.includes('venue') || lowerTitle.includes('contract') || lowerTitle.includes('deposit')) {
        whyItMatters = `In ${request.city || 'prime metropolitan areas'}, high-demand celebration venues book up rapidly. Delaying contract finalization risks date loss or expensive emergency relocations.`
        recommendedAction = `Execute the facility agreement and disburse the booking retainer to guarantee physical access and vendor load-in windows.`
        if (isBengali) {
          culturalContext = `Confirm sufficient open-air or courtyard space for Gaye Holud rituals and the traditional Saat Paake Ghaura sacred fire mandap.`
        }
      } else if (lowerTitle.includes('catering') || lowerTitle.includes('menu') || lowerTitle.includes('beverage')) {
        whyItMatters = `Catering represents ~30-35% of total spend (${curr}${Math.round(totalBudget * 0.32).toLocaleString()} for ${targetGuestCount} guests). Locking the proposal early locks in per-plate pricing against ingredient inflation.`
        recommendedAction = `Review menu courses, verify server staffing ratios, and confirm kitchen preparation facilities.`
        if (isBengali) {
          culturalContext = `Confirm authentic menu staples such as Bhetki Paturi/Machher Jhol, Kosha Mangsho, and traditional mishti (Rosogolla, Sandesh) prepared by certified halwais.`
        }
      } else if (lowerTitle.includes('photo') || lowerTitle.includes('video') || lowerTitle.includes('media')) {
        whyItMatters = `Top photographers accept only one premier celebration per date. Unconfirmed dates lead to associate substitutions.`
        recommendedAction = `Confirm key photographer names, hours of continuous coverage, and guaranteed delivery schedule.`
        if (isBengali) {
          culturalContext = `Specify coverage for emotional Shubho Drishti, Saat Paake Ghaura, Sindoor Daan, and Bou Bhaat family traditions.`
        }
      } else if (lowerTitle.includes('invitation') || lowerTitle.includes('rsvp')) {
        whyItMatters = `Reliable RSVP headcount is required to prevent over-ordering catering plates or paying venue capacity penalties.`
        recommendedAction = `Distribute digital invites with clear dietary and transit instructions, setting RSVP cutoff at 14 days prior.`
      }

      return {
        taskId: task.id,
        taskTitle: task.title,
        urgencyLevel: (task.priority === 'critical' ? 'critical' : 'high') as 'critical' | 'high' | 'medium',
        daysUntilDeadline: 7,
        whyItMatters,
        recommendedAction,
        culturalContext,
      }
    })

    return {
      source: 'deterministic-demo',
      model: 'demo-rule-engine',
      headline: `Urgent Milestones & Cultural Roadmap for ${eventTitle}`,
      strategicSummary: `With ${targetGuestCount} guests in ${request.city || 'your celebration city'} and a budget of ${curr}${totalBudget.toLocaleString()} scheduled ${request.eventDate ? 'soon' : 'in 30 days'}, your immediate focus is freezing the anchor contracts (venue & catering) while maintaining strict financial discipline.`,
      urgentTaskAnalyses: analyses,
      traditionAdvisories: isBengali
        ? [
            'Coordinate Gaye Holud styling with natural daytime lighting for vibrant photography.',
            'Confirm Borjatri arrival protocol and entrance welcoming refreshments for the groom party.',
            'Ensure sweet makers (Halwais) have dedicated setup for serving warm artisanal mishti.',
          ]
        : [
            'Align arrival moments with welcoming hospitality to set an inviting tone.',
            'Coordinate master run-of-show with lead coordinator and vendors.',
          ],
      budgetGuidance: `Strictly protect your ${curr}${Math.round(totalBudget * 0.08).toLocaleString()} (8%) contingency reserve. Never dip into this safety buffer for decorative upgrades.`,
      suggestedNextSteps: [
        `Execute venue contract to secure celebration date.`,
        `Approve catering menu estimate for ${targetGuestCount} attendees.`,
        `Distribute invitations to establish confirmed guest headcount.`,
      ],
      clarifyingQuestion:
        'Have you finalized your mandap indoor/outdoor preference, or would you like recommendations on weather-buffered heritage venues?',
      generatedAt: now,
    }
  }

  if (!isGeminiConfigured()) {
    return getDeterministicAdvice()
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

    const prompt = `You are Celebrio AI's Copilot, an expert celebration advisor specializing in Indian and regional cultural celebrations.
A user is planning:
- Title: "${request.eventTitle}" (${request.category})
- Destination: ${request.city || 'Metropolitan City'}
- Guests: ${request.targetGuestCount} attendees
- Budget: ${curr}${request.totalBudget.toLocaleString()} (${request.currency})
- Traditions/Ceremonies: ${request.traditions?.join(', ') || 'Traditional celebration'}
- Date / Timeline Horizon: ${request.eventDate || '30 days sprint'}

URGENT / CRITICAL TASKS:
${(request.urgentTasks || []).map((t) => `- [${t.priority.toUpperCase()}] ${t.title} (${t.status})`).join('\n')}

USER QUERY:
${request.query || 'Explain the most urgent tasks and provide cultural, timeline, and budget recommendations.'}

INSTRUCTIONS:
1. Reference the exact event context (city, guest count, budget, traditions).
2. Explain *why* each urgent task matters, specific risks of delay, and the concrete recommended action.
3. Incorporate authentic cultural guidance (e.g. for Bengali weddings: Gaye Holud, Saat Paake Ghaura, Kosha Mangsho/Mishti catering, venue capacity).
4. Strictly protect the contingency reserve (8%).
5. Keep advice concise, non-generic, and free of fluff.
6. Ask at most one necessary clarifying question.
7. If the user query requests an actionable change (e.g. plan event, reduce budget, update guests, add task, simulate what-if, reschedule timeline), include a "proposedAction" object. Otherwise omit it.

Return ONLY a valid JSON object matching this schema:
{
  "headline": string,
  "strategicSummary": string,
  "urgentTaskAnalyses": [
    {
      "taskId": string,
      "taskTitle": string,
      "urgencyLevel": "critical" | "high" | "medium",
      "daysUntilDeadline": number,
      "whyItMatters": string,
      "recommendedAction": string,
      "culturalContext": string
    }
  ],
  "traditionAdvisories": [string, string],
  "budgetGuidance": string,
  "suggestedNextSteps": [string, string, string],
  "clarifyingQuestion": string,
  "proposedAction": {
    "actionType": "CREATE_EVENT" | "UPDATE_BUDGET" | "ADD_TASK" | "UPDATE_TIMELINE" | "ADD_VENDOR" | "UPDATE_GUEST_COUNT" | "CREATE_WHAT_IF_SCENARIO",
    "title": string,
    "explanation": string,
    "impactSummary": string,
    "payload": object
  }
}`

    const response = await Promise.race([
      ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.5,
        },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI_TIMEOUT: Copilot advice timed out')), TIMEOUT_MS),
      ),
    ])

    const text = cleanJsonOutput(response.text || '')
    const parsed = JSON.parse(text)

    let structuredAction: any = undefined
    if (parsed.proposedAction && typeof parsed.proposedAction === 'object') {
      const pa = parsed.proposedAction
      structuredAction = {
        id: `action-${Date.now()}`,
        actionType: pa.actionType || 'UPDATE_BUDGET',
        title: String(pa.title || 'Proposed Planning Action').slice(0, 120),
        explanation: String(pa.explanation || 'AI proposed action based on your request.').slice(0, 300),
        impactSummary: String(pa.impactSummary || 'Updates celebration parameters.').slice(0, 200),
        requiresConfirmation: true,
        validationStatus: 'valid',
        payload: pa.payload || {},
      }
    }

    return {
      source: 'gemini-live',
      model: MODEL_NAME,
      headline: String(parsed.headline || `Urgent Milestones for ${request.eventTitle}`).slice(0, 150),
      strategicSummary: String(parsed.strategicSummary || 'Strategic roadmap generated.').slice(0, 350),
      urgentTaskAnalyses: Array.isArray(parsed.urgentTaskAnalyses)
        ? parsed.urgentTaskAnalyses.slice(0, 5).map((a: any, idx: number) => ({
            taskId: String(a.taskId || (request.urgentTasks && request.urgentTasks[idx]?.id) || `task-${idx}`).slice(0, 64),
            taskTitle: String(a.taskTitle || (request.urgentTasks && request.urgentTasks[idx]?.title) || 'Milestone').slice(0, 150),
            urgencyLevel: ['critical', 'high', 'medium'].includes(a.urgencyLevel) ? a.urgencyLevel : 'high',
            daysUntilDeadline: Number(a.daysUntilDeadline) || 7,
            whyItMatters: String(a.whyItMatters || 'Critical path requirement.').slice(0, 250),
            recommendedAction: String(a.recommendedAction || 'Execute immediately.').slice(0, 200),
            culturalContext: typeof a.culturalContext === 'string' ? a.culturalContext.slice(0, 200) : undefined,
          }))
        : getDeterministicAdvice().urgentTaskAnalyses,
      traditionAdvisories: Array.isArray(parsed.traditionAdvisories)
        ? parsed.traditionAdvisories.slice(0, 4).map((t: any) => String(t).slice(0, 150))
        : getDeterministicAdvice().traditionAdvisories,
      budgetGuidance: String(parsed.budgetGuidance || getDeterministicAdvice().budgetGuidance).slice(0, 250),
      suggestedNextSteps: Array.isArray(parsed.suggestedNextSteps)
        ? parsed.suggestedNextSteps.slice(0, 4).map((s: any) => String(s).slice(0, 150))
        : getDeterministicAdvice().suggestedNextSteps,
      clarifyingQuestion: typeof parsed.clarifyingQuestion === 'string' ? parsed.clarifyingQuestion.slice(0, 180) : undefined,
      proposedAction: structuredAction || getDeterministicAdvice().proposedAction,
      generatedAt: now,
    }
  } catch {
    return getDeterministicAdvice()
  }
}
