export type ScenarioType =
  | 'budget-reduction'
  | 'budget-increase'
  | 'guest-count-surge'
  | 'guest-count-drop'
  | 'timeline-compression'
  | 'vendor-cancellation'
  | 'weather-shift';

export interface ScenarioParameter {
  id: string;
  name: string;
  type: 'percentage' | 'currency' | 'days' | 'count';
  currentValue: number;
  simulatedValue: number;
}

export interface TradeoffRecommendation {
  id: string;
  category: string;
  actionTitle: string;
  rationale: string;
  costDelta: number; // positive = increased cost, negative = saved
  timelineDeltaDays: number;
  riskLevel: 'low' | 'moderate' | 'high';
  isRecommended: boolean;
}

export interface ScenarioImpactResult {
  scenarioId: string;
  scenarioTitle: string;
  scenarioType: ScenarioType;
  budgetVariance: number;
  newEstimatedTotal: number;
  timelineStressScore: number; // 0-100 (higher = more compression)
  affectedTaskCount: number;
  affectedVendorCount: number;
  recommendations: TradeoffRecommendation[];
  summaryNote: string;
}

