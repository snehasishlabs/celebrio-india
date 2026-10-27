export type TimelinePhase =
  | 'concept-planning'
  | 'vendor-curation'
  | 'logistics-coordination'
  | 'rehearsal-prep'
  | 'day-of-execution'
  | 'wrap-up';

export type TaskStatus = 'todo' | 'in-progress' | 'completed' | 'delayed' | 'blocked';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export type PlanningHorizon =
  | 'rush-7'
  | 'sprint-30'
  | 'standard-90'
  | 'runway-180'
  | 'past'
  | 'undated';

export interface TimelineTask {
  id: string;
  eventId: string;
  phase: TimelinePhase;
  title: string;
  description?: string;
  targetDate: string; // YYYY-MM-DD
  deadline?: string; // Synonym for targetDate
  startTime?: string; // HH:MM
  durationMinutes?: number;
  assignedTo?: string; // Optional owner
  owner?: string; // Optional owner synonym
  status: TaskStatus;
  priority: TaskPriority;
  isMilestone: boolean;
  isCriticalPath: boolean;
  dependencyIds: string[];
  linkedVendorId?: string;
  linkedBudgetItemId?: string;
  category?: string;
  urgency?: 'overdue' | 'due-soon' | 'upcoming' | 'completed';
}

export interface ScheduleConflict {
  taskId: string;
  conflictType: 'dependency-violation' | 'deadline-compression' | 'overlap';
  description: string;
  severity: 'low' | 'moderate' | 'critical';
  suggestedResolution?: string;
}

