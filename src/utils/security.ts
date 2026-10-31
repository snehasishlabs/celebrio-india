import { CelebrationEvent } from '@/types/event'
import { Guest, GuestSummary, GuestCategory } from '@/types/guest'

export const DEFAULT_USER_ID = 'usr_owner_default'

/**
 * Enforces Object-Level Authorization (BOLA defense).
 * Verifies that the requesting user owns the celebration resource.
 * If event has no assigned userId (legacy/demo), defaults to current user.
 */
export function verifyEventOwnership(
  event: CelebrationEvent | null | undefined,
  currentUserId: string = DEFAULT_USER_ID,
): boolean {
  if (!event) return false
  if (!event.userId) return true // Legacy/demo event defaults to permitted
  return event.userId === currentUserId
}

/**
 * Masks Personally Identifiable Information (PII) for safe display.
 * Prevents shoulder surfing and accidental exposure in UI.
 */
export function sanitizePii(
  value: string | undefined | null,
  type?: 'phone' | 'email',
): string {
  if (!value || typeof value !== 'string') return ''
  const trimmed = value.trim()
  if (!trimmed) return ''

  const detectedType = type || (trimmed.includes('@') ? 'email' : 'phone')

  if (detectedType === 'email') {
    const parts = trimmed.split('@')
    if (parts.length !== 2) return '***@***.***'
    const [name, domain] = parts
    const visibleName = name.length > 2 ? `${name.slice(0, 2)}***` : `${name.slice(0, 1)}***`
    return `${visibleName}@${domain}`
  }

  // Phone masking: +91 98300 12345 -> +91 98*** **345
  if (trimmed.length > 5) {
    const prefix = trimmed.slice(0, 6)
    const suffix = trimmed.slice(-3)
    return `${prefix}*** **${suffix}`
  }

  return '***-***'
}

/**
 * Escapes HTML characters to prevent XSS injection.
 */
export function sanitizeText(text: string | undefined | null): string {
  if (!text || typeof text !== 'string') return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Exports a privacy-preserving catering attendee report.
 * Strictly excludes private phone numbers, emails, and personal notes.
 */
export function exportSanitizedGuestList(guests: Guest[]): string {
  const headers = ['Guest Name', 'Category', 'RSVP Status', 'Dietary Needs', 'Table #', '+1s']
  const rows = guests.map((g) => [
    g.name,
    g.category,
    g.rsvpStatus,
    g.dietaryRequirement || 'Standard',
    g.tableNumber || 'Unassigned',
    String(g.plusOnes || 0),
  ])

  return [headers.join(','), ...rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(','))].join('\n')
}

/**
 * Computes attendee hospitality metrics from guest roster.
 */
export function calculateGuestSummary(guests: Guest[]): GuestSummary {
  const dietaryBreakdown: Record<string, number> = {}
  const categoryBreakdown: Record<GuestCategory, number> = {
    family: 0,
    'bride-side': 0,
    'groom-side': 0,
    friends: 0,
    colleagues: 0,
    vip: 0,
  }

  let confirmedAttending = 0
  let declined = 0
  let awaitingRsvp = 0
  let totalHeadcount = 0

  for (const g of guests) {
    const headcount = 1 + (g.plusOnes || 0)
    totalHeadcount += headcount

    if (g.rsvpStatus === 'attending') {
      confirmedAttending += headcount
    } else if (g.rsvpStatus === 'declined') {
      declined += 1
    } else {
      awaitingRsvp += headcount
    }

    // Category
    if (g.category in categoryBreakdown) {
      categoryBreakdown[g.category] += headcount
    }

    // Dietary
    const diet = g.dietaryRequirement?.trim() || 'Standard'
    dietaryBreakdown[diet] = (dietaryBreakdown[diet] || 0) + headcount
  }

  return {
    totalInvited: totalHeadcount,
    confirmedAttending,
    declined,
    awaitingRsvp,
    dietaryBreakdown,
    categoryBreakdown,
  }
}

