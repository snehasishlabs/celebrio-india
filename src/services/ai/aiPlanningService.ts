import {
  AIConceptGenerationRequest,
  AIConceptGenerationResponse,
  AITradeoffExplanationRequest,
  AITradeoffExplanationResponse,
  AIServerHealthResponse,
} from '@/types/ai'
import { CelebrationEvent } from '@/types/event'
import { generateThemeConcepts } from '@/services/ideas/conceptGenerator'

const API_BASE = '' // Relative path works with Vite dev proxy and unified production server

/**
 * Checks server health and Gemini configuration status.
 * Never leaks the actual API key.
 */
export async function fetchServerHealth(): Promise<AIServerHealthResponse> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2000)

    const res = await fetch(`${API_BASE}/api/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!res.ok) {
      return {
        status: 'degraded',
        hasGeminiKey: false,
        model: 'gemini-2.5-flash',
        mode: 'demo',
        version: '1.0.0',
      }
    }

    return (await res.json()) as AIServerHealthResponse
  } catch {
    // If server is unreachable (e.g. offline or static test runner), provide graceful fallback
    return {
      status: 'ok',
      hasGeminiKey: false,
      model: 'deterministic-rule-engine',
      mode: 'demo',
      version: '1.0.0',
    }
  }
}

/**
 * Request concept generation from the server.
 * If server is unreachable or offline, seamlessly falls back to the deterministic engine.
 */
export async function generateCelebrationConcepts(
  event: CelebrationEvent,
): Promise<AIConceptGenerationResponse> {
  const requestPayload: AIConceptGenerationRequest = {
    eventId: event.id,
    title: event.title,
    category: event.category,
    city: event.location?.city,
    targetGuestCount: event.targetGuestCount,
    totalBudget: event.totalBudget,
    currency: event.currency,
    themePreference: event.themePreference,
    priorities: event.priorities,
    dietaryRequirements: event.dietaryRequirements,
    accessibilityRequirements: event.accessibilityRequirements,
  }

  try {
    const res = await fetch(`${API_BASE}/api/plan/generate-concepts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(requestPayload),
    })

    if (res.ok) {
      const data = (await res.json()) as AIConceptGenerationResponse
      // Sanity check to make sure concepts array is valid
      if (data && Array.isArray(data.concepts) && data.concepts.length >= 3) {
        return data
      }
    }
  } catch {
    // Fall through to deterministic fallback
  }

  // Graceful deterministic offline fallback
  const fallbackConcepts = generateThemeConcepts(event)
  return {
    source: 'deterministic-demo',
    model: 'deterministic-rule-engine',
    concepts: fallbackConcepts,
    generatedAt: new Date().toISOString(),
    disclaimer:
      'Generated via Celebrio Deterministic Engine (Offline Demo Mode). Set GEMINI_API_KEY in server environment for live AI generation.',
    notes: 'Operating in High-Fidelity Demo Mode.',
  }
}

/**
 * Request AI narrative trade-off explanations for what-if scenario replanning.
 */
export async function explainScenarioTradeoffs(
  request: AITradeoffExplanationRequest,
): Promise<AITradeoffExplanationResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/plan/explain-tradeoffs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (res.ok) {
      const data = (await res.json()) as AITradeoffExplanationResponse
      if (data && data.strategicSummary) {
        return data
      }
    }
  } catch {
    // Fall through to deterministic fallback
  }

  const isReduced = request.deltas.budgetDelta < 0
  return {
    source: 'deterministic-demo',
    model: 'deterministic-rule-engine',
    strategicSummary: isReduced
      ? `Budget reduced by $${Math.abs(request.deltas.budgetDelta).toLocaleString()}. Recommend prioritizing non-negotiable anchor experiences (venue & catering) while adopting modular styling.`
      : `Budget expanded by $${Math.abs(request.deltas.budgetDelta).toLocaleString()}. Great opportunity to enhance guest hospitality and live musical programming.`,
    culinaryRecommendations: isReduced
      ? [
          'Transition from formal plated dinner to elevated family-style sharing platters',
          'Curate two seasonal craft cocktails rather than a full premium open bar',
        ]
      : [
          'Upgrade to 4-course synchronized dining with curated tableside wine pairings',
          'Add a specialty late-night comfort culinary station',
        ],
    entertainmentAlternatives: isReduced
      ? [
          'Engage an acoustic duo for ceremony/cocktail hour with seamless professional DJ for reception',
          'Incorporate an interactive digital memory wall or vintage audio guestbook',
        ]
      : [
          'Add live brass horn section to evening showband for unforgettable dance energy',
          'Feature live guest portrait artist or slow-motion video booth',
        ],
    budgetSavingTips: [
      'Repurpose ceremony floral arrangements as stage and head table backdrops',
      'Opt for elegant digital signage over multi-piece bespoke printed paper suites',
      'Negotiate venue beverage corkage or seasonal supplier packages',
    ],
    guestExperienceRiskMitigation: [
      'Provide comfortable arrival hospitality and shaded/heated gathering spaces',
      'Confirm final dietary counts 14 days prior to prevent vendor rush penalties',
    ],
    generatedAt: new Date().toISOString(),
  }
}
