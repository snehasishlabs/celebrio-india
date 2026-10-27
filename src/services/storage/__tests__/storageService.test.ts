import { describe, it, expect, beforeEach } from 'vitest'
import { StorageService } from '../storageService'
import { SAMPLE_EVENT } from '../sampleData'
import { CelebrationEvent } from '@/types/event'
import { BudgetItem } from '@/types/budget'

describe('StorageService (Persistence Engine)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('initializes with default sample event when localStorage is empty', () => {
    const events = StorageService.getEvents()
    expect(events.length).toBeGreaterThanOrEqual(1)
    expect(events[0].id).toBe(SAMPLE_EVENT.id)
  })

  it('persists and retrieves updated events list', () => {
    const customEvent: CelebrationEvent = {
      ...SAMPLE_EVENT,
      id: 'evt-custom-persist-test',
      title: 'Diamond Milestone Jubilee',
    }
    StorageService.saveEvents([customEvent])

    const retrieved = StorageService.getEvents()
    expect(retrieved).toHaveLength(1)
    expect(retrieved[0].id).toBe('evt-custom-persist-test')
    expect(retrieved[0].title).toBe('Diamond Milestone Jubilee')
  })

  it('gracefully recovers from corrupted JSON in localStorage', () => {
    localStorage.setItem('celebrio_events_v2', 'MALFORMED_JSON_STRING{{{')
    const events = StorageService.getEvents()
    expect(events).toHaveLength(1)
    expect(events[0].id).toBe(SAMPLE_EVENT.id)
  })

  it('persists and switches active event id', () => {
    StorageService.setActiveEventId('evt-target-active')
    expect(StorageService.getActiveEventId()).toBe('evt-target-active')
  })

  it('persists budget items for an event and isolates other events', () => {
    const customItems: BudgetItem[] = [
      {
        id: 'b-custom-1',
        eventId: 'evt-event-alpha',
        category: 'venue',
        name: 'Historic Grand Ballroom',
        costStatus: 'confirmed',
        estimatedAmount: 12000,
        quotedAmount: 12000,
        confirmedAmount: 12000,
        allocatedAmount: 12000,
        actualAmount: 12000,
        paidAmount: 3000,
        paymentStatus: 'deposit-paid',
        notes: 'Deposit paid',
      },
    ]

    StorageService.saveBudgetItemsForEvent('evt-event-alpha', customItems)

    const alphaItems = StorageService.getBudgetItems('evt-event-alpha')
    expect(alphaItems).toHaveLength(1)
    expect(alphaItems[0].name).toBe('Historic Grand Ballroom')

    // Different event query returns empty
    const betaItems = StorageService.getBudgetItems('evt-event-beta')
    expect(betaItems).toHaveLength(0)
  })

  it('enforces rolling retention limit of 30 items for activity log', () => {
    for (let i = 0; i < 40; i++) {
      StorageService.addActivity({
        id: `act-${i}`,
        eventId: SAMPLE_EVENT.id,
        type: 'task-completed',
        title: `Activity Action ${i}`,
        description: `Description ${i}`,
        timestamp: new Date().toISOString(),
      })
    }

    const activities = StorageService.getActivities()
    expect(activities).toHaveLength(30)
    // Most recent is first
    expect(activities[0].title).toBe('Activity Action 39')
  })

  it('persists and retrieves cached theme concepts per event', () => {
    const concepts = StorageService.getConcepts(SAMPLE_EVENT)
    expect(concepts).toHaveLength(3)

    // Save custom variation
    const updated = concepts.map((c) => ({ ...c, title: `Customized: ${c.title}` }))
    StorageService.saveConcepts(SAMPLE_EVENT.id, updated)

    const reloaded = StorageService.getConcepts(SAMPLE_EVENT)
    expect(reloaded[0].title).toMatch(/^Customized:/)
  })

  it('deletes an event and cleans up its associated budget items and tasks', () => {
    const eventA: CelebrationEvent = {
      ...SAMPLE_EVENT,
      id: 'evt-to-delete-1',
      title: 'Temporary Celebration',
    }
    const eventB: CelebrationEvent = {
      ...SAMPLE_EVENT,
      id: 'evt-to-keep-2',
      title: 'Persistent Celebration',
    }

    StorageService.saveEvents([eventA, eventB])
    StorageService.setActiveEventId('evt-to-delete-1')
    StorageService.saveBudgetItemsForEvent('evt-to-delete-1', [
      {
        id: 'b-del-1',
        eventId: 'evt-to-delete-1',
        category: 'venue',
        name: 'Venue to delete',
        costStatus: 'estimated',
        estimatedAmount: 5000,
        quotedAmount: 5000,
        confirmedAmount: 0,
        allocatedAmount: 5000,
        actualAmount: 0,
        paidAmount: 0,
        paymentStatus: 'planned',
      },
    ])

    // Verify it exists before deletion
    expect(StorageService.getEvents()).toHaveLength(2)
    expect(StorageService.getBudgetItems('evt-to-delete-1')).toHaveLength(1)

    // Execute deletion
    StorageService.deleteEvent('evt-to-delete-1')

    // Verify event is removed
    const remainingEvents = StorageService.getEvents()
    expect(remainingEvents).toHaveLength(1)
    expect(remainingEvents[0].id).toBe('evt-to-keep-2')

    // Active event switched to remaining event
    expect(StorageService.getActiveEventId()).toBe('evt-to-keep-2')

    // Associated budget items are cleaned up
    expect(StorageService.getBudgetItems('evt-to-delete-1')).toHaveLength(0)
  })

  it('resets all data back to the clean showcase baseline', () => {
    StorageService.setActiveEventId('temp-deleted-event')
    StorageService.resetAllData()

    expect(StorageService.getActiveEventId()).toBe(SAMPLE_EVENT.id)
    expect(StorageService.getEvents()[0].id).toBe(SAMPLE_EVENT.id)
  })
})
