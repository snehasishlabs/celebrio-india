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

/**
 * Generates culturally attuned, context-aware Copilot task explanations and strategic guidance.
 */
export async function explainUrgentTasksWithGemini(
  request: AICopilotTaskAdviceRequest,
): Promise<AICopilotTaskAdviceResponse> {
  const now = new Date().toISOString()
  const curr = request.currency === 'INR' ? '₹' : (request.currency === 'USD' ? '$' : request.currency)

  const getDeterministicAdvice = (): AICopilotTaskAdviceResponse => {
    const isBengali =
      (request.traditions && request.traditions.some((t) => t.toLowerCase().includes('bengali') || t.toLowerCase().includes('biye'))) ||
      request.eventTitle.toLowerCase().includes('bengali') ||
      request.city?.toLowerCase() === 'kolkata'

    const analyses = request.urgentTasks.slice(0, 4).map((task) => {
      const lowerTitle = task.title.toLowerCase()
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
        whyItMatters = `Catering represents ~30-35% of total spend (${curr}${Math.round(request.totalBudget * 0.32).toLocaleString()} for ${request.targetGuestCount} guests). Locking the proposal early locks in per-plate pricing against ingredient inflation.`
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
      headline: `Urgent Milestones & Cultural Roadmap for ${request.eventTitle}`,
      strategicSummary: `With ${request.targetGuestCount} guests in ${request.city || 'your celebration city'} and a budget of ${curr}${request.totalBudget.toLocaleString()} scheduled ${request.eventDate ? 'soon' : 'in 30 days'}, your immediate focus is freezing the anchor contracts (venue & catering) while maintaining strict financial discipline.`,
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
      budgetGuidance: `Strictly protect your ${curr}${Math.round(request.totalBudget * 0.08).toLocaleString()} (8%) contingency reserve. Never dip into this safety buffer for decorative upgrades.`,
      suggestedNextSteps: [
        `Execute venue contract to secure celebration date.`,
        `Approve catering menu estimate for ${request.targetGuestCount} attendees.`,
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
${request.urgentTasks.map((t) => `- [${t.priority.toUpperCase()}] ${t.title} (${t.status})`).join('\n')}

USER QUERY:
${request.query || 'Explain the most urgent tasks and provide cultural, timeline, and budget recommendations.'}

INSTRUCTIONS:
1. Reference the exact event context (city, guest count, budget, traditions).
2. Explain *why* each urgent task matters, specific risks of delay, and the concrete recommended action.
3. Incorporate authentic cultural guidance (e.g. for Bengali weddings: Gaye Holud, Saat Paake Ghaura, Kosha Mangsho/Mishti catering, venue capacity).
4. Strictly protect the contingency reserve (8%).
5. Keep advice concise, non-generic, and free of fluff.
6. Ask at most one necessary clarifying question.

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
  "clarifyingQuestion": string
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

    return {
      source: 'gemini-live',
      model: MODEL_NAME,
      headline: String(parsed.headline || `Urgent Milestones for ${request.eventTitle}`).slice(0, 150),
      strategicSummary: String(parsed.strategicSummary || 'Strategic roadmap generated.').slice(0, 350),
      urgentTaskAnalyses: Array.isArray(parsed.urgentTaskAnalyses)
        ? parsed.urgentTaskAnalyses.slice(0, 5).map((a: any, idx: number) => ({
            taskId: String(a.taskId || request.urgentTasks[idx]?.id || `task-${idx}`).slice(0, 64),
            taskTitle: String(a.taskTitle || request.urgentTasks[idx]?.title || 'Milestone').slice(0, 150),
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
      generatedAt: now,
    }
  } catch {
    return getDeterministicAdvice()
  }
}
