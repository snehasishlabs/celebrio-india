import { CelebrationEvent, ActivityLogItem } from '@/types/event'
import { BudgetItem } from '@/types/budget'
import { TimelineTask } from '@/types/timeline'
import { Vendor } from '@/types/vendor'
import { ThemeConcept } from '@/types/concept'
import {
  SAMPLE_EVENT,
  SAMPLE_ACTIVITIES,
  SAMPLE_BUDGET_ITEMS,
  SAMPLE_TIMELINE_TASKS,
  SAMPLE_VENDORS,
} from './sampleData'
import { generateThemeConcepts } from '@/services/ideas/conceptGenerator'

const STORAGE_KEYS = {
  EVENTS: 'celebrio_events_v2',
  ACTIVE_EVENT_ID: 'celebrio_active_event_id_v2',
  BUDGET_ITEMS: 'celebrio_budget_items_v2',
  TASKS: 'celebrio_tasks_v2',
  VENDORS: 'celebrio_vendors_v2',
  ACTIVITIES: 'celebrio_activities_v2',
  CONCEPTS_PREFIX: 'celebrio_concepts_v2_',
} as const

// Memory fallback if localStorage is unavailable
const memoryStore: Record<string, string> = {}

function getRaw(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key)
    }
    return memoryStore[key] ?? null
  } catch {
    return memoryStore[key] ?? null
  }
}

function setRaw(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value)
    }
    memoryStore[key] = value
  } catch {
    memoryStore[key] = value
  }
}

export const StorageService = {
  getEvents(): CelebrationEvent[] {
    const raw = getRaw(STORAGE_KEYS.EVENTS)
    if (!raw) {
      this.saveEvents([SAMPLE_EVENT])
      return [SAMPLE_EVENT]
    }
    try {
      const parsed = JSON.parse(raw) as CelebrationEvent[]
      return parsed.length > 0 ? parsed : [SAMPLE_EVENT]
    } catch {
      return [SAMPLE_EVENT]
    }
  },

  saveEvents(events: CelebrationEvent[]): void {
    setRaw(STORAGE_KEYS.EVENTS, JSON.stringify(events))
  },

  deleteEvent(eventId: string): void {
    const events = this.getEvents().filter((e) => e.id !== eventId)
    // Always preserve at least a sample event if all are deleted
    const safeEvents = events.length > 0 ? events : [SAMPLE_EVENT]
    this.saveEvents(safeEvents)

    // Clean up associated items
    const budgetItems = this.getBudgetItems().filter((item) => item.eventId !== eventId)
    this.saveBudgetItems(budgetItems)

    const tasks = this.getTasks().filter((task) => task.eventId !== eventId)
    this.saveTasks(tasks)

    const vendors = this.getVendors().filter((v) => v.eventId !== eventId)
    this.saveVendors(vendors)

    // Remove concepts key
    const conceptKey = `${STORAGE_KEYS.CONCEPTS_PREFIX}${eventId}`
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(conceptKey)
      }
      delete memoryStore[conceptKey]
    } catch {
      delete memoryStore[conceptKey]
    }

    // Reset active ID if deleted
    if (this.getActiveEventId() === eventId) {
      this.setActiveEventId(safeEvents[0].id)
    }
  },

  getActiveEventId(): string {
    const raw = getRaw(STORAGE_KEYS.ACTIVE_EVENT_ID)
    if (!raw) {
      setRaw(STORAGE_KEYS.ACTIVE_EVENT_ID, SAMPLE_EVENT.id)
      return SAMPLE_EVENT.id
    }
    return raw
  },

  setActiveEventId(id: string): void {
    setRaw(STORAGE_KEYS.ACTIVE_EVENT_ID, id)
  },

  getBudgetItems(eventId?: string): BudgetItem[] {
    const raw = getRaw(STORAGE_KEYS.BUDGET_ITEMS)
    if (!raw) {
      this.saveBudgetItems(SAMPLE_BUDGET_ITEMS)
      return eventId ? SAMPLE_BUDGET_ITEMS.filter((item) => item.eventId === eventId) : SAMPLE_BUDGET_ITEMS
    }
    try {
      const all = JSON.parse(raw) as BudgetItem[]
      return eventId ? all.filter((item) => item.eventId === eventId) : all
    } catch {
      return eventId ? SAMPLE_BUDGET_ITEMS.filter((item) => item.eventId === eventId) : SAMPLE_BUDGET_ITEMS
    }
  },

  saveBudgetItems(items: BudgetItem[]): void {
    setRaw(STORAGE_KEYS.BUDGET_ITEMS, JSON.stringify(items))
  },

  saveBudgetItemsForEvent(eventId: string, eventItems: BudgetItem[]): void {
    const all = this.getBudgetItems()
    const other = all.filter((item) => item.eventId !== eventId)
    this.saveBudgetItems([...other, ...eventItems])
  },

  getTasks(eventId?: string): TimelineTask[] {
    const raw = getRaw(STORAGE_KEYS.TASKS)
    if (!raw) {
      this.saveTasks(SAMPLE_TIMELINE_TASKS)
      return eventId ? SAMPLE_TIMELINE_TASKS.filter((task) => task.eventId === eventId) : SAMPLE_TIMELINE_TASKS
    }
    try {
      const all = JSON.parse(raw) as TimelineTask[]
      return eventId ? all.filter((task) => task.eventId === eventId) : all
    } catch {
      return eventId ? SAMPLE_TIMELINE_TASKS.filter((task) => task.eventId === eventId) : SAMPLE_TIMELINE_TASKS
    }
  },

  saveTasks(tasks: TimelineTask[]): void {
    setRaw(STORAGE_KEYS.TASKS, JSON.stringify(tasks))
  },

  saveTasksForEvent(eventId: string, eventTasks: TimelineTask[]): void {
    const all = this.getTasks()
    const other = all.filter((task) => task.eventId !== eventId)
    this.saveTasks([...other, ...eventTasks])
  },

  getVendors(eventId?: string): Vendor[] {
    const raw = getRaw(STORAGE_KEYS.VENDORS)
    if (!raw) {
      this.saveVendors(SAMPLE_VENDORS)
      return eventId ? SAMPLE_VENDORS.filter((v) => v.eventId === eventId) : SAMPLE_VENDORS
    }
    try {
      const all = JSON.parse(raw) as Vendor[]
      return eventId ? all.filter((v) => v.eventId === eventId) : all
    } catch {
      return eventId ? SAMPLE_VENDORS.filter((v) => v.eventId === eventId) : SAMPLE_VENDORS
    }
  },

  saveVendors(vendors: Vendor[]): void {
    setRaw(STORAGE_KEYS.VENDORS, JSON.stringify(vendors))
  },

  saveVendorsForEvent(eventId: string, eventVendors: Vendor[]): void {
    const all = this.getVendors()
    const other = all.filter((v) => v.eventId !== eventId)
    this.saveVendors([...other, ...eventVendors])
  },

  getActivities(eventId?: string): ActivityLogItem[] {
    const raw = getRaw(STORAGE_KEYS.ACTIVITIES)
    if (!raw) {
      this.saveActivities(SAMPLE_ACTIVITIES)
      return eventId
        ? SAMPLE_ACTIVITIES.filter((a) => a.eventId === eventId)
        : SAMPLE_ACTIVITIES
    }
    try {
      const all = JSON.parse(raw) as ActivityLogItem[]
      return eventId ? all.filter((a) => a.eventId === eventId) : all
    } catch {
      return eventId
        ? SAMPLE_ACTIVITIES.filter((a) => a.eventId === eventId)
        : SAMPLE_ACTIVITIES
    }
  },

  saveActivities(activities: ActivityLogItem[]): void {
    setRaw(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities))
  },

  addActivity(item: ActivityLogItem): void {
    const current = this.getActivities()
    const updated = [item, ...current].slice(0, 30) // keep last 30 activities
    this.saveActivities(updated)
  },

  getConcepts(event: CelebrationEvent): ThemeConcept[] {
    const key = `${STORAGE_KEYS.CONCEPTS_PREFIX}${event.id}`
    const raw = getRaw(key)
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as ThemeConcept[]
        if (parsed.length > 0) return parsed
      } catch {
        // regenerate
      }
    }
    const generated = generateThemeConcepts(event)
    setRaw(key, JSON.stringify(generated))
    return generated
  },

  saveConcepts(eventId: string, concepts: ThemeConcept[]): void {
    const key = `${STORAGE_KEYS.CONCEPTS_PREFIX}${eventId}`
    setRaw(key, JSON.stringify(concepts))
  },

  resetAllData(): void {
    this.saveEvents([SAMPLE_EVENT])
    this.setActiveEventId(SAMPLE_EVENT.id)
    this.saveBudgetItems(SAMPLE_BUDGET_ITEMS)
    this.saveTasks(SAMPLE_TIMELINE_TASKS)
    this.saveVendors(SAMPLE_VENDORS)
    this.saveActivities(SAMPLE_ACTIVITIES)
    this.saveConcepts(SAMPLE_EVENT.id, generateThemeConcepts(SAMPLE_EVENT))
  },
}
