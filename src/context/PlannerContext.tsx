import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import {
  NavSection,
  CelebrationEvent,
  NewCelebrationInput,
  ActivityLogItem,
  ThemeConcept,
  BudgetItem,
  TimelineTask,
  Vendor,
  PlanSyncAlert,
} from '@/types'
import { StorageService } from '@/services/storage/storageService'
import { SAMPLE_ALERTS } from '@/services/storage/sampleData'
import { generateThemeConcepts } from '@/services/ideas/conceptGenerator'

export type EventDetailTab =
  | 'overview'
  | 'ideas'
  | 'budget'
  | 'timeline'
  | 'vendors'
  | 'guest-experience'
  | 'contingency'

interface PlannerContextType {
  currentSection: NavSection
  setCurrentSection: (section: NavSection) => void
  events: CelebrationEvent[]
  activeEvent: CelebrationEvent | null
  setActiveEventId: (id: string) => void
  activeTab: EventDetailTab
  setActiveTab: (tab: EventDetailTab) => void
  budgetItems: BudgetItem[]
  timelineTasks: TimelineTask[]
  vendors: Vendor[]
  activities: ActivityLogItem[]
  themeConcepts: ThemeConcept[]
  selectedConcept: ThemeConcept | null
  selectThemeConcept: (conceptId: string) => void
  alerts: PlanSyncAlert[]
  isMobileNavOpen: boolean
  setIsMobileNavOpen: (open: boolean) => void
  isCreateEventOpen: boolean
  setIsCreateEventOpen: (open: boolean) => void
  isSyncing: boolean
  triggerManualSync: () => void
  resetWorkspace: () => void
  addEvent: (input: NewCelebrationInput) => CelebrationEvent
  updateActiveEvent: (updates: Partial<CelebrationEvent>) => void
  updateTaskStatus: (taskId: string, isCompleted: boolean) => void
}

const PlannerContext = createContext<PlannerContextType | undefined>(undefined)

export const PlannerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSection, setCurrentSection] = useState<NavSection>('dashboard')
  const [activeTab, setActiveTab] = useState<EventDetailTab>('overview')
  const [events, setEvents] = useState<CelebrationEvent[]>([])
  const [activeEventId, setActiveEventIdState] = useState<string>('')
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([])
  const [timelineTasks, setTimelineTasks] = useState<TimelineTask[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [activities, setActivities] = useState<ActivityLogItem[]>([])
  const [alerts, setAlerts] = useState<PlanSyncAlert[]>(SAMPLE_ALERTS)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false)
  const [isCreateEventOpen, setIsCreateEventOpen] = useState<boolean>(false)
  const [isSyncing, setIsSyncing] = useState<boolean>(false)

  // Load initial data
  useEffect(() => {
    const loadedEvents = StorageService.getEvents()
    setEvents(loadedEvents)

    const activeId = StorageService.getActiveEventId()
    setActiveEventIdState(activeId)

    setBudgetItems(StorageService.getBudgetItems(activeId))
    setTimelineTasks(StorageService.getTasks(activeId))
    setVendors(StorageService.getVendors(activeId))
    setActivities(StorageService.getActivities())
  }, [])

  // Switch active event
  const setActiveEventId = useCallback((id: string) => {
    setActiveEventIdState(id)
    StorageService.setActiveEventId(id)
    setBudgetItems(StorageService.getBudgetItems(id))
    setTimelineTasks(StorageService.getTasks(id))
    setVendors(StorageService.getVendors(id))
    setActivities(StorageService.getActivities(id))
  }, [])

  const activeEvent = useMemo(() => {
    return events.find((e) => e.id === activeEventId) || events[0] || null
  }, [events, activeEventId])

  // Get theme concepts for the active event
  const themeConcepts = useMemo(() => {
    if (!activeEvent) return []
    return StorageService.getConcepts(activeEvent)
  }, [activeEvent])

  const selectedConcept = useMemo(() => {
    if (!activeEvent) return null
    return (
      themeConcepts.find((c) => c.id === activeEvent.selectedConceptId) ||
      themeConcepts[1] || // default to creative-distinctive
      themeConcepts[0] ||
      null
    )
  }, [activeEvent, themeConcepts])

  // Concept selection action
  const selectThemeConcept = useCallback(
    (conceptId: string) => {
      if (!activeEvent) return
      const concept = themeConcepts.find((c) => c.id === conceptId)
      if (!concept) return

      const updatedEvent: CelebrationEvent = {
        ...activeEvent,
        selectedConceptId: conceptId,
        updatedAt: new Date().toISOString(),
      }

      const updatedEvents = events.map((e) => (e.id === activeEvent.id ? updatedEvent : e))
      setEvents(updatedEvents)
      StorageService.saveEvents(updatedEvents)

      // Log activity
      const activity: ActivityLogItem = {
        id: `act-${Date.now()}`,
        eventId: activeEvent.id,
        type: 'concept-selected',
        title: 'Theme Concept Selected',
        description: `Active design concept set to "${concept.title}" (${concept.tier.replace('-', ' ')}).`,
        timestamp: 'Just now',
      }
      StorageService.addActivity(activity)
      setActivities(StorageService.getActivities())
    },
    [activeEvent, themeConcepts, events],
  )

  // Toggle task status
  const updateTaskStatus = useCallback(
    (taskId: string, isCompleted: boolean) => {
      if (!activeEvent) return
      const updatedTasks = timelineTasks.map((t) => {
        if (t.id === taskId) {
          return { ...t, status: isCompleted ? ('completed' as const) : ('todo' as const) }
        }
        return t
      })
      setTimelineTasks(updatedTasks)
      StorageService.saveTasks(updatedTasks)

      const task = timelineTasks.find((t) => t.id === taskId)
      if (task && isCompleted) {
        const activity: ActivityLogItem = {
          id: `act-${Date.now()}`,
          eventId: activeEvent.id,
          type: 'task-completed',
          title: 'Milestone Completed',
          description: `Completed task "${task.title}".`,
          timestamp: 'Just now',
        }
        StorageService.addActivity(activity)
        setActivities(StorageService.getActivities())
      }
    },
    [activeEvent, timelineTasks],
  )

  // Add a newly created event with baseline data
  const addEvent = useCallback(
    (input: NewCelebrationInput): CelebrationEvent => {
      const eventId = `ev-${Date.now()}`
      const budget = input.totalBudget

      const newEvent: CelebrationEvent = {
        id: eventId,
        title: input.title.trim(),
        category: input.category,
        date: input.date,
        location: {
          venueName: input.venueName.trim() || 'Venue TBD',
          city: input.city.trim(),
          isIndoor: input.indoorOutdoor === 'indoor',
        },
        totalBudget: budget,
        currency: input.currency || 'USD',
        targetGuestCount: input.targetGuestCount,
        confirmedGuestCount: 0,
        status: 'planning',
        syncState: 'in-sync',
        syncSummary: 'Initial baseline budget, timeline, and personalized ideas aligned.',
        themePreference: input.themePreference?.trim(),
        selectedConceptId: `concept-${eventId}-creative`,
        priorities: input.priorities,
        dietaryRequirements: input.dietaryRequirements,
        dietaryNotes: input.dietaryNotes?.trim(),
        accessibilityRequirements: input.accessibilityRequirements,
        accessibilityNotes: input.accessibilityNotes?.trim(),
        preferences: {
          indoorOutdoor: input.indoorOutdoor,
          dressCode: input.dressCode?.trim(),
          specialNotes: input.specialNotes?.trim(),
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Generate initial budget items
      const initialBudgetItems: BudgetItem[] = [
        {
          id: `bgt-${eventId}-venue`,
          eventId,
          category: 'venue',
          name: 'Venue Rental & Facilities Fee',
          allocatedAmount: Math.round(budget * 0.28),
          actualAmount: Math.round(budget * 0.28),
          paidAmount: 0,
          paymentStatus: 'planned',
          notes: 'Estimated venue hold and facilities coordination',
        },
        {
          id: `bgt-${eventId}-catering`,
          eventId,
          category: 'catering-beverage',
          name: 'Catering, Beverages & Hospitality Service',
          allocatedAmount: Math.round(budget * 0.32),
          actualAmount: Math.round(budget * 0.32),
          paidAmount: 0,
          paymentStatus: 'planned',
          notes: `Estimated at ~$${Math.round((budget * 0.32) / Math.max(1, input.targetGuestCount))}/guest`,
        },
        {
          id: `bgt-${eventId}-decor`,
          eventId,
          category: 'decor-floral',
          name: 'Floral Design, Lighting & Ambiance Styling',
          allocatedAmount: Math.round(budget * 0.14),
          actualAmount: Math.round(budget * 0.14),
          paidAmount: 0,
          paymentStatus: 'planned',
          notes: 'Tabletop botanical arrangements and focal installations',
        },
        {
          id: `bgt-${eventId}-entertainment`,
          eventId,
          category: 'entertainment',
          name: 'Live Music, Sound & Entertainment Acts',
          allocatedAmount: Math.round(budget * 0.09),
          actualAmount: Math.round(budget * 0.09),
          paidAmount: 0,
          paymentStatus: 'planned',
        },
        {
          id: `bgt-${eventId}-media`,
          eventId,
          category: 'photography-media',
          name: 'Photography, Video & Memory Keepsakes',
          allocatedAmount: Math.round(budget * 0.09),
          actualAmount: Math.round(budget * 0.09),
          paidAmount: 0,
          paymentStatus: 'planned',
        },
        {
          id: `bgt-${eventId}-contingency`,
          eventId,
          category: 'contingency',
          name: 'Deterministic Contingency Buffer (8%)',
          allocatedAmount: Math.round(budget * 0.08),
          actualAmount: 0,
          paidAmount: 0,
          paymentStatus: 'planned',
          isContingency: true,
          notes: 'Protected cushion against vendor surcharges and emergency changes',
        },
      ]

      // Generate initial timeline milestones
      const initialTasks: TimelineTask[] = [
        {
          id: `task-${eventId}-1`,
          eventId,
          phase: 'concept-planning',
          title: 'Secure Venue & Confirm Date Hold',
          description: `Contract executed with ${input.venueName || 'venue'} in ${input.city}.`,
          targetDate: input.date,
          status: 'todo',
          priority: 'critical',
          isMilestone: true,
          isCriticalPath: true,
          dependencyIds: [],
        },
        {
          id: `task-${eventId}-2`,
          eventId,
          phase: 'vendor-curation',
          title: 'Review Personalized Theme Concepts & Menu Selections',
          description: `Evaluate 3 tailored concepts based on ${input.category} preferences.`,
          targetDate: input.date,
          status: 'todo',
          priority: 'high',
          isMilestone: false,
          isCriticalPath: true,
          dependencyIds: [`task-${eventId}-1`],
        },
        {
          id: `task-${eventId}-3`,
          eventId,
          phase: 'logistics-coordination',
          title: 'Finalize Guest RSVP Headcount & Dietary Needs',
          description: `Lock headcount for ${input.targetGuestCount} attendees with dietary requirements.`,
          targetDate: input.date,
          status: 'todo',
          priority: 'critical',
          isMilestone: true,
          isCriticalPath: true,
          dependencyIds: [`task-${eventId}-2`],
        },
        {
          id: `task-${eventId}-4`,
          eventId,
          phase: 'day-of-execution',
          title: `${input.title} Commencement`,
          description: 'Commencement of celebration, guest reception, and scheduled programming.',
          targetDate: input.date,
          status: 'todo',
          priority: 'critical',
          isMilestone: true,
          isCriticalPath: true,
          dependencyIds: [`task-${eventId}-3`],
        },
      ]

      // Initial activity log
      const activity: ActivityLogItem = {
        id: `act-${Date.now()}`,
        eventId,
        type: 'event-created',
        title: 'Celebration Plan Initialized',
        description: `Created "${input.title}" with $${budget.toLocaleString()} budget and ${input.targetGuestCount} guests.`,
        timestamp: 'Just now',
      }

      // Generate & cache concepts
      const concepts = generateThemeConcepts(newEvent)
      StorageService.saveConcepts(eventId, concepts)

      // Persist all data
      const updatedEvents = [newEvent, ...events]
      setEvents(updatedEvents)
      StorageService.saveEvents(updatedEvents)

      const allBudgetItems = [...StorageService.getBudgetItems(''), ...initialBudgetItems]
      StorageService.saveBudgetItems(allBudgetItems)
      setBudgetItems(initialBudgetItems)

      const allTasks = [...StorageService.getTasks(''), ...initialTasks]
      StorageService.saveTasks(allTasks)
      setTimelineTasks(initialTasks)

      StorageService.addActivity(activity)
      setActivities(StorageService.getActivities())

      setActiveEventIdState(eventId)
      StorageService.setActiveEventId(eventId)

      return newEvent
    },
    [events],
  )

  const updateActiveEvent = useCallback(
    (updates: Partial<CelebrationEvent>) => {
      if (!activeEvent) return
      const updated = { ...activeEvent, ...updates, updatedAt: new Date().toISOString() }
      const updatedEvents = events.map((e) => (e.id === activeEvent.id ? updated : e))
      setEvents(updatedEvents)
      StorageService.saveEvents(updatedEvents)
    },
    [activeEvent, events],
  )

  const triggerManualSync = useCallback(() => {
    setIsSyncing(true)
    setTimeout(() => {
      setIsSyncing(false)
    }, 800)
  }, [])

  const resetWorkspace = useCallback(() => {
    StorageService.resetAllData()
    const reloaded = StorageService.getEvents()
    setEvents(reloaded)
    const defId = StorageService.getActiveEventId()
    setActiveEventIdState(defId)
    setBudgetItems(StorageService.getBudgetItems(defId))
    setTimelineTasks(StorageService.getTasks(defId))
    setVendors(StorageService.getVendors(defId))
    setActivities(StorageService.getActivities())
    setAlerts(SAMPLE_ALERTS)
  }, [])

  const value: PlannerContextType = {
    currentSection,
    setCurrentSection,
    events,
    activeEvent,
    setActiveEventId,
    activeTab,
    setActiveTab,
    budgetItems,
    timelineTasks,
    vendors,
    activities,
    themeConcepts,
    selectedConcept,
    selectThemeConcept,
    alerts,
    isMobileNavOpen,
    setIsMobileNavOpen,
    isCreateEventOpen,
    setIsCreateEventOpen,
    isSyncing,
    triggerManualSync,
    resetWorkspace,
    addEvent,
    updateActiveEvent,
    updateTaskStatus,
  }

  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>
}

export function usePlanner(): PlannerContextType {
  const context = useContext(PlannerContext)
  if (!context) {
    throw new Error('usePlanner must be used within a PlannerProvider')
  }
  return context
}
