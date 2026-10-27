import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import {
  NavSection,
  CelebrationEvent,
  SyncState,
  NewCelebrationInput,
  ActivityLogItem,
  ThemeConcept,
  BudgetItem,
  TimelineTask,
  TaskPriority,
  Vendor,
  PlanSyncAlert,
  ScenarioInput,
  ScenarioSimulationResult,
  AIPlanningSource,
} from '@/types'
import { StorageService } from '@/services/storage/storageService'
import { SAMPLE_ALERTS } from '@/services/storage/sampleData'
import { generateThemeConcepts } from '@/services/ideas/conceptGenerator'
import { generateCelebrationConcepts, fetchServerHealth } from '@/services/ai/aiPlanningService'
import { calculateBudgetSummary, sanitizeAmount } from '@/utils/budgetGuardian'
import { generatePreparationTasks } from '@/utils/timelineEngine'
import {
  syncVendorToBudgetItems,
  generateDefaultPaymentMilestones,
  getVendorCategoryQuestions,
} from '@/utils/vendorEngine'

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
  aiPlanningSource: AIPlanningSource
  aiModelName: string
  isGeneratingIdeas: boolean
  regenerateIdeasWithAI: () => Promise<void>
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

  // Timeline Task Operations
  updateTaskStatus: (taskId: string, isCompleted: boolean) => void
  addTimelineTask: (task: Omit<TimelineTask, 'id' | 'eventId'>) => TimelineTask
  updateTimelineTask: (taskId: string, updates: Partial<TimelineTask>) => void
  deleteTimelineTask: (taskId: string) => void
  reopenTimelineTask: (taskId: string) => void
  regenerateTimelineTasks: () => void

  // Budget Item Operations
  addBudgetItem: (item: Omit<BudgetItem, 'id' | 'eventId'>) => BudgetItem
  updateBudgetItem: (itemId: string, updates: Partial<BudgetItem>) => void
  deleteBudgetItem: (itemId: string) => void
  applyCostSavingAlternative: (itemId: string, newAmount: number, description: string) => void

  // Vendor Operations
  addVendor: (vendor: Omit<Vendor, 'id' | 'eventId'>) => Vendor
  updateVendor: (vendorId: string, updates: Partial<Vendor>) => void
  deleteVendor: (vendorId: string) => void
  toggleMilestonePaid: (vendorId: string, milestoneId: string) => void

  // Adaptive Scenario Simulator
  applyScenario: (input: ScenarioInput, result: ScenarioSimulationResult) => void
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
  const [customConcepts, setCustomConcepts] = useState<Record<string, ThemeConcept[]>>({})
  const [aiPlanningSource, setAiPlanningSource] = useState<AIPlanningSource>('deterministic-demo')
  const [aiModelName, setAiModelName] = useState<string>('demo-rule-engine')
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState<boolean>(false)

  // Probe server configuration mode on mount
  useEffect(() => {
    let isMounted = true
    fetchServerHealth()
      .then((health) => {
        if (!isMounted) return
        if (health.hasGeminiKey) {
          setAiPlanningSource('gemini-live')
          setAiModelName(health.model || 'gemini-2.5-flash')
        } else {
          setAiPlanningSource('deterministic-demo')
          setAiModelName('demo-rule-engine')
        }
      })
      .catch(() => {
        if (!isMounted) return
        setAiPlanningSource('deterministic-demo')
        setAiModelName('demo-rule-engine')
      })
    return () => {
      isMounted = false
    }
  }, [])

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
    return customConcepts[activeEvent.id] || StorageService.getConcepts(activeEvent)
  }, [activeEvent, customConcepts])

  const selectedConcept = useMemo(() => {
    if (!activeEvent) return null
    return (
      themeConcepts.find((c) => c.id === activeEvent.selectedConceptId) ||
      themeConcepts[1] ||
      themeConcepts[0] ||
      null
    )
  }, [activeEvent, themeConcepts])

  // Regenerate ideas with live Gemini AI (or deterministic demo engine if offline/unconfigured)
  const regenerateIdeasWithAI = useCallback(async () => {
    if (!activeEvent) return
    setIsGeneratingIdeas(true)
    try {
      const res = await generateCelebrationConcepts(activeEvent)
      setCustomConcepts((prev) => ({ ...prev, [activeEvent.id]: res.concepts }))
      setAiPlanningSource(res.source)
      setAiModelName(res.model)
      StorageService.saveConcepts(activeEvent.id, res.concepts)

      const newActivity: ActivityLogItem = {
        id: `act-${Date.now()}`,
        eventId: activeEvent.id,
        type: 'concept-selected',
        title: res.source === 'gemini-live' ? 'Live Gemini Concepts Generated' : 'Demo Concepts Refreshed',
        description: `Generated 3 celebration concepts via ${res.model}.`,
        timestamp: new Date().toISOString(),
      }
      StorageService.addActivity(newActivity)
      setActivities(StorageService.getActivities(activeEvent.id))
    } finally {
      setIsGeneratingIdeas(false)
    }
  }, [activeEvent])

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
      StorageService.saveTasksForEvent(activeEvent.id, updatedTasks)

      const task = timelineTasks.find((t) => t.id === taskId)
      if (task) {
        const activity: ActivityLogItem = {
          id: `act-${Date.now()}`,
          eventId: activeEvent.id,
          type: 'task-completed',
          title: isCompleted ? 'Milestone Completed' : 'Milestone Reopened',
          description: isCompleted
            ? `Completed task "${task.title}".`
            : `Reopened task "${task.title}" for active tracking.`,
          timestamp: 'Just now',
        }
        StorageService.addActivity(activity)
        setActivities(StorageService.getActivities())
      }
    },
    [activeEvent, timelineTasks],
  )

  const reopenTimelineTask = useCallback(
    (taskId: string) => {
      updateTaskStatus(taskId, false)
    },
    [updateTaskStatus],
  )

  const addTimelineTask = useCallback(
    (taskInput: Omit<TimelineTask, 'id' | 'eventId'>): TimelineTask => {
      if (!activeEvent) throw new Error('No active event selected')

      const newTask: TimelineTask = {
        ...taskInput,
        id: `task-${Date.now()}`,
        eventId: activeEvent.id,
        deadline: taskInput.deadline || taskInput.targetDate,
        owner: taskInput.owner || taskInput.assignedTo,
        status: taskInput.status || 'todo',
        priority: taskInput.priority || 'medium',
        isMilestone: taskInput.isMilestone ?? false,
        isCriticalPath: taskInput.isCriticalPath ?? false,
        dependencyIds: taskInput.dependencyIds || [],
      }

      const updated = [...timelineTasks, newTask]
      setTimelineTasks(updated)
      StorageService.saveTasksForEvent(activeEvent.id, updated)

      const activity: ActivityLogItem = {
        id: `act-${Date.now()}`,
        eventId: activeEvent.id,
        type: 'task-completed',
        title: 'Timeline Task Added',
        description: `Added "${newTask.title}" scheduled for ${newTask.targetDate || 'TBD'}.`,
        timestamp: 'Just now',
      }
      StorageService.addActivity(activity)
      setActivities(StorageService.getActivities())

      return newTask
    },
    [activeEvent, timelineTasks],
  )

  const updateTimelineTask = useCallback(
    (taskId: string, updates: Partial<TimelineTask>) => {
      if (!activeEvent) return

      const updated = timelineTasks.map((task) => {
        if (task.id === taskId) {
          const merged = { ...task, ...updates }
          if (updates.targetDate) {
            merged.deadline = updates.targetDate
          }
          if (updates.assignedTo) {
            merged.owner = updates.assignedTo
          }
          return merged
        }
        return task
      })

      setTimelineTasks(updated)
      StorageService.saveTasksForEvent(activeEvent.id, updated)

      const target = updated.find((t) => t.id === taskId)
      if (target) {
        const activity: ActivityLogItem = {
          id: `act-${Date.now()}`,
          eventId: activeEvent.id,
          type: 'task-completed',
          title: 'Timeline Milestone Updated',
          description: `Updated "${target.title}" (target date: ${target.targetDate}, status: ${target.status}).`,
          timestamp: 'Just now',
        }
        StorageService.addActivity(activity)
        setActivities(StorageService.getActivities())
      }
    },
    [activeEvent, timelineTasks],
  )

  const deleteTimelineTask = useCallback(
    (taskId: string) => {
      if (!activeEvent) return
      const target = timelineTasks.find((t) => t.id === taskId)
      const updated = timelineTasks.filter((t) => t.id !== taskId)
      setTimelineTasks(updated)
      StorageService.saveTasksForEvent(activeEvent.id, updated)

      if (target) {
        const activity: ActivityLogItem = {
          id: `act-${Date.now()}`,
          eventId: activeEvent.id,
          type: 'task-completed',
          title: 'Milestone Removed',
          description: `Removed task "${target.title}" from timeline schedule.`,
          timestamp: 'Just now',
        }
        StorageService.addActivity(activity)
        setActivities(StorageService.getActivities())
      }
    },
    [activeEvent, timelineTasks],
  )

  const regenerateTimelineTasks = useCallback(() => {
    if (!activeEvent) return
    const regenerated = generatePreparationTasks(activeEvent)
    setTimelineTasks(regenerated)
    StorageService.saveTasksForEvent(activeEvent.id, regenerated)

    const activity: ActivityLogItem = {
      id: `act-${Date.now()}`,
      eventId: activeEvent.id,
      type: 'task-completed',
      title: 'Timeline Recalibrated',
      description: `Regenerated preparation milestones tailored to ${activeEvent.category} celebration date (${activeEvent.date || 'TBD'}).`,
      timestamp: 'Just now',
    }
    StorageService.addActivity(activity)
    setActivities(StorageService.getActivities())
  }, [activeEvent])

  // Budget item management with instant recalculation
  const addBudgetItem = useCallback(
    (itemInput: Omit<BudgetItem, 'id' | 'eventId'>): BudgetItem => {
      if (!activeEvent) throw new Error('No active event selected')

      const newItem: BudgetItem = {
        ...itemInput,
        id: `bgt-${Date.now()}`,
        eventId: activeEvent.id,
        costStatus: itemInput.costStatus || 'estimated',
        estimatedAmount: sanitizeAmount(itemInput.estimatedAmount || itemInput.allocatedAmount),
        quotedAmount: sanitizeAmount(itemInput.quotedAmount || itemInput.allocatedAmount),
        confirmedAmount: sanitizeAmount(itemInput.confirmedAmount || 0),
        allocatedAmount: sanitizeAmount(itemInput.allocatedAmount),
        actualAmount: sanitizeAmount(itemInput.actualAmount || itemInput.allocatedAmount),
        paidAmount: sanitizeAmount(itemInput.paidAmount || 0),
        paymentStatus: itemInput.paymentStatus || 'planned',
        isContingency: itemInput.isContingency ?? itemInput.category === 'contingency',
      }

      const updated = [...budgetItems, newItem]
      setBudgetItems(updated)
      StorageService.saveBudgetItems(updated)

      // Recalculate summary and update event sync state
      const summary = calculateBudgetSummary(activeEvent.totalBudget, updated)
      const nextSyncState: SyncState = summary.isOverBudget ? 'drift-detected' : 'in-sync'
      if (activeEvent.syncState !== nextSyncState) {
        const updatedEvent: CelebrationEvent = { ...activeEvent, syncState: nextSyncState }
        setEvents(events.map((e) => (e.id === activeEvent.id ? updatedEvent : e)))
        StorageService.saveEvents(events.map((e) => (e.id === activeEvent.id ? updatedEvent : e)))
      }

      // Audit log
      const activity: ActivityLogItem = {
        id: `act-${Date.now()}`,
        eventId: activeEvent.id,
        type: 'budget-updated',
        title: 'Budget Line Added',
        description: `Added "${newItem.name}" (${newItem.category}) with allocation of $${newItem.allocatedAmount.toLocaleString()}.`,
        timestamp: 'Just now',
      }
      StorageService.addActivity(activity)
      setActivities(StorageService.getActivities())

      return newItem
    },
    [activeEvent, budgetItems, events],
  )

  const updateBudgetItem = useCallback(
    (itemId: string, updates: Partial<BudgetItem>) => {
      if (!activeEvent) return

      const updated = budgetItems.map((item) => {
        if (item.id === itemId) {
          const merged = { ...item, ...updates }
          return {
            ...merged,
            allocatedAmount: sanitizeAmount(merged.allocatedAmount),
            actualAmount: sanitizeAmount(merged.actualAmount),
            paidAmount: sanitizeAmount(merged.paidAmount),
            estimatedAmount: sanitizeAmount(merged.estimatedAmount || merged.allocatedAmount),
            quotedAmount: sanitizeAmount(merged.quotedAmount || merged.allocatedAmount),
            confirmedAmount: sanitizeAmount(merged.confirmedAmount || 0),
          }
        }
        return item
      })

      setBudgetItems(updated)
      StorageService.saveBudgetItems(updated)

      const target = updated.find((i) => i.id === itemId)
      if (target) {
        const activity: ActivityLogItem = {
          id: `act-${Date.now()}`,
          eventId: activeEvent.id,
          type: 'budget-updated',
          title: 'Budget Line Updated',
          description: `Updated "${target.name}" to $${target.allocatedAmount.toLocaleString()} (${target.costStatus}).`,
          timestamp: 'Just now',
        }
        StorageService.addActivity(activity)
        setActivities(StorageService.getActivities())
      }
    },
    [activeEvent, budgetItems],
  )

  const deleteBudgetItem = useCallback(
    (itemId: string) => {
      if (!activeEvent) return
      const target = budgetItems.find((i) => i.id === itemId)
      const updated = budgetItems.filter((i) => i.id !== itemId)
      setBudgetItems(updated)
      StorageService.saveBudgetItems(updated)

      if (target) {
        const activity: ActivityLogItem = {
          id: `act-${Date.now()}`,
          eventId: activeEvent.id,
          type: 'budget-updated',
          title: 'Budget Line Removed',
          description: `Removed "${target.name}" from budget ledger.`,
          timestamp: 'Just now',
        }
        StorageService.addActivity(activity)
        setActivities(StorageService.getActivities())
      }
    },
    [activeEvent, budgetItems],
  )

  const applyCostSavingAlternative = useCallback(
    (itemId: string, newAmount: number, description: string) => {
      if (!activeEvent) return
      const safeNewAmt = sanitizeAmount(newAmount)
      const target = budgetItems.find((i) => i.id === itemId)
      if (!target) return

      const savings = Math.max(0, target.allocatedAmount - safeNewAmt)
      const updated = budgetItems.map((i) => {
        if (i.id === itemId) {
          return {
            ...i,
            allocatedAmount: safeNewAmt,
            notes: i.notes ? `${i.notes} | Optimized: ${description}` : `Optimized: ${description}`,
          }
        }
        return i
      })

      setBudgetItems(updated)
      StorageService.saveBudgetItems(updated)

      const activity: ActivityLogItem = {
        id: `act-${Date.now()}`,
        eventId: activeEvent.id,
        type: 'budget-updated',
        title: 'Cost Alternative Applied',
        description: `Applied optimization to "${target.name}", saving $${savings.toLocaleString()}.`,
        timestamp: 'Just now',
      }
      StorageService.addActivity(activity)
      setActivities(StorageService.getActivities())
    },
    [activeEvent, budgetItems],
  )

  const addVendor = useCallback(
    (vendorInput: Omit<Vendor, 'id' | 'eventId'>): Vendor => {
      if (!activeEvent) throw new Error('No active event selected')

      const newVendorId = `ven-${Date.now()}`
      const standardQuestions = getVendorCategoryQuestions(vendorInput.service)
      const standardMilestones =
        vendorInput.paymentMilestones && vendorInput.paymentMilestones.length > 0
          ? vendorInput.paymentMilestones
          : generateDefaultPaymentMilestones(vendorInput.quotedCost, activeEvent.date)

      const newVendor: Vendor = {
        ...vendorInput,
        id: newVendorId,
        eventId: activeEvent.id,
        quotedCost: sanitizeAmount(vendorInput.quotedCost),
        finalCost: vendorInput.finalCost ? sanitizeAmount(vendorInput.finalCost) : undefined,
        depositAmount: sanitizeAmount(vendorInput.depositAmount),
        depositPaid: vendorInput.depositPaid ?? false,
        contractStatus: vendorInput.contractStatus || 'researching',
        questionsToAsk: vendorInput.questionsToAsk || standardQuestions,
        paymentMilestones: standardMilestones,
      }

      const updatedVendors = [...vendors, newVendor]
      setVendors(updatedVendors)
      StorageService.saveVendorsForEvent(activeEvent.id, updatedVendors)

      // Synchronize with budget items
      const syncedBudget = syncVendorToBudgetItems(newVendor, budgetItems)
      setBudgetItems(syncedBudget)
      StorageService.saveBudgetItemsForEvent(activeEvent.id, syncedBudget)

      const activity: ActivityLogItem = {
        id: `act-${Date.now()}`,
        eventId: activeEvent.id,
        type: 'vendor-contracted',
        title: 'Vendor Added',
        description: `Added ${newVendor.name || 'supplier'} (${newVendor.service}) with quoted cost of $${newVendor.quotedCost.toLocaleString()}.`,
        timestamp: 'Just now',
      }
      StorageService.addActivity(activity)
      setActivities(StorageService.getActivities())

      return newVendor
    },
    [activeEvent, vendors, budgetItems],
  )

  const updateVendor = useCallback(
    (vendorId: string, updates: Partial<Vendor>) => {
      if (!activeEvent) return

      let updatedVendorObj: Vendor | null = null
      const updatedVendors = vendors.map((v) => {
        if (v.id === vendorId) {
          const merged: Vendor = {
            ...v,
            ...updates,
            quotedCost: updates.quotedCost !== undefined ? sanitizeAmount(updates.quotedCost) : v.quotedCost,
            finalCost: updates.finalCost !== undefined ? sanitizeAmount(updates.finalCost) : v.finalCost,
            depositAmount: updates.depositAmount !== undefined ? sanitizeAmount(updates.depositAmount) : v.depositAmount,
          }
          updatedVendorObj = merged
          return merged
        }
        return v
      })

      setVendors(updatedVendors)
      StorageService.saveVendorsForEvent(activeEvent.id, updatedVendors)

      if (updatedVendorObj) {
        // Instant bidirectional synchronization with budget items
        const syncedBudget = syncVendorToBudgetItems(updatedVendorObj, budgetItems)
        setBudgetItems(syncedBudget)
        StorageService.saveBudgetItemsForEvent(activeEvent.id, syncedBudget)

        // Check if sync state changed
        const summary = calculateBudgetSummary(activeEvent.totalBudget, syncedBudget)
        const nextSyncState: SyncState = summary.isOverBudget ? 'drift-detected' : 'in-sync'
        if (activeEvent.syncState !== nextSyncState) {
          const updatedEvent: CelebrationEvent = { ...activeEvent, syncState: nextSyncState }
          setEvents(events.map((e) => (e.id === activeEvent.id ? updatedEvent : e)))
          StorageService.saveEvents(events.map((e) => (e.id === activeEvent.id ? updatedEvent : e)))
        }

        const activity: ActivityLogItem = {
          id: `act-${Date.now()}`,
          eventId: activeEvent.id,
          type: 'vendor-contracted',
          title: 'Vendor Updated',
          description: `Updated ${(updatedVendorObj as Vendor).name || 'vendor'} (${(updatedVendorObj as Vendor).contractStatus}). Budget commitments re-synchronized.`,
          timestamp: 'Just now',
        }
        StorageService.addActivity(activity)
        setActivities(StorageService.getActivities())
      }
    },
    [activeEvent, vendors, budgetItems, events],
  )

  const deleteVendor = useCallback(
    (vendorId: string) => {
      if (!activeEvent) return
      const target = vendors.find((v) => v.id === vendorId)
      const updatedVendors = vendors.filter((v) => v.id !== vendorId)
      setVendors(updatedVendors)
      StorageService.saveVendorsForEvent(activeEvent.id, updatedVendors)

      if (target) {
        const activity: ActivityLogItem = {
          id: `act-${Date.now()}`,
          eventId: activeEvent.id,
          type: 'vendor-contracted',
          title: 'Vendor Removed',
          description: `Removed vendor "${target.name || 'supplier'}" from portfolio.`,
          timestamp: 'Just now',
        }
        StorageService.addActivity(activity)
        setActivities(StorageService.getActivities())
      }
    },
    [activeEvent, vendors],
  )

  const toggleMilestonePaid = useCallback(
    (vendorId: string, milestoneId: string) => {
      if (!activeEvent) return
      const targetVendor = vendors.find((v) => v.id === vendorId)
      if (!targetVendor || !targetVendor.paymentMilestones) return

      const updatedMilestones = targetVendor.paymentMilestones.map((m) => {
        if (m.id === milestoneId) {
          return {
            ...m,
            isPaid: !m.isPaid,
            paidDate: !m.isPaid ? new Date().toISOString().split('T')[0] : undefined,
          }
        }
        return m
      })

      updateVendor(vendorId, { paymentMilestones: updatedMilestones })
    },
    [activeEvent, vendors, updateVendor],
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

      // Generate initial budget items with full cost status & tracking
      const initialBudgetItems: BudgetItem[] = [
        {
          id: `bgt-${eventId}-venue`,
          eventId,
          category: 'venue',
          name: 'Venue Rental & Facilities Fee',
          costStatus: 'estimated',
          estimatedAmount: Math.round(budget * 0.28),
          quotedAmount: Math.round(budget * 0.28),
          confirmedAmount: 0,
          allocatedAmount: Math.round(budget * 0.28),
          actualAmount: Math.round(budget * 0.28),
          paidAmount: 0,
          paymentStatus: 'planned',
          notes: 'Estimated venue hold and facilities coordination',
        },
        {
          id: `bgt-${eventId}-catering`,
          eventId,
          category: 'catering',
          name: 'Catering, Beverages & Hospitality Service',
          costStatus: 'estimated',
          estimatedAmount: Math.round(budget * 0.32),
          quotedAmount: Math.round(budget * 0.32),
          confirmedAmount: 0,
          allocatedAmount: Math.round(budget * 0.32),
          actualAmount: Math.round(budget * 0.32),
          paidAmount: 0,
          paymentStatus: 'planned',
          notes: `Estimated at ~$${Math.round((budget * 0.32) / Math.max(1, input.targetGuestCount))}/guest`,
        },
        {
          id: `bgt-${eventId}-decor`,
          eventId,
          category: 'decor',
          name: 'Floral Design, Lighting & Ambiance Styling',
          costStatus: 'estimated',
          estimatedAmount: Math.round(budget * 0.14),
          quotedAmount: Math.round(budget * 0.14),
          confirmedAmount: 0,
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
          costStatus: 'estimated',
          estimatedAmount: Math.round(budget * 0.09),
          quotedAmount: Math.round(budget * 0.09),
          confirmedAmount: 0,
          allocatedAmount: Math.round(budget * 0.09),
          actualAmount: Math.round(budget * 0.09),
          paidAmount: 0,
          paymentStatus: 'planned',
        },
        {
          id: `bgt-${eventId}-media`,
          eventId,
          category: 'photography',
          name: 'Photography, Video & Memory Keepsakes',
          costStatus: 'estimated',
          estimatedAmount: Math.round(budget * 0.09),
          quotedAmount: Math.round(budget * 0.09),
          confirmedAmount: 0,
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
          costStatus: 'confirmed',
          estimatedAmount: Math.round(budget * 0.08),
          quotedAmount: Math.round(budget * 0.08),
          confirmedAmount: Math.round(budget * 0.08),
          allocatedAmount: Math.round(budget * 0.08),
          actualAmount: 0,
          paidAmount: 0,
          paymentStatus: 'planned',
          isContingency: true,
          notes: 'Protected safety cushion for supplier surcharges and unexpected shifts',
        },
      ]

      // Initial timeline milestones generated dynamically from horizon & event category
      const initialTasks: TimelineTask[] = generatePreparationTasks(newEvent)

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

  const applyScenario = useCallback(
    (input: ScenarioInput, result: ScenarioSimulationResult) => {
      if (!activeEvent) return

      const safeBudget = sanitizeAmount(input.totalBudget)
      const safeGuests = Math.max(1, Math.round(input.guestCount))
      const safeDate = input.eventDate.trim() || activeEvent.date

      // 1. Update active event
      const nextSyncState: SyncState = result.hasCriticalWarnings ? 'drift-detected' : 'in-sync'
      const updatedEvent: CelebrationEvent = {
        ...activeEvent,
        totalBudget: safeBudget,
        targetGuestCount: safeGuests,
        date: safeDate,
        themePreference: input.themePreference?.trim() || activeEvent.themePreference,
        preferences: {
          ...activeEvent.preferences,
          indoorOutdoor: input.venueType || activeEvent.preferences.indoorOutdoor,
        },
        dietaryRequirements: input.dietaryRequirements || activeEvent.dietaryRequirements,
        accessibilityRequirements: input.accessibilityRequirements || activeEvent.accessibilityRequirements,
        syncState: nextSyncState,
        syncSummary: result.summary,
        updatedAt: new Date().toISOString(),
      }

      // 2. Update budget items based on simulated proposed allocations (preserving confirmed decisions)
      const updatedBudgetItems = budgetItems.map((item) => {
        // Never overwrite confirmed allocations silently
        if (item.costStatus === 'confirmed') return item

        const affected = result.affectedCategories.find((c) => c.category === item.category)
        if (affected && affected.proposedAllocation > 0) {
          return {
            ...item,
            allocatedAmount: affected.proposedAllocation,
            actualAmount: item.costStatus === 'quoted' ? item.actualAmount : affected.proposedAllocation,
          }
        }
        return item
      })

      // 3. Update timeline tasks with shifted deadlines (preserving completed tasks)
      const updatedTasks = timelineTasks.map((task) => {
        if (task.status === 'completed') return task

        const affected = result.affectedTasks.find((t) => t.taskId === task.id)
        if (affected && affected.proposedDeadline) {
          return {
            ...task,
            targetDate: affected.proposedDeadline,
            deadline: affected.proposedDeadline,
            priority: (affected.proposedPriority as TaskPriority) || task.priority,
          }
        }
        return task
      })

      // 4. Update vendor notes with date shift advisories
      const updatedVendors = vendors.map((vendor) => {
        const affected = result.affectedVendors.find((v) => v.vendorId === vendor.id)
        if (affected && affected.uncertaintyFlag) {
          return {
            ...vendor,
            notes: vendor.notes
              ? `${vendor.notes} | [Date Shift Advisory]: ${affected.actionAdvice}`
              : `[Date Shift Advisory]: ${affected.actionAdvice}`,
          }
        }
        return vendor
      })

      // 5. Persist all updated state
      const updatedEvents = events.map((e) => (e.id === activeEvent.id ? updatedEvent : e))
      setEvents(updatedEvents)
      StorageService.saveEvents(updatedEvents)

      setBudgetItems(updatedBudgetItems)
      StorageService.saveBudgetItemsForEvent(activeEvent.id, updatedBudgetItems)

      setTimelineTasks(updatedTasks)
      StorageService.saveTasksForEvent(activeEvent.id, updatedTasks)

      setVendors(updatedVendors)
      StorageService.saveVendorsForEvent(activeEvent.id, updatedVendors)

      // 6. Log audit activity
      const activity: ActivityLogItem = {
        id: `act-${Date.now()}`,
        eventId: activeEvent.id,
        type: 'sync-recalculated',
        title: 'Adaptive Scenario Applied',
        description: `Applied what-if scenario: Budget adjusted to $${safeBudget.toLocaleString()}, guests to ${safeGuests}, date to ${safeDate}. ${result.userConfirmedDecisionsPreserved} confirmed decisions preserved.`,
        timestamp: 'Just now',
      }
      StorageService.addActivity(activity)
      setActivities(StorageService.getActivities())
    },
    [activeEvent, budgetItems, timelineTasks, vendors, events],
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
    aiPlanningSource,
    aiModelName,
    isGeneratingIdeas,
    regenerateIdeasWithAI,
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
    addTimelineTask,
    updateTimelineTask,
    deleteTimelineTask,
    reopenTimelineTask,
    regenerateTimelineTasks,
    addBudgetItem,
    updateBudgetItem,
    deleteBudgetItem,
    applyCostSavingAlternative,
    addVendor,
    updateVendor,
    deleteVendor,
    toggleMilestonePaid,
    applyScenario,
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
