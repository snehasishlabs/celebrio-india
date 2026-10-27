import { ThemeConcept } from './concept'

export type AIAdvisorTone = 'reassuring' | 'concise' | 'strategic'

export type AIPlanningSource = 'gemini-live' | 'deterministic-demo'

export interface PlanSyncAlert {
  id: string
  severity: 'info' | 'warning' | 'critical'
  title: string
  source: 'budget' | 'timeline' | 'vendor' | 'guest-list'
  description: string
  suggestedAction: string
  estimatedImpact: string
  createdAt: string
}

export interface AISuggestionResponse {
  summary: string
  alerts: PlanSyncAlert[]
  overallHealthScore: number // 0 - 100
  nextActionRecommendation: string
}

/**
 * Server-safe request payload for AI Concept Generation
 * Contains only non-sensitive planning parameters.
 * No PII (names, contact info, street addresses) is transmitted.
 */
export interface AIConceptGenerationRequest {
  eventId: string
  title: string
  category: string
  city?: string
  targetGuestCount: number
  totalBudget: number
  currency: string
  themePreference?: string
  priorities?: string[]
  dietaryRequirements?: string[]
  accessibilityRequirements?: string[]
}

export interface AIConceptGenerationResponse {
  source: AIPlanningSource
  model: string
  concepts: ThemeConcept[]
  generatedAt: string
  disclaimer: string
  notes?: string
}

/**
 * Request payload for what-if scenario replanning analysis
 */
export interface AITradeoffExplanationRequest {
  eventId: string
  baseline: {
    category: string
    totalBudget: number
    guestCount: number
  }
  proposed: {
    totalBudget: number
    guestCount: number
    dateDeltaDays?: number
    venueType?: string
  }
  deltas: {
    budgetDelta: number
    perGuestDelta: number
    contingencyDelta: number
  }
  affectedCategories: string[]
}

export interface AITradeoffExplanationResponse {
  source: AIPlanningSource
  model: string
  strategicSummary: string
  culinaryRecommendations: string[]
  entertainmentAlternatives: string[]
  budgetSavingTips: string[]
  guestExperienceRiskMitigation: string[]
  generatedAt: string
}

export interface AIServerHealthResponse {
  status: 'ok' | 'degraded' | 'error'
  hasGeminiKey: boolean
  model: string
  mode: 'live' | 'demo'
  version: string
}
