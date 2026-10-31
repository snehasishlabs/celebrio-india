/* oxlint-disable react/only-export-components */
/* eslint-disable react-refresh/only-export-components */
import React, { useState, useEffect, useMemo, useCallback } from 'react'
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
import { Guest } from '@/types/guest'
import { StorageService } from '@/services/storage/storageService'
import { SAMPLE_ALERTS } from '@/services/storage/sampleData'
import { verifyEventOwnership, DEFAULT_USER_ID } from '@/utils/security'
import { generateThemeConcepts } from '@/services/ideas/conceptGenerator'
import { generateCelebrationConcepts, fetchServerHealth } from '@/services/ai/aiPlanningService'
import { calculateBudgetSummary, sanitizeAmount, formatCurrency } from '@/utils/budgetGuardian'
import { generatePreparationTasks, addDays } from '@/utils/timelineEngine'
import { generateEventRecommendations } from '@/utils/recommendationEngine'
import { validateAIAction } from '@/utils/aiActionValidator'
import { AIActionProposal } from '@/types/ai'
import {
  syncVendorToBudgetItems,
  generateDefaultPaymentMilestones,
  getVendorCategoryQuestions,
} from '@/utils/vendorEngine'
import { PlannerContext, PlannerContextType, EventDetailTab } from './PlannerContextDef'

export type { EventDetailTab, PlannerContextType }

export const PlannerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSection, setCurrentSection] = useState<NavSection>('dashboard')
  const [activeTab, setActiveTab] = useState<EventDetailTab>('overview')
  const [events, setEvents] = useState<CelebrationEvent[]>(() => StorageService.getEvents())
  const [activeEventId, setActiveEventIdState] = useState<string>(() => StorageService.getActiveEventId())
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>(() => {
    const id = StorageService.getActiveEventId()
    return StorageService.getBudgetItems(id)
  })
  const [timelineTasks, setTimelineTasks] = useState<TimelineTask[]>(() => {
    const id = StorageService.getActiveEventId()
    return StorageService.getTasks(id)
  })
  const [vendors, setVendors] = useState<Vendor[]>(() => {
    const id = StorageService.getActiveEventId()
    return StorageService.getVendors(id)
  })
  const [guests, setGuests] = useState<Guest[]>(() => {
    const id = StorageService.getActiveEventId()
    return StorageService.getGuests(id)
  })
  const [currentUserId] = useState<string>(DEFAULT_USER_ID)
  const [activities, setActivities] = useState<ActivityLogItem[]>(() => StorageService.getActivities())
  const [alertsOverride, setAlertsOverride] = useState<PlanSyncAlert[] | null>(null)

  // Dynamically compute intelligent recommendations and plan sync alerts
  const { recommendations, alerts: dynamicAlerts } = useMemo(() => {
    const currentActiveEvent = events.find((e) => e.id === activeEventId) || null
    if (!currentActiveEvent) {
      return { recommendations: [], alerts: SAMPLE_ALERTS }
    }
    const res = generateEventRecommendations(currentActiveEvent, budgetItems, timelineTasks, vendors)
    return {
      recommendations: res.recommendations,
      alerts: res.alerts.length > 0 ? res.alerts : SAMPLE_ALERTS,
    }
  }, [events, activeEventId, budgetItems, timelineTasks, vendors])

  const alerts = alertsOverride || dynamicAlerts
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false)
  const [isCreateEventOpen, setIsCreateEventOpen] = useState<boolean>(false)
  const [isSyncing, setIsSyncing] = useState<boolean>(false)
  const [customConcepts, setCustomConcepts] = useState<Record<string, ThemeConcept[]>>({})
  const [aiPlanningSource, setAiPlanningSource] = useState<AIPlanningSource>('deterministic-demo')
  const [aiModelName, setAiModelName] = useState<string>('demo-rule-engine')
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState<boolean>(false)
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false)
  const [copilotInitialQuery, setCopilotInitialQuery] = useState<string>('')

  const openCopilotWithQuery = useCallback((query: string) => {
    setCopilotInitialQuery(query)
    setIsCopilotOpen(true)
  }, [])

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

  // Switch active event
  const setActiveEventId = useCallback((id: string) => {
    setActiveEventIdState(id)
    StorageService.setActiveEventId(id)
    setBudgetItems(StorageService.getBudgetItems(id))
    setTimelineTasks(StorageService.getTasks(id))
    setVendors(StorageService.getVendors(id))
    setGuests(StorageService.getGuests(id))
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

  // Guest Management CRUD Operations
  const addGuest = useCallback(
    (input: Omit<Guest, 'id' | 'createdAt' | 'updatedAt'>): Guest => {
      if (!activeEvent) throw new Error('No active event selected')
      if (!verifyEventOwnership(activeEvent, currentUserId)) {
        throw new Error('UNAUTHORIZED: You do not have permission to add guests to this celebration.')
      }

      const now = new Date().toISOString()
      const newGuest: Guest = {
        ...input,
        id: `gst-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        eventId: activeEvent.id,
        name: input.name.trim(),
        category: input.category || 'family',
        rsvpStatus: input.rsvpStatus || 'awaiting',
        plusOnes: Math.max(0, Number(input.plusOnes) || 0),
        invitationSent: Boolean(input.invitationSent),
        createdAt: now,
        updatedAt: now,
      }

      const updated = [...guests, newGuest]
      setGuests(updated)
      StorageService.saveGuestsForEvent(activeEvent.id, updated)

      const activity: ActivityLogItem = {
        id: `act-${Date.now()}`,
        eventId: activeEvent.id,
        type: 'guest-updated',
        title: 'Guest Added to Roster',
        description: `Added "${newGuest.name}" (${newGuest.category}) with RSVP status: ${newGuest.rsvpStatus}.`,
        timestamp: 'Just now',
      }
      StorageService.addActivity(activity)
      setActivities(StorageService.getActivities())

      return newGuest
    },
    [activeEvent, currentUserId, guests],
  )

  const updateGuest = useCallback(
    (id: string, updates: Partial<Guest>) => {
      if (!activeEvent) return
      if (!verifyEventOwnership(activeEvent, currentUserId)) {
        throw new Error('UNAUTHORIZED: You do not have permission to update guests for this celebration.')
      }

      const updated = guests.map((g) =>
        g.id === id ? { ...g, ...updates, updatedAt: new Date().toISOString() } : g,
      )
      setGuests(updated)
      StorageService.saveGuestsForEvent(activeEvent.id, updated)
    },
    [activeEvent, currentUserId, guests],
  )

  const deleteGuest = useCallback(
    (id: string) => {
      if (!activeEvent) return
      if (!verifyEventOwnership(activeEvent, currentUserId)) {
        throw new Error('UNAUTHORIZED: You do not have permission to delete guests from this celebration.')
      }

      const updated = guests.filter((g) => g.id !== id)
      setGuests(updated)
      StorageService.saveGuestsForEvent(activeEvent.id, updated)
    },
    [activeEvent, currentUserId, guests],
  )

  // Add a newly created event with baseline data
  const addEvent = useCallback(
    (input: NewCelebrationInput): CelebrationEvent => {
      const eventId = `ev-${Date.now()}`
      const budget = input.totalBudget

      const newEvent: CelebrationEvent = {
        id: eventId,
        userId: currentUserId,
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
          culturalPreferences: input.culturalPreferences,
        },
        culturalPreferences: input.culturalPreferences,
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

      // Initial structured vendor checklists matching event budget allocations
      const currSym = input.currency === 'INR' ? '₹' : (input.currency === 'USD' ? '$' : input.currency || '₹')
      const initialVendors: Vendor[] = [
        {
          id: `ven-${eventId}-venue`,
          eventId,
          name: input.venueName.trim() || 'Heritage Banquet & Mandap Space Candidate',
          service: 'venue',
          estimatedCost: Math.round(budget * 0.28),
          quotedCost: Math.round(budget * 0.28),
          depositAmount: 0,
          depositPaid: false,
          contractStatus: 'researching',
          comparisonNotes: `Candidate evaluation for ${input.city || 'local'} venue hold. Capacity target: ${input.targetGuestCount} guests.`,
          questionsToAsk: [
            'What is the sound and celebration curfew?',
            'Is open sacred flame (havan/mandap fire) permitted on premises?',
            'Are outside regional culinary caterers and halwais permitted?',
          ],
          contractReminders: 'Premier venue holds typically require 50% deposit upon contract signing.',
          backupOption: { name: 'Secondary heritage courtyard on standby' },
          paymentMilestones: [],
          linkedBudgetItemId: `bgt-${eventId}-venue`,
        },
        {
          id: `ven-${eventId}-catering`,
          eventId,
          name: 'Traditional Feast & Sweet Artisans (Halwai)',
          service: 'catering',
          estimatedCost: Math.round(budget * 0.32),
          quotedCost: Math.round(budget * 0.32),
          depositAmount: 0,
          depositPaid: false,
          contractStatus: 'researching',
          comparisonNotes: `Catering planning for ${input.targetGuestCount} guests (~${currSym}${Math.round((budget * 0.32) / Math.max(1, input.targetGuestCount))}/head).`,
          questionsToAsk: [
            'What is the dedicated server-to-guest ratio for live counters?',
            'Are on-site halwais included for fresh warm dessert service?',
            'When is the non-negotiable guest count lock date?',
          ],
          contractReminders: 'Final headcount lock required 14 days before celebration.',
          backupOption: { name: 'Alternative catering banquet partner' },
          paymentMilestones: [],
          linkedBudgetItemId: `bgt-${eventId}-catering`,
        },
        {
          id: `ven-${eventId}-decor`,
          eventId,
          name: 'Mandap, Tattwa & Ambiance Stylist',
          service: 'florals-decor',
          estimatedCost: Math.round(budget * 0.14),
          quotedCost: Math.round(budget * 0.14),
          depositAmount: 0,
          depositPaid: false,
          contractStatus: 'researching',
          comparisonNotes: 'Architectural floral canopy, stage backdrops, and traditional ceremonial trays.',
          questionsToAsk: [
            'Are brass vessels, hurricane lamps, and arches included in rental costs?',
            'What is the teardown schedule after midnight?',
          ],
          contractReminders: 'Wholesale flower orders locked 14 days prior.',
          paymentMilestones: [],
          linkedBudgetItemId: `bgt-${eventId}-decor`,
        },
        {
          id: `ven-${eventId}-photo`,
          eventId,
          name: 'Cinema & Portrait Documentation Team',
          service: 'photography-video',
          estimatedCost: Math.round(budget * 0.09),
          quotedCost: Math.round(budget * 0.09),
          depositAmount: 0,
          depositPaid: false,
          contractStatus: 'researching',
          comparisonNotes: 'Full-day coverage across morning rituals and evening reception.',
          questionsToAsk: [
            'Will the named lead photographer shoot the main ceremonies?',
            'What is the turnaround window for teaser photos and master gallery?',
          ],
          contractReminders: 'Date reservation retainer is non-refundable upon booking.',
          paymentMilestones: [],
          linkedBudgetItemId: `bgt-${eventId}-media`,
        },
        {
          id: `ven-${eventId}-music`,
          eventId,
          name: 'Traditional Shehnai & Cultural Ensemble',
          service: 'live-music-dj',
          estimatedCost: Math.round(budget * 0.09),
          quotedCost: Math.round(budget * 0.09),
          depositAmount: 0,
          depositPaid: false,
          contractStatus: 'researching',
          comparisonNotes: 'Morning auspicious acoustic shehnai and evening celebration sound.',
          questionsToAsk: [
            'What are electrical circuit and microphone requirements?',
            'Is master of ceremonies (MC) coordination included?',
          ],
          contractReminders: 'Artist booking requires 50% retainer.',
          paymentMilestones: [],
          linkedBudgetItemId: `bgt-${eventId}-entertainment`,
        },
      ]

      // Initial activity log
      const activity: ActivityLogItem = {
        id: `act-${Date.now()}`,
        eventId,
        type: 'event-created',
        title: 'Celebration Plan Initialized',
        description: `Created "${input.title}" with ${currSym}${budget.toLocaleString()} budget and ${input.targetGuestCount} guests.`,
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

      const allVendors = [...StorageService.getVendors(''), ...initialVendors]
      StorageService.saveVendors(allVendors)
      setVendors(initialVendors)

      StorageService.addActivity(activity)
      setActivities(StorageService.getActivities())

      setActiveEventIdState(eventId)
      StorageService.setActiveEventId(eventId)

      return newEvent
    },
    [events, currentUserId],
  )

  const updateActiveEvent = useCallback(
    (updates: Partial<CelebrationEvent>) => {
      if (!activeEvent) return
      if (!verifyEventOwnership(activeEvent, currentUserId)) {
        throw new Error('UNAUTHORIZED: You do not have permission to modify this celebration.')
      }
      const updated = { ...activeEvent, ...updates, updatedAt: new Date().toISOString() }
      const updatedEvents = events.map((e) => (e.id === activeEvent.id ? updated : e))
      setEvents(updatedEvents)
      StorageService.saveEvents(updatedEvents)

      // When event date changes, shift all uncompleted task deadlines automatically
      if (updates.date && updates.date !== activeEvent.date) {
        const oldTime = new Date(activeEvent.date).getTime()
        const newTime = new Date(updates.date).getTime()
        const daysDelta = Math.round((newTime - oldTime) / (1000 * 60 * 60 * 24))
        if (!isNaN(daysDelta) && daysDelta !== 0) {
          const shiftedTasks = timelineTasks.map((task) => {
            if (task.status === 'completed') return task
            const nextTarget = addDays(task.targetDate, daysDelta)
            return {
              ...task,
              targetDate: nextTarget,
              deadline: task.deadline ? addDays(task.deadline, daysDelta) : nextTarget,
            }
          })
          setTimelineTasks(shiftedTasks)
          StorageService.saveTasksForEvent(activeEvent.id, shiftedTasks)
        }
      }
    },
    [activeEvent, currentUserId, events, timelineTasks],
  )

  const deleteEvent = useCallback(
    (eventId: string) => {
      const target = events.find((e) => e.id === eventId)
      if (target && !verifyEventOwnership(target, currentUserId)) {
        throw new Error('UNAUTHORIZED: You do not have permission to delete this celebration.')
      }
      StorageService.deleteEvent(eventId)
      const remainingEvents = StorageService.getEvents()
      setEvents(remainingEvents)
      const nextActiveId = StorageService.getActiveEventId()
      setActiveEventIdState(nextActiveId)
      setBudgetItems(StorageService.getBudgetItems(nextActiveId))
      setTimelineTasks(StorageService.getTasks(nextActiveId))
      setVendors(StorageService.getVendors(nextActiveId))
      setGuests(StorageService.getGuests(nextActiveId))
    },
    [events, currentUserId],
  )

  const applyScenario = useCallback(
    (input: ScenarioInput, result: ScenarioSimulationResult) => {
      if (!activeEvent) return
      if (!verifyEventOwnership(activeEvent, currentUserId)) {
        throw new Error('UNAUTHORIZED: You do not have permission to modify this celebration.')
      }

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
        location: {
          ...activeEvent.location,
          venueName: input.venueName?.trim() || activeEvent.location.venueName,
        },
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
        description: `Applied what-if scenario: Budget adjusted to ${formatCurrency(safeBudget, activeEvent.currency)}, guests to ${safeGuests}, date to ${safeDate}. ${result.userConfirmedDecisionsPreserved} confirmed decisions preserved.`,
        timestamp: 'Just now',
      }
      StorageService.addActivity(activity)
      setActivities(StorageService.getActivities())
    },
    [activeEvent, currentUserId, budgetItems, timelineTasks, vendors, events],
  )

  const applyAIProposal = useCallback(
    (proposal: AIActionProposal): { success: boolean; message: string } => {
      const validation = validateAIAction(proposal, activeEvent)
      if (!validation.isValid) {
        return {
          success: false,
          message: `Action proposal validation failed: ${validation.errors.join('; ')}`,
        }
      }

      const p = (proposal.payload || {}) as Record<string, any>
      const now = new Date().toISOString()

      switch (proposal.actionType) {
        case 'CREATE_EVENT': {
          const created = addEvent({
            title: p.title || 'New Celebration',
            category: p.category || 'wedding',
            date: p.date || addDays(now, 60),
            venueName: p.venueName || 'Heritage Venue',
            city: p.city || 'Kolkata',
            totalBudget: Number(p.totalBudget) || 300000,
            currency: p.currency || 'INR',
            targetGuestCount: Number(p.targetGuestCount) || 150,
            themePreference: p.traditionId ? String(p.traditionId).replace('-', ' ') : 'Traditional celebration',
            priorities: ['Catering & Feast', 'Sacred Ceremonies', 'Guest Hospitality'],
            dietaryRequirements: ['Vegetarian Options'],
            accessibilityRequirements: [],
            indoorOutdoor: 'hybrid',
          })
          setActiveEventIdState(created.id)
          break
        }

        case 'UPDATE_BUDGET': {
          if (!activeEvent) return { success: false, message: 'No active celebration selected.' }
          const newBudget = sanitizeAmount(p.totalBudget ?? p.newBudget)
          if (newBudget > 0) {
            updateActiveEvent({ totalBudget: newBudget })

            // Ensure contingency reserve exists and is updated to 8%
            const targetContingency = Math.round(newBudget * 0.08)
            const existingContingency = budgetItems.find((b) => b.isContingency || b.category === 'contingency')

            if (existingContingency) {
              updateBudgetItem(existingContingency.id, {
                allocatedAmount: targetContingency,
                actualAmount: targetContingency,
              })
            } else {
              addBudgetItem({
                category: 'contingency',
                name: 'Contingency Reserve (8%)',
                allocatedAmount: targetContingency,
                actualAmount: targetContingency,
                estimatedAmount: targetContingency,
                quotedAmount: targetContingency,
                confirmedAmount: targetContingency,
                paidAmount: 0,
                costStatus: 'confirmed',
                paymentStatus: 'planned',
                isContingency: true,
              })
            }
          }
          break
        }

        case 'UPDATE_GUEST_COUNT': {
          if (!activeEvent) return { success: false, message: 'No active celebration selected.' }
          const newGuests = Number(p.newGuestCount ?? p.targetGuestCount ?? p.guestCount)
          if (newGuests > 0) {
            updateActiveEvent({ targetGuestCount: newGuests })
          }
          break
        }

        case 'ADD_TASK': {
          if (!activeEvent) return { success: false, message: 'No active celebration selected.' }
          addTimelineTask({
            title: p.title || 'New Milestone',
            description: p.description || proposal.explanation,
            targetDate: p.targetDate || p.deadline || activeEvent.date,
            deadline: p.targetDate || p.deadline || activeEvent.date,
            status: 'todo',
            priority: p.priority || 'high',
            phase: p.phase || 'logistics-coordination',
            isMilestone: p.isMilestone ?? true,
            isCriticalPath: p.isCriticalPath ?? true,
            dependencyIds: p.dependencyIds || [],
            category: p.category || 'general',
          })
          break
        }

        case 'UPDATE_TIMELINE': {
          if (!activeEvent) return { success: false, message: 'No active celebration selected.' }
          if (p.eventDate) {
            updateActiveEvent({ date: p.eventDate })
          }
          break
        }

        case 'CREATE_WHAT_IF_SCENARIO': {
          setCurrentSection('simulator')
          break
        }

        default:
          return { success: false, message: `Unsupported action type: ${proposal.actionType}` }
      }

      // Record immutable audit activity log
      const auditLog: ActivityLogItem = {
        id: `act-ai-${Date.now()}`,
        eventId: activeEvent?.id || 'global',
        type: 'ai-action-applied',
        title: `AI Action Executed: ${proposal.title}`,
        description: `${proposal.impactSummary} (Approved by user)`,
        timestamp: 'Just now',
      }
      StorageService.addActivity(auditLog)
      setActivities(StorageService.getActivities())

      return {
        success: true,
        message: `Successfully executed: ${proposal.title}`,
      }
    },
    [
      activeEvent,
      addEvent,
      updateActiveEvent,
      budgetItems,
      updateBudgetItem,
      addBudgetItem,
      addTimelineTask,
      setCurrentSection,
    ],
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
    setGuests(StorageService.getGuests(defId))
    setActivities(StorageService.getActivities())
    setAlertsOverride(SAMPLE_ALERTS)
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
    guests,
    addGuest,
    updateGuest,
    deleteGuest,
    currentUserId,
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
    deleteEvent,
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
    recommendations,
    applyAIProposal,
    isCopilotOpen,
    setIsCopilotOpen,
    copilotInitialQuery,
    openCopilotWithQuery,
  }

  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>
}

export { usePlanner } from './usePlanner'
