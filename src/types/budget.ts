export type BudgetCategory =
  | 'venue'
  | 'catering-beverage'
  | 'production-av'
  | 'decor-floral'
  | 'entertainment'
  | 'photography-media'
  | 'apparel-styling'
  | 'transport-logistics'
  | 'stationery-gifts'
  | 'contingency'
  | 'miscellaneous';

export type PaymentStatus = 'planned' | 'deposit-paid' | 'paid-in-full' | 'overdue';

export interface BudgetItem {
  id: string;
  eventId: string;
  category: BudgetCategory;
  name: string;
  allocatedAmount: number;
  actualAmount: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  vendorId?: string;
  dueDate?: string;
  notes?: string;
  isContingency?: boolean;
}

export interface BudgetSummary {
  totalBudget: number;
  allocatedAmount: number;
  actualAmount: number;
  paidAmount: number;
  remainingAmount: number;
  committedVariance: number;
  contingencyReserve: number;
  isOverAllocated: boolean;
  allocationPercentage: number;
}

