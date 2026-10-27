import { CelebrationEvent } from '@/types/event'
import { BudgetItem } from '@/types/budget'
import { TimelineTask } from '@/types/timeline'
import { Vendor } from '@/types/vendor'
import {
  SAMPLE_EVENT,
  SAMPLE_BUDGET_ITEMS,
  SAMPLE_TIMELINE_TASKS,
  SAMPLE_VENDORS,
} from './sampleData'

const STORAGE_KEYS = {
  EVENTS: 'celebrio_events_v1',
  ACTIVE_EVENT_ID: 'celebrio_active_event_id_v1',
  BUDGET_ITEMS: 'celebrio_budget_items_v1',
  TASKS: 'celebrio_tasks_v1',
  VENDORS: 'celebrio_vendors_v1',
} as const

// Memory fallback if localStorage is unavailable (e.g., in strict test environments)
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
      return JSON.parse(raw) as CelebrationEvent[]
    } catch {
      return [SAMPLE_EVENT]
    }
  },

  saveEvents(events: CelebrationEvent[]): void {
    setRaw(STORAGE_KEYS.EVENTS, JSON.stringify(events))
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

  getBudgetItems(eventId: string): BudgetItem[] {
    const raw = getRaw(STORAGE_KEYS.BUDGET_ITEMS)
    if (!raw) {
      this.saveBudgetItems(SAMPLE_BUDGET_ITEMS)
      return SAMPLE_BUDGET_ITEMS.filter((item) => item.eventId === eventId)
    }
    try {
      const all = JSON.parse(raw) as BudgetItem[]
      return all.filter((item) => item.eventId === eventId)
    } catch {
      return SAMPLE_BUDGET_ITEMS.filter((item) => item.eventId === eventId)
    }
  },

  saveBudgetItems(items: BudgetItem[]): void {
    setRaw(STORAGE_KEYS.BUDGET_ITEMS, JSON.stringify(items))
  },

  getTasks(eventId: string): TimelineTask[] {
    const raw = getRaw(STORAGE_KEYS.TASKS)
    if (!raw) {
      this.saveTasks(SAMPLE_TIMELINE_TASKS)
      return SAMPLE_TIMELINE_TASKS.filter((task) => task.eventId === eventId)
    }
    try {
      const all = JSON.parse(raw) as TimelineTask[]
      return all.filter((task) => task.eventId === eventId)
    } catch {
      return SAMPLE_TIMELINE_TASKS.filter((task) => task.eventId === eventId)
    }
  },

  saveTasks(tasks: TimelineTask[]): void {
    setRaw(STORAGE_KEYS.TASKS, JSON.stringify(tasks))
  },

  getVendors(eventId: string): Vendor[] {
    const raw = getRaw(STORAGE_KEYS.VENDORS)
    if (!raw) {
      this.saveVendors(SAMPLE_VENDORS)
      return SAMPLE_VENDORS.filter((v) => v.eventId === eventId)
    }
    try {
      const all = JSON.parse(raw) as Vendor[]
      return all.filter((v) => v.eventId === eventId)
    } catch {
      return SAMPLE_VENDORS.filter((v) => v.eventId === eventId)
    }
  },

  saveVendors(vendors: Vendor[]): void {
    setRaw(STORAGE_KEYS.VENDORS, JSON.stringify(vendors))
  },

  resetAllData(): void {
    this.saveEvents([SAMPLE_EVENT])
    this.setActiveEventId(SAMPLE_EVENT.id)
    this.saveBudgetItems(SAMPLE_BUDGET_ITEMS)
    this.saveTasks(SAMPLE_TIMELINE_TASKS)
    this.saveVendors(SAMPLE_VENDORS)
  },
}
