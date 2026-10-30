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

export interface AICopilotUrgentTaskAnalysis {
  taskId: string
  taskTitle: string
  urgencyLevel: 'critical' | 'high' | 'medium'
  daysUntilDeadline: number
  whyItMatters: string
  recommendedAction: string
  culturalContext?: string
}

export interface AICopilotTaskAdviceRequest {
  eventId: string
  eventTitle: string
  category: string
  city?: string
  eventDate?: string
  targetGuestCount: number
  totalBudget: number
  currency: string
  traditions?: string[]
  urgentTasks: Array<{
    id: string
    title: string
    deadline?: string
    isCriticalPath: boolean
    priority: string
    phase: string
    status: string
  }>
  budgetItems?: Array<{
    category: string
    allocatedAmount: number
    costStatus: string
  }>
  query?: string
}

export type AIActionType =
  | 'CREATE_EVENT'
  | 'UPDATE_BUDGET'
  | 'ADD_TASK'
  | 'UPDATE_TIMELINE'
  | 'ADD_VENDOR'
  | 'UPDATE_GUEST_COUNT'
  | 'CREATE_WHAT_IF_SCENARIO'

export interface AIActionProposal {
  id: string
  actionType: AIActionType
  title: string
  explanation: string
  impactSummary: string
  requiresConfirmation: boolean
  payload: Record<string, any>
  validationStatus: 'valid' | 'invalid'
  validationErrors?: string[]
}

export interface AIRecommendation {
  id: string
  severity: 'info' | 'warning' | 'critical'
  title: string
  source: 'budget' | 'timeline' | 'vendor' | 'guest-list' | 'cultural'
  issue: string
  whyItMatters: string
  potentialImpact: string
  suggestedAction: string
  actionType?: AIActionType
  actionPayload?: Record<string, any>
  createdAt: string
}

export interface AICopilotTaskAdviceResponse {
  source: AIPlanningSource
  model: string
  headline: string
  strategicSummary: string
  urgentTaskAnalyses: AICopilotUrgentTaskAnalysis[]
  traditionAdvisories: string[]
  budgetGuidance: string
  suggestedNextSteps: string[]
  clarifyingQuestion?: string
  proposedAction?: AIActionProposal
  generatedAt: string
}
