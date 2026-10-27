export type EventCategory =
  | 'wedding'
  | 'gala'
  | 'anniversary'
  | 'milestone-birthday'
  | 'corporate-summit'
  | 'product-launch'
  | 'private-celebration';

export type EventStatus = 'draft' | 'planning' | 'confirmed' | 'completed' | 'archived';

export type SyncState = 'in-sync' | 'drift-detected' | 'syncing' | 'action-required';

export interface CelebrationEvent {
  id: string;
  title: string;
  tagline?: string;
  category: EventCategory;
  date: string; // ISO string YYYY-MM-DD
  time?: string;
  location: {
    venueName: string;
    city: string;
    address?: string;
    isIndoor?: boolean;
  };
  totalBudget: number;
  currency: string;
  targetGuestCount: number;
  confirmedGuestCount: number;
  status: EventStatus;
  syncState: SyncState;
  syncSummary?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewCelebrationInput {
  title: string;
  category: EventCategory;
  date: string;
  venueName: string;
  city: string;
  totalBudget: number;
  targetGuestCount: number;
}
