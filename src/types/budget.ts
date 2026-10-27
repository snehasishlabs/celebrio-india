export type BudgetCategory =
  | 'venue'
  | 'catering'
  | 'decor'
  | 'photography'
  | 'entertainment'
  | 'clothing'
  | 'invitations'
  | 'transport'
  | 'permits'
  | 'miscellaneous'
  | 'contingency'
  // Backward compatibility category mappings
  | 'catering-beverage'
  | 'production-av'
  | 'decor-floral'
  | 'photography-media'
  | 'apparel-styling'
  | 'transport-logistics'
  | 'stationery-gifts';

export type CostStatus = 'estimated' | 'quoted' | 'confirmed';

export type PaymentStatus = 'planned' | 'deposit-paid' | 'paid-in-full' | 'overdue';

export interface BudgetItem {
  id: string;
  eventId: string;
  category: BudgetCategory;
  name: string;
  costStatus: CostStatus; // 'estimated' | 'quoted' | 'confirmed'
  estimatedAmount: number;
  quotedAmount: number;
  confirmedAmount: number;
  allocatedAmount: number; // Active planned allocation in ledger
  actualAmount: number;    // Committed contract amount
  paidAmount: number;      // Amount disbursed
  paymentStatus: PaymentStatus;
  vendorId?: string;
  dueDate?: string;
  notes?: string;
  isContingency?: boolean;
}

export interface CategorySummary {
  category: BudgetCategory;
  displayName: string;
  allocatedAmount: number;
  actualAmount: number;
  percentageOfTotal: number;
  itemCount: number;
}

export interface BudgetWarning {
  id: string;
  type:
    | 'over-budget'
    | 'zero-budget'
    | 'negative-budget'
    | 'heavy-allocation'
    | 'unallocated-deficit'
    | 'missing-contingency';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  recommendedAction?: string;
}

export interface CostSavingAlternative {
  id: string;
  itemId: string;
  category: BudgetCategory;
  title: string;
  currentAmount: number;
  suggestedAmount: number;
  estimatedSavings: number;
  rationale: string;
  tradeoffNotice: string;
}

export interface BudgetCalculationResult {
  totalBudget: number;           // User's spending limit (T)
  plannedExpenditure: number;    // Sum of non-contingency allocations (P)
  contingencyReserve: number;    // Separately allocated reserve (C)
  totalCommittedPlanned: number; // Planned expenditure + contingency (P + C)
  actualSpent: number;           // Actual or committed spending (A)
  disbursedPaid: number;         // Disbursed payments (D)
  remainingBalance: number;      // T - (P + C)
  differenceFromLimit: number;   // T - P (difference between planned allocations and total cap)
  isOverBudget: boolean;         // (P + C) > T
  overBudgetAmount: number;      // max(0, (P + C) - T)
  allocationPercentage: number;  // ((P + C) / T) * 100
  categories: CategorySummary[];
  statusBreakdown: {
    estimatedTotal: number;
    quotedTotal: number;
    confirmedTotal: number;
  };
  warnings: BudgetWarning[];
  infeasibilityReason?: string;
}
