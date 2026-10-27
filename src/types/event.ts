export type EventCategory =
  | 'wedding'
  | 'birthday'
  | 'anniversary'
  | 'community'
  | 'gala'
  | 'corporate-summit'
  | 'product-launch'
  | 'private-celebration';

export type EventStatus = 'draft' | 'planning' | 'confirmed' | 'completed' | 'archived';

export type SyncState = 'in-sync' | 'drift-detected' | 'syncing' | 'action-required';

export interface EventPreferences {
  indoorOutdoor: 'indoor' | 'outdoor' | 'hybrid';
  dressCode?: string;
  musicVibe?: string;
  specialNotes?: string;
}

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
  themePreference?: string;
  selectedConceptId?: string;
  priorities: string[];
  dietaryRequirements: string[];
  dietaryNotes?: string;
  accessibilityRequirements: string[];
  accessibilityNotes?: string;
  preferences: EventPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLogItem {
  id: string;
  eventId: string;
  type:
    | 'event-created'
    | 'budget-updated'
    | 'task-completed'
    | 'vendor-contracted'
    | 'concept-selected'
    | 'guest-updated'
    | 'sync-recalculated';
  title: string;
  description: string;
  timestamp: string;
}

export interface NewCelebrationInput {
  title: string;
  category: EventCategory;
  date: string;
  venueName: string;
  city: string;
  totalBudget: number;
  currency: string;
  targetGuestCount: number;
  themePreference?: string;
  priorities: string[];
  dietaryRequirements: string[];
  dietaryNotes?: string;
  accessibilityRequirements: string[];
  accessibilityNotes?: string;
  indoorOutdoor: 'indoor' | 'outdoor' | 'hybrid';
  dressCode?: string;
  specialNotes?: string;
}
