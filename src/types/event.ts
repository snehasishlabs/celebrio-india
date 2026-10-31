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

export type CeremonyScheduleType = 'single-day' | 'multi-day-2' | 'multi-day-3' | 'multi-day-4' | 'custom';

export interface CulturalPreferences {
  traditionId?: string;
  regionOrState?: string;
  preferredLanguage?: string;
  ceremonyScheduleType?: CeremonyScheduleType;
  selectedCeremonies?: string[];
  auspiciousTimingPreference?: string;
  foodTradition?: string;
  musicAndVibe?: string;
  decorStyle?: string;
  isReligiousOrCultural?: boolean;
  guestHospitalityNotes?: string;
}

export interface EventPreferences {
  indoorOutdoor: 'indoor' | 'outdoor' | 'hybrid';
  dressCode?: string;
  musicVibe?: string;
  specialNotes?: string;
  culturalPreferences?: CulturalPreferences;
}

export interface CelebrationEvent {
  id: string;
  userId?: string; // Owner user ID for object-level authorization & multi-tenant isolation
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
    capacity?: number;
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
  culturalPreferences?: CulturalPreferences;
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
    | 'sync-recalculated'
    | 'ai-action-applied';
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
  culturalPreferences?: CulturalPreferences;
}
