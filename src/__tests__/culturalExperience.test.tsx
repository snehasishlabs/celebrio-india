import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CreateEventModal } from '@/features/events/CreateEventModal'
import { PlannerProvider } from '@/context/PlannerContext'
import {
  INDIAN_EVENT_TEMPLATES,
  getIndianTemplateById,
} from '@/constants/indianEventTemplates'
import { generateThemeConcepts } from '@/services/ideas/conceptGenerator'
import { generatePreparationTasks } from '@/utils/timelineEngine'
import { simulateScenario } from '@/utils/scenarioEngine'
import { StorageService } from '@/services/storage/storageService'
import { CelebrationEvent } from '@/types/event'
import { BudgetItem } from '@/types/budget'

describe('Celebrio India — Authentic Cultural Experience & Templates', () => {
  beforeEach(() => {
    localStorage.clear()
    StorageService.resetAllData()
  })

  describe('Indian Event Templates Library', () => {
    it('defines comprehensive templates covering all major regional Indian traditions', () => {
      expect(INDIAN_EVENT_TEMPLATES.length).toBeGreaterThanOrEqual(11)

      const ids = INDIAN_EVENT_TEMPLATES.map((t) => t.id)
      expect(ids).toContain('bengali-wedding')
      expect(ids).toContain('punjabi-wedding')
      expect(ids).toContain('south-indian-wedding')
      expect(ids).toContain('maharashtrian-wedding')
      expect(ids).toContain('gujarati-wedding')
      expect(ids).toContain('durga-puja')
      expect(ids).toContain('diwali-gala')
      expect(ids).toContain('eid-gathering')
      expect(ids).toContain('onam-celebration')
      expect(ids).toContain('griha-pravesh')
      expect(ids).toContain('contemporary-fusion')
    })

    it('ensures each template has complete cultural metadata, palette, milestones, and vendors', () => {
      INDIAN_EVENT_TEMPLATES.forEach((template) => {
        expect(template.id).toBeTruthy()
        expect(template.name).toBeTruthy()
        expect(template.region).toBeTruthy()
        expect(template.description).toBeTruthy()
        expect(template.colorPalette.length).toBeGreaterThanOrEqual(4)
        expect(template.defaultBudgetINR).toBeGreaterThan(0)
        expect(template.defaultGuestCount).toBeGreaterThan(0)
        expect(template.defaultCeremonies.length).toBeGreaterThan(0)
        expect(template.defaultMilestones.length).toBeGreaterThan(0)
        expect(template.defaultVendors.length).toBeGreaterThan(0)
        expect(template.culturalPreferences.foodTradition).toBeTruthy()
        expect(template.decorThemes.length).toBeGreaterThan(0)
      })
    })

    it('retrieves template by id or falls back gracefully', () => {
      const bengali = getIndianTemplateById('bengali-wedding')
      expect(bengali.name).toContain('Bengali')

      const unknown = getIndianTemplateById('non-existent-template-id')
      expect(unknown).toBeDefined()
      expect(unknown.id).toBe('bengali-wedding') // Primary classic fallback
    })
  })

  describe('Culturally Intelligent Concept Generation', () => {
    it('generates authentic Bengali celebration concepts with INR budget tiers', () => {
      const bengaliEvent: CelebrationEvent = {
        id: 'ev-bengali-test',
        title: "Pooja & Anik's Traditional Bengali Wedding",
        category: 'wedding',
        date: '2026-12-15',
        location: { venueName: 'Rajbari Courtyard', city: 'Kolkata', isIndoor: false },
        totalBudget: 4000000, // 40 Lakhs INR
        currency: 'INR',
        targetGuestCount: 250,
        confirmedGuestCount: 0,
        status: 'planning',
        syncState: 'in-sync',
        priorities: ['Catering', 'Mandap Florals'],
        dietaryRequirements: ['Fish & Seafood', 'Vegetarian'],
        accessibilityRequirements: ['Wheelchair Accessible'],
        preferences: { indoorOutdoor: 'hybrid' },
        culturalPreferences: {
          traditionId: 'bengali-wedding',
          selectedCeremonies: ['Gaye Holud', 'Saat Paake Ghaura', 'Bou Bhaat'],
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const concepts = generateThemeConcepts(bengaliEvent)
      expect(concepts).toHaveLength(3)

      const budgetConcept = concepts.find((c) => c.tier === 'budget-conscious')
      const creativeConcept = concepts.find((c) => c.tier === 'creative-distinctive')
      const premiumConcept = concepts.find((c) => c.tier === 'premium')

      expect(budgetConcept?.title).toContain('Terracotta')
      expect(creativeConcept?.title).toContain('Rajbari')
      expect(premiumConcept?.title).toContain('Zamindar')

      // Check deterministic budget scaling
      expect(budgetConcept?.costEstimation.estimatedTotal).toBe(3280000) // 82%
      expect(creativeConcept?.costEstimation.estimatedTotal).toBe(3920000) // 98%
      expect(premiumConcept?.costEstimation.estimatedTotal).toBe(4000000) // 100%

      // Check culinary authentic dishes
      expect(budgetConcept?.foodAndBeverage.highlights.some((h) => h.includes('Bhetki'))).toBe(true)
      expect(creativeConcept?.foodAndBeverage.highlights.some((h) => h.includes('Chingri'))).toBe(true)
    })
  })

  describe('Culturally Aware Timeline Milestone Scheduling', () => {
    it('injects traditional ritual milestones for Bengali celebrations', () => {
      const bengaliEvent: CelebrationEvent = {
        id: 'ev-bengali-timeline',
        title: 'Bengali Biye Ceremony',
        category: 'wedding',
        date: '2026-11-27', // 30 days away from Oct 28
        location: { venueName: 'Heritage Palace', city: 'Kolkata' },
        totalBudget: 300000,
        currency: 'INR',
        targetGuestCount: 150,
        confirmedGuestCount: 0,
        status: 'planning',
        syncState: 'in-sync',
        priorities: [],
        dietaryRequirements: [],
        accessibilityRequirements: [],
        preferences: { indoorOutdoor: 'indoor' },
        culturalPreferences: {
          traditionId: 'bengali-wedding',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const tasks = generatePreparationTasks(bengaliEvent, new Date(2026, 9, 28))
      expect(tasks.length).toBeGreaterThan(0)

      // Verifies authentic Tattwa / Pidi / Topor milestone is scheduled
      const ritualTask = tasks.find((t) => t.title.toLowerCase().includes('tattwa'))
      expect(ritualTask).toBeDefined()
      expect(ritualTask?.status).toBe('todo')
      expect(ritualTask?.isCriticalPath).toBe(true)
    })

    it('injects authentic South Indian jasmine and banana leaf milestones for Muhurtham events', () => {
      const southEvent: CelebrationEvent = {
        id: 'ev-south-timeline',
        title: 'Chennai Kalyanam',
        category: 'wedding',
        date: '2026-11-28',
        location: { venueName: 'Kalyana Mandapam', city: 'Chennai' },
        totalBudget: 2500000,
        currency: 'INR',
        targetGuestCount: 300,
        confirmedGuestCount: 0,
        status: 'planning',
        syncState: 'in-sync',
        priorities: [],
        dietaryRequirements: [],
        accessibilityRequirements: [],
        preferences: { indoorOutdoor: 'indoor' },
        culturalPreferences: {
          traditionId: 'south-indian-wedding',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const tasks = generatePreparationTasks(southEvent, new Date(2026, 9, 28))
      const floralTask = tasks.find((t) => t.title.toLowerCase().includes('malli') || t.title.toLowerCase().includes('banana leaf'))
      expect(floralTask).toBeDefined()
      expect(floralTask?.status).toBe('todo')
    })
  })

  describe('Culturally Aware What-If Replanning Simulator', () => {
    it('safeguards cultural rituals and provides culturally sensitive tradeoffs during budget reduction', () => {
      const baseEvent: CelebrationEvent = {
        id: 'ev-sim-test',
        title: "Arjun & Sneha's Wedding",
        category: 'wedding',
        date: '2026-12-01',
        location: { venueName: 'Regal Hall', city: 'Mumbai' },
        totalBudget: 3000000,
        currency: 'INR',
        targetGuestCount: 200,
        confirmedGuestCount: 0,
        status: 'planning',
        syncState: 'in-sync',
        priorities: ['Catering'],
        dietaryRequirements: ['Vegetarian'],
        accessibilityRequirements: [],
        preferences: { indoorOutdoor: 'hybrid' },
        culturalPreferences: {
          traditionId: 'pan-indian',
          selectedCeremonies: ['Haldi', 'Sangeet', 'Pheras', 'Reception'],
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const originalBudgetItems: BudgetItem[] = [
        {
          id: 'b-1',
          eventId: baseEvent.id,
          category: 'catering',
          name: 'Catering Feast',
          costStatus: 'estimated',
          estimatedAmount: 1800000,
          quotedAmount: 1800000,
          confirmedAmount: 0,
          allocatedAmount: 1800000,
          actualAmount: 1800000,
          paidAmount: 0,
          paymentStatus: 'planned',
        },
        {
          id: 'b-2',
          eventId: baseEvent.id,
          category: 'decor',
          name: 'Floral Mandap',
          costStatus: 'estimated',
          estimatedAmount: 800000,
          quotedAmount: 800000,
          confirmedAmount: 0,
          allocatedAmount: 800000,
          actualAmount: 800000,
          paidAmount: 0,
          paymentStatus: 'planned',
        },
      ]

      // Simulate reducing budget to 20 Lakhs while increasing guests to 250
      const simulation = simulateScenario(
        baseEvent,
        originalBudgetItems,
        [],
        [],
        {
          totalBudget: 2000000,
          guestCount: 250,
          eventDate: '2026-12-01',
          venueType: 'indoor',
        },
      )

      expect(simulation.comparison.deltas.budgetDelta).toBe(-1000000)
      expect(simulation.comparison.deltas.perGuestCostDelta).toBeLessThan(0)

      // Verify that cultural continuity tradeoff is explicitly presented
      const tradeoffs = simulation.tradeoffs
      const ritualContinuity = tradeoffs.find((t) => t.category === 'Traditions')
      expect(ritualContinuity).toBeDefined()
      expect(ritualContinuity?.description).toContain('culturally selected ceremonies')

      // Verify regional catering tradeoff
      const cateringTradeoff = tradeoffs.find((t) => t.category === 'Catering')
      expect(cateringTradeoff?.title).toContain('Live Buffet')
      expect(cateringTradeoff?.description).toContain('regional anchor dishes')
    })
  })

  describe('CreateEventModal Cultural Preferences Integration', () => {
    it('allows user to customize traditions, add custom ceremonies, and skip cultural questions', async () => {
      const handleClose = vi.fn()
      render(
        <PlannerProvider>
          <CreateEventModal isOpen={true} onClose={handleClose} />
        </PlannerProvider>,
      )

      // Advance to Step 3: Traditions & Rituals
      fireEvent.click(screen.getByRole('button', { name: /3\. traditions & rituals/i }))

      // Displays regional tradition buttons
      expect(screen.getByRole('button', { name: /punjabi/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /south indian/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /maharashtrian/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /gujarati/i })).toBeInTheDocument()

      // Select South Indian Muhurtham
      fireEvent.click(screen.getByRole('button', { name: /south indian/i }))

      // Verify South Indian ceremonies pre-filled
      expect(screen.getByText(/mangalya dharanam/i)).toBeInTheDocument()

      // Add a custom family ceremony
      const customInput = screen.getByPlaceholderText(/add a family-specific ritual/i)
      fireEvent.change(customInput, { target: { value: 'Grandmothers Blessing & Kashi Yatra' } })
      fireEvent.click(screen.getByRole('button', { name: /add/i }))

      expect(screen.getByText('Grandmothers Blessing & Kashi Yatra')).toBeInTheDocument()

      // Test Skip / Secular mode button
      const skipBtn = screen.getByRole('button', { name: /skip \/ secular mode/i })
      fireEvent.click(skipBtn)

      // Verifies secular mode switches to contemporary ceremonies
      expect(screen.getByText(/personal vow exchange/i)).toBeInTheDocument()
    })
  })
})
