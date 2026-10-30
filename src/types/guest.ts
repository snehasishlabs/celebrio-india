export type RsvpStatus = 'attending' | 'declined' | 'awaiting'

export type GuestCategory =
  | 'family'
  | 'bride-side'
  | 'groom-side'
  | 'friends'
  | 'colleagues'
  | 'vip'

export interface Guest {
  id: string
  eventId: string
  name: string
  category: GuestCategory
  rsvpStatus: RsvpStatus
  dietaryRequirement?: string // e.g. "Pure Veg", "Jain (No Onion/Garlic)", "Halal", "Vegan", "Nut Allergy"
  tableNumber?: string
  contactPhone?: string // Optional, masked in views
  contactEmail?: string // Optional, masked in views
  plusOnes: number
  notes?: string
  invitationSent: boolean
  createdAt: string
  updatedAt: string
}

export interface GuestSummary {
  totalInvited: number
  confirmedAttending: number
  declined: number
  awaitingRsvp: number
  dietaryBreakdown: Record<string, number>
  categoryBreakdown: Record<GuestCategory, number>
}

