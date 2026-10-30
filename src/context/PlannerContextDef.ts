import { createContext } from 'react'
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
  ScenarioInput,
  ScenarioSimulationResult,
  AIPlanningSource,
} from '@/types'
import { Guest } from '@/types/guest'
import { AIActionProposal, AIRecommendation } from '@/types/ai'

export type EventDetailTab =
  | 'overview'
  | 'ideas'
  | 'budget'
  | 'timeline'
  | 'vendors'
  | 'guest-experience'
  | 'contingency'

export interface PlannerContextType {
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
  guests: Guest[]
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

  // Event CRUD Operations
  addEvent: (input: NewCelebrationInput) => CelebrationEvent
  updateActiveEvent: (updates: Partial<CelebrationEvent>) => void
  deleteEvent: (eventId: string) => void

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

  // Guest Management & Roster
  addGuest: (guest: Omit<Guest, 'id' | 'createdAt' | 'updatedAt'>) => Guest
  updateGuest: (id: string, updates: Partial<Guest>) => void
  deleteGuest: (id: string) => void

  // User Session & Authorization
  currentUserId: string

  // Adaptive Scenario Simulator
  applyScenario: (input: ScenarioInput, result: ScenarioSimulationResult) => void

  // AI Copilot & Recommendation Engine
  recommendations: AIRecommendation[]
  applyAIProposal: (proposal: AIActionProposal) => { success: boolean; message: string }
  isCopilotOpen: boolean
  setIsCopilotOpen: (open: boolean) => void
  copilotInitialQuery: string
  openCopilotWithQuery: (query: string) => void
}

export const PlannerContext = createContext<PlannerContextType | undefined>(undefined)

