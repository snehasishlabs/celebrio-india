export type TimelinePhase =
  | 'concept-planning'
  | 'vendor-curation'
  | 'logistics-coordination'
  | 'rehearsal-prep'
  | 'day-of-execution'
  | 'wrap-up';

export type TaskStatus = 'todo' | 'in-progress' | 'completed' | 'delayed' | 'blocked';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface TimelineTask {
  id: string;
  eventId: string;
  phase: TimelinePhase;
  title: string;
  description?: string;
  targetDate: string; // YYYY-MM-DD
  startTime?: string; // HH:MM
  durationMinutes?: number;
  assignedTo?: string;
  status: TaskStatus;
  priority: TaskPriority;
  isMilestone: boolean;
  isCriticalPath: boolean;
  dependencyIds: string[];
}

export interface ScheduleConflict {
  taskId: string;
  conflictType: 'dependency-violation' | 'deadline-compression' | 'overlap';
  description: string;
  severity: 'low' | 'moderate' | 'critical';
  suggestedResolution?: string;
}

