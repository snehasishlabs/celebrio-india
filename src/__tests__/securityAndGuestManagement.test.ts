import { describe, it, expect, beforeEach } from 'vitest'
import {
  verifyEventOwnership,
  sanitizePii,
  sanitizeText,
  exportSanitizedGuestList,
  calculateGuestSummary,
  DEFAULT_USER_ID,
} from '@/utils/security'
import { StorageService } from '@/services/storage/storageService'
import { CelebrationEvent } from '@/types/event'
import { Guest } from '@/types/guest'

describe('Celebrio India — Security, Authorization & Guest Management Audit', () => {
  let sampleEvent: CelebrationEvent
  let testGuests: Guest[]

  beforeEach(() => {
    StorageService.resetAllData()

    sampleEvent = {
      id: 'ev-security-audit-1',
      userId: 'usr_owner_ananya',
      title: "Ananya & Debabrata's Royal Wedding",
      category: 'wedding',
      date: '2026-12-15',
      location: {
        venueName: 'Heritage Rajbari Courtyard',
        city: 'Kolkata',
        address: 'Baghbazar, Kolkata',
        isIndoor: false,
      },
      totalBudget: 300000,
      currency: 'INR',
      targetGuestCount: 150,
      confirmedGuestCount: 120,
      status: 'planning',
      syncState: 'in-sync',
      priorities: ['Catering', 'Mandap Architecture'],
      dietaryRequirements: ['Pure Veg', 'Fish & Mutton'],
      accessibilityRequirements: ['Step-free Ramp'],
      preferences: {
        indoorOutdoor: 'hybrid',
      },
      createdAt: '2026-10-25T10:00:00Z',
      updatedAt: '2026-10-25T10:00:00Z',
    }

    testGuests = [
      {
        id: 'gst-101',
        eventId: sampleEvent.id,
        name: 'Debabrata Sengupta',
        category: 'family',
        rsvpStatus: 'attending',
        dietaryRequirement: 'Pure Veg',
        tableNumber: 'Table 1',
        contactPhone: '+91 98300 12345',
        contactEmail: 'debabrata@example.com',
        plusOnes: 1,
        notes: 'Elder requiring front seat near mandap',
        invitationSent: true,
        createdAt: '2026-10-26T10:00:00Z',
        updatedAt: '2026-10-26T10:00:00Z',
      },
      {
        id: 'gst-102',
        eventId: sampleEvent.id,
        name: 'Rohan Sharma',
        category: 'friends',
        rsvpStatus: 'awaiting',
        dietaryRequirement: 'Jain (No Onion/Garlic)',
        tableNumber: 'Table 3',
        contactPhone: '+91 98200 55443',
        contactEmail: 'rohan@example.com',
        plusOnes: 0,
        invitationSent: true,
        createdAt: '2026-10-26T11:00:00Z',
        updatedAt: '2026-10-26T11:00:00Z',
      },
      {
        id: 'gst-103',
        eventId: sampleEvent.id,
        name: 'Sunita Das',
        category: 'bride-side',
        rsvpStatus: 'declined',
        plusOnes: 0,
        invitationSent: true,
        createdAt: '2026-10-26T12:00:00Z',
        updatedAt: '2026-10-26T12:00:00Z',
      },
    ]
  })

  // =========================================================================
  // 1. OBJECT-LEVEL AUTHORIZATION (BOLA / IDOR DEFENSE)
  // =========================================================================
  describe('1. Object-Level Authorization (BOLA Defense)', () => {
    it('authorizes celebration access when userId matches authenticated session', () => {
      const isAuthorized = verifyEventOwnership(sampleEvent, 'usr_owner_ananya')
      expect(isAuthorized).toBe(true)
    })

    it('denies access when requesting user is not the celebration owner', () => {
      const isAuthorized = verifyEventOwnership(sampleEvent, 'usr_unauthorized_attacker')
      expect(isAuthorized).toBe(false)
    })

    it('safely handles legacy events without assigned userId', () => {
      const legacyEvent: CelebrationEvent = { ...sampleEvent, userId: undefined }
      const isAuthorized = verifyEventOwnership(legacyEvent, DEFAULT_USER_ID)
      expect(isAuthorized).toBe(true)
    })

    it('returns false when event is null or undefined', () => {
      expect(verifyEventOwnership(null, 'usr_owner_ananya')).toBe(false)
      expect(verifyEventOwnership(undefined, 'usr_owner_ananya')).toBe(false)
    })
  })

  // =========================================================================
  // 2. PRIVACY & PERSONALLY IDENTIFIABLE INFORMATION (PII) MASKING
  // =========================================================================
  describe('2. PII Protection & Data Masking', () => {
    it('masks phone numbers to prevent shoulder surfing in UI', () => {
      const masked = sanitizePii('+91 98300 12345', 'phone')
      expect(masked).toBe('+91 98*** **345')
      expect(masked).not.toContain('300 12')
    })

    it('masks email addresses while preserving domain routing', () => {
      const masked = sanitizePii('debabrata@example.com', 'email')
      expect(masked).toBe('de***@example.com')
      expect(masked).not.toContain('debabrata')
    })

    it('handles empty or missing contact values without throwing', () => {
      expect(sanitizePii('', 'phone')).toBe('')
      expect(sanitizePii(undefined, 'phone')).toBe('')
      expect(sanitizePii(null as any, 'email')).toBe('')
    })

    it('generates a privacy-preserving CSV for catering that excludes phone & email', () => {
      const csv = exportSanitizedGuestList(testGuests)

      // Verifies required catering headers
      expect(csv).toContain('Guest Name')
      expect(csv).toContain('Dietary Needs')
      expect(csv).toContain('Table #')

      // Verifies attendee data
      expect(csv).toContain('Debabrata Sengupta')
      expect(csv).toContain('Pure Veg')
      expect(csv).toContain('Jain (No Onion/Garlic)')

      // Strictly verifies zero PII phone or email leakage
      expect(csv).not.toContain('+91 98300 12345')
      expect(csv).not.toContain('debabrata@example.com')
      expect(csv).not.toContain('+91 98200 55443')
      expect(csv).not.toContain('rohan@example.com')
      expect(csv).not.toContain('Elder requiring front seat') // Private note stripped
    })
  })

  // =========================================================================
  // 3. XSS & HTML INJECTION DEFENSE
  // =========================================================================
  describe('3. XSS & Injection Sanitization', () => {
    it('escapes dangerous HTML script tags in user input', () => {
      const dangerous = '<script>alert("XSS")</script>'
      const sanitized = sanitizeText(dangerous)
      expect(sanitized).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;')
      expect(sanitized).not.toContain('<script>')
    })

    it('escapes malicious HTML attributes and event handlers', () => {
      const payload = '<img src=x onerror=alert(1)>'
      const sanitized = sanitizeText(payload)
      expect(sanitized).toBe('&lt;img src=x onerror=alert(1)&gt;')
    })
  })

  // =========================================================================
  // 4. GUEST MANAGEMENT & SUMMARY CALCULATIONS
  // =========================================================================
  describe('4. Guest Management & Hospitality Metrics', () => {
    it('accurately calculates attendee counts, plus-ones, and RSVP totals', () => {
      const summary = calculateGuestSummary(testGuests)

      // Debabrata (1 + 1 = 2 attending), Rohan (1 + 0 = 1 awaiting), Sunita (1 declined)
      expect(summary.totalInvited).toBe(4)
      expect(summary.confirmedAttending).toBe(2)
      expect(summary.awaitingRsvp).toBe(1)
      expect(summary.declined).toBe(1)
    })

    it('tallies certified dietary meal requirements accurately', () => {
      const summary = calculateGuestSummary(testGuests)

      expect(summary.dietaryBreakdown['Pure Veg']).toBe(2) // 1 guest + 1 plus-one
      expect(summary.dietaryBreakdown['Jain (No Onion/Garlic)']).toBe(1)
      expect(summary.dietaryBreakdown['Standard']).toBe(1) // Sunita (no dietary specified)
    })

    it('tallies category distribution across family, bride, groom, friends', () => {
      const summary = calculateGuestSummary(testGuests)

      expect(summary.categoryBreakdown['family']).toBe(2)
      expect(summary.categoryBreakdown['friends']).toBe(1)
      expect(summary.categoryBreakdown['bride-side']).toBe(1)
      expect(summary.categoryBreakdown['groom-side']).toBe(0)
    })
  })

  // =========================================================================
  // 5. STORAGE SERVICE GUEST PERSISTENCE & ISOLATION
  // =========================================================================
  describe('5. Storage Service Guest Roster Persistence', () => {
    it('persists and retrieves guests scoped strictly to eventId', () => {
      StorageService.saveGuestsForEvent(sampleEvent.id, testGuests)

      const retrieved = StorageService.getGuests(sampleEvent.id)
      expect(retrieved.length).toBe(3)
      expect(retrieved.map((g) => g.name)).toContain('Debabrata Sengupta')

      // Isolated query for different event returns empty
      const otherGuests = StorageService.getGuests('ev-different-celebration')
      expect(otherGuests.length).toBe(0)
    })

    it('cleans up associated guests when celebration event is deleted', () => {
      StorageService.saveGuestsForEvent(sampleEvent.id, testGuests)
      expect(StorageService.getGuests(sampleEvent.id).length).toBe(3)

      StorageService.deleteEvent(sampleEvent.id)

      const afterDelete = StorageService.getGuests(sampleEvent.id)
      expect(afterDelete.length).toBe(0)
    })
  })
})

