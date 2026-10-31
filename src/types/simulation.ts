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

export interface ScenarioInput {
  totalBudget: number;
  guestCount: number;
  eventDate: string;
  themePreference?: string;
  venueType: 'indoor' | 'outdoor' | 'hybrid';
  venueName?: string;
  venueCapacity?: number;
  numberOfFunctions?: number;
  eventDurationDays?: number;
  cateringServiceType?: 'buffet' | 'plated' | 'family-style';
  decorationStyle?: string;
  categoryAdjustments?: Record<string, number>; // categoryId -> adjusted allocation amount
  dietaryRequirements?: string[];
  accessibilityRequirements?: string[];
}

export interface PlanComparisonSideBySide {
  original: {
    totalBudget: number;
    guestCount: number;
    eventDate: string;
    perGuestCost: number;
    contingencyReserve: number;
    plannedSpending: number;
    remainingBalance: number;
    planningHorizon: string;
    overdueTaskCount: number;
    dueSoonTaskCount: number;
    confirmedVendorCount: number;
  };
  proposed: {
    totalBudget: number;
    guestCount: number;
    eventDate: string;
    perGuestCost: number;
    contingencyReserve: number;
    plannedSpending: number;
    remainingBalance: number;
    planningHorizon: string;
    overdueTaskCount: number;
    dueSoonTaskCount: number;
    confirmedVendorCount: number;
  };
  deltas: {
    budgetDelta: number;
    perGuestCostDelta: number;
    contingencyDelta: number;
    daysDelta: number;
    guestCountDelta: number;
  };
}

export interface AffectedCategoryImpact {
  category: string;
  categoryName: string;
  originalAllocation: number;
  proposedAllocation: number;
  isOverAllocated: boolean;
  variance: number;
  notes: string;
}

export interface AffectedTaskImpact {
  taskId: string;
  title: string;
  originalDeadline: string;
  proposedDeadline: string;
  originalPriority: string;
  proposedPriority: string;
  isNowUrgent: boolean;
  isInfeasible: boolean;
  reason: string;
}

export interface AffectedVendorImpact {
  vendorId: string;
  vendorName: string;
  service: string;
  contractStatus: string;
  originalCost: number;
  proposedCost: number;
  isContractLocked: boolean; // Confirmed decisions preserved!
  uncertaintyFlag: boolean; // Realistic constraint: flag date/capacity uncertainty!
  actionAdvice: string;
}

export interface ScenarioTradeoff {
  id: string;
  title: string;
  category: string;
  description: string;
  savingsOrCost: number;
  impactType: 'savings' | 'cost' | 'neutral';
  compromiseSummary: string;
}

export interface ScenarioSimulationResult {
  comparison: PlanComparisonSideBySide;
  affectedCategories: AffectedCategoryImpact[];
  affectedTasks: AffectedTaskImpact[];
  affectedVendors: AffectedVendorImpact[];
  tradeoffs: ScenarioTradeoff[];
  hasCriticalWarnings: boolean;
  venueCapacityWarning?: string;
  infeasibilityReasons: string[];
  userConfirmedDecisionsPreserved: number; // Count of confirmed items protected
  summary: string;
}

