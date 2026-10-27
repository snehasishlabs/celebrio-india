import React, { createContext, useContext, useState, useEffect, useMemo } from 'react'
import {
  NavSection,
  CelebrationEvent,
  BudgetItem,
  TimelineTask,
  Vendor,
  PlanSyncAlert,
} from '@/types'
import { StorageService } from '@/services/storage/storageService'
import { SAMPLE_ALERTS } from '@/services/storage/sampleData'

interface PlannerContextType {
  currentSection: NavSection
  setCurrentSection: (section: NavSection) => void
  events: CelebrationEvent[]
  activeEvent: CelebrationEvent | null
  setActiveEventId: (id: string) => void
  budgetItems: BudgetItem[]
  timelineTasks: TimelineTask[]
  vendors: Vendor[]
  alerts: PlanSyncAlert[]
  isMobileNavOpen: boolean
  setIsMobileNavOpen: (open: boolean) => void
  isSyncing: boolean
  triggerManualSync: () => void
  resetWorkspace: () => void
}

const PlannerContext = createContext<PlannerContextType | undefined>(undefined)

export const PlannerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSection, setCurrentSection] = useState<NavSection>('dashboard')
  const [events, setEvents] = useState<CelebrationEvent[]>([])
  const [activeEventId, setActiveEventIdState] = useState<string>('')
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([])
  const [timelineTasks, setTimelineTasks] = useState<TimelineTask[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [alerts, setAlerts] = useState<PlanSyncAlert[]>(SAMPLE_ALERTS)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false)
  const [isSyncing, setIsSyncing] = useState<boolean>(false)

  // Initialize from storage
  useEffect(() => {
    const loadedEvents = StorageService.getEvents()
    setEvents(loadedEvents)

    const activeId = StorageService.getActiveEventId()
    setActiveEventIdState(activeId)

    setBudgetItems(StorageService.getBudgetItems(activeId))
    setTimelineTasks(StorageService.getTasks(activeId))
    setVendors(StorageService.getVendors(activeId))
  }, [])

  // Sync data whenever activeEventId changes
  const setActiveEventId = (id: string) => {
    setActiveEventIdState(id)
    StorageService.setActiveEventId(id)
    setBudgetItems(StorageService.getBudgetItems(id))
    setTimelineTasks(StorageService.getTasks(id))
    setVendors(StorageService.getVendors(id))
  }

  const activeEvent = useMemo(() => {
    return events.find((e) => e.id === activeEventId) || events[0] || null
  }, [events, activeEventId])

  const triggerManualSync = () => {
    setIsSyncing(true)
    setTimeout(() => {
      setIsSyncing(false)
    }, 900)
  }

  const resetWorkspace = () => {
    StorageService.resetAllData()
    const reloaded = StorageService.getEvents()
    setEvents(reloaded)
    const defId = StorageService.getActiveEventId()
    setActiveEventIdState(defId)
    setBudgetItems(StorageService.getBudgetItems(defId))
    setTimelineTasks(StorageService.getTasks(defId))
    setVendors(StorageService.getVendors(defId))
    setAlerts(SAMPLE_ALERTS)
  }

  const value: PlannerContextType = {
    currentSection,
    setCurrentSection,
    events,
    activeEvent,
    setActiveEventId,
    budgetItems,
    timelineTasks,
    vendors,
    alerts,
    isMobileNavOpen,
    setIsMobileNavOpen,
    isSyncing,
    triggerManualSync,
    resetWorkspace,
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
