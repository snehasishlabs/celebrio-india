import { GoogleGenAI } from '@google/genai'
import {
  AIConceptGenerationRequest,
  AIConceptGenerationResponse,
  AITradeoffExplanationRequest,
  AITradeoffExplanationResponse,
} from '../src/types/ai'
import { ThemeConcept, ConceptTier } from '../src/types/concept'
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
    const mockEvent = {
      id: request.eventId,
      title: request.title,
      category: request.category,
      date: '2026-10-31',
      city: request.city || 'Metropolitan Area',
      targetGuestCount: request.targetGuestCount,
      totalBudget: request.totalBudget,
      currency: request.currency,
      themePreference: request.themePreference || '',
      priorities: request.priorities || [],
      dietaryRequirements: request.dietaryRequirements || [],
      accessibilityRequirements: request.accessibilityRequirements || [],
      createdAt: now,
      updatedAt: now,
    }

    const deterministicConcepts = generateThemeConcepts(mockEvent as any)
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
  } catch (error: any) {
    // Log sanitized error without leaking API keys, private data, or headers
    const errorMessage = error?.message || 'Unknown error'
    // Fall back to deterministic engine gracefully
    const mockEvent = {
      id: request.eventId,
      title: request.title,
      category: request.category,
      date: '2026-10-31',
      city: request.city || 'Metropolitan Area',
      targetGuestCount: request.targetGuestCount,
      totalBudget: request.totalBudget,
      currency: request.currency,
      themePreference: request.themePreference || '',
      priorities: request.priorities || [],
      dietaryRequirements: request.dietaryRequirements || [],
      accessibilityRequirements: request.accessibilityRequirements || [],
      createdAt: now,
      updatedAt: now,
    }

    const fallbackConcepts = enforceDeterministicBudgetCalculations(
      generateThemeConcepts(mockEvent as any),
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
