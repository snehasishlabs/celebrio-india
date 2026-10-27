export type AIAdvisorTone = 'reassuring' | 'concise' | 'strategic';

export interface PlanSyncAlert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  source: 'budget' | 'timeline' | 'vendor' | 'guest-list';
  description: string;
  suggestedAction: string;
  estimatedImpact: string;
  createdAt: string;
}

export interface AISuggestionResponse {
  summary: string;
  alerts: PlanSyncAlert[];
  overallHealthScore: number; // 0 - 100
  nextActionRecommendation: string;
}

