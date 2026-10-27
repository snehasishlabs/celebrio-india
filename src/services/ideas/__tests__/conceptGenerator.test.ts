import { describe, it, expect } from 'vitest'
import { generateThemeConcepts } from '../conceptGenerator'
import { CelebrationEvent } from '@/types/event'

const createMockEvent = (category: CelebrationEvent['category']): CelebrationEvent => ({
  id: 'test-event-1',
  title: 'Test Celebration',
  category,
  date: '2026-12-15',
  location: { venueName: 'Grand Hall', city: 'Seattle, WA', isIndoor: true },
  totalBudget: 50000,
  currency: 'USD',
  targetGuestCount: 120,
  confirmedGuestCount: 95,
  status: 'planning',
  syncState: 'in-sync',
  priorities: ['Culinary & Beverage', 'Ambiance & Florals'],
  dietaryRequirements: ['Vegetarian', 'Gluten-Free'],
  accessibilityRequirements: ['Wheelchair Accessible'],
  preferences: { indoorOutdoor: 'indoor' },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})

describe('generateThemeConcepts Service', () => {
  it('generates three distinct tiers: budget-conscious, creative-distinctive, and premium', () => {
    const event = createMockEvent('wedding')
    const concepts = generateThemeConcepts(event)

    expect(concepts).toHaveLength(3)
    const tiers = concepts.map((c) => c.tier)
    expect(tiers).toEqual(['budget-conscious', 'creative-distinctive', 'premium'])
  })

  it('supports wedding, birthday, anniversary, and community event categories', () => {
    const categories: CelebrationEvent['category'][] = [
      'wedding',
      'birthday',
      'anniversary',
      'community',
    ]

    categories.forEach((cat) => {
      const event = createMockEvent(cat)
      const concepts = generateThemeConcepts(event)
      expect(concepts).toHaveLength(3)
      concepts.forEach((concept) => {
        expect(concept.title).toBeTruthy()
        expect(concept.colorPalette.length).toBeGreaterThanOrEqual(4)
        expect(concept.decor.focalPoint).toBeTruthy()
        expect(concept.foodAndBeverage.serviceStyle).toBeTruthy()
        expect(concept.entertainment.mainAct).toBeTruthy()
        expect(concept.guestExperience.arrivalMoment).toBeTruthy()
        expect(concept.tradeoffs.advantages.length).toBeGreaterThan(0)
        expect(concept.tradeoffs.compromises.length).toBeGreaterThan(0)
        expect(concept.costEstimation.disclaimer).toMatch(/not a verified/i)
      })
    })
  })

  it('incorporates user dietary and accessibility requirements into the concept details', () => {
    const event = createMockEvent('wedding')
    const concepts = generateThemeConcepts(event)

    // Check that dietary highlights are included in food details
    const budgetConcept = concepts[0]
    expect(budgetConcept.foodAndBeverage.highlights.some((h) => h.includes('Vegetarian'))).toBe(true)
    // Check that accessibility highlights are reflected in comfort features
    expect(budgetConcept.guestExperience.comfortFeatures.some((f) => f.includes('Wheelchair'))).toBe(true)
  })

  it('ensures budget-conscious tier provides a lower cost estimate than total budget', () => {
    const event = createMockEvent('birthday')
    const concepts = generateThemeConcepts(event)
    const budgetTier = concepts.find((c) => c.tier === 'budget-conscious')!

    expect(budgetTier.costEstimation.estimatedTotal).toBeLessThan(event.totalBudget)
    expect(budgetTier.costEstimation.varianceFromBudget).toBeLessThan(0)
  })
})
