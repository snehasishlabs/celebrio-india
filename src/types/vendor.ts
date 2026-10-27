export type VendorService =
  | 'venue'
  | 'catering'
  | 'bar-beverage'
  | 'decor'
  | 'florals-decor'
  | 'photography'
  | 'photography-video'
  | 'entertainment'
  | 'sound-lighting-av'
  | 'live-music-dj'
  | 'planning-styling'
  | 'transport'
  | 'transportation'
  | 'stationery-paper'
  | 'cake-dessert'
  | 'clothing'
  | 'rentals'
  | 'miscellaneous';

export type ContractStatus =
  | 'prospecting'
  | 'researching'
  | 'outreach'
  | 'quote-received'
  | 'negotiating'
  | 'contract-signed'
  | 'deposit-paid'
  | 'completed'
  | 'cancelled';

export interface PaymentMilestone {
  id: string;
  name: string; // e.g. "Booking Deposit", "Midway Payment", "Final Balance"
  amount: number;
  dueDate: string; // YYYY-MM-DD
  isPaid: boolean;
  paidDate?: string;
  notes?: string;
}

export interface VendorBackupOption {
  name: string;
  contact?: string;
  notes?: string;
  estimatedCost?: number;
}

export interface VendorCandidate {
  id: string;
  name: string;
  quotedCost: number;
  inclusions: string;
  pros: string;
  cons: string;
  cancellationTerms: string;
  score?: number; // 1-10
}

export interface VendorComparisonWorksheet {
  category: VendorService;
  notes?: string;
  candidates: VendorCandidate[];
}

export interface Vendor {
  id: string;
  eventId: string;
  name?: string; // Optional name
  service: VendorService;
  contactName?: string; // Contact details optional by user choice
  email?: string;
  phone?: string;
  website?: string;
  contractStatus: ContractStatus;
  estimatedCost?: number;
  quotedCost: number;
  finalCost?: number;
  depositAmount: number;
  depositPaid: boolean;
  notes?: string;
  comparisonNotes?: string;
  questionsToAsk?: string[];
  contractReminders?: string;
  cancellationPolicy?: string;
  cancellationDeadline?: string; // YYYY-MM-DD
  paymentMilestones?: PaymentMilestone[];
  backupOption?: VendorBackupOption;
  linkedTaskId?: string;
  linkedBudgetItemId?: string;
  rating?: number; // 1-5 stars
}

