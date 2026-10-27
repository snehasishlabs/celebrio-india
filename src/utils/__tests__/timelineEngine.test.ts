import { describe, it, expect } from 'vitest'
import {
  calculateDaysRemaining,
  getPlanningHorizon,
  isTaskOverdue,
  isTaskDueSoon,
  generatePreparationTasks,
  detectScheduleConflicts,
  calculateTimelineStats,
  parseSafeDate,
} from '../timelineEngine'
import { CelebrationEvent } from '@/types/event'
import { TimelineTask } from '@/types/timeline'

describe('Timeline Engine - Deterministic Milestone & Schedule System', () => {
  const refDate = new Date(2026, 9, 27) // Oct 27, 2026

  describe('calculateDaysRemaining & date parsing', () => {
    it('returns positive integer for future event dates', () => {
      expect(calculateDaysRemaining('2026-11-06', refDate)).toBe(10)
      expect(calculateDaysRemaining('2026-11-26', refDate)).toBe(30)
    })

    it('returns 0 for same-day celebration date', () => {
      expect(calculateDaysRemaining('2026-10-27', refDate)).toBe(0)
    })

    it('returns negative integer for past event dates', () => {
      expect(calculateDaysRemaining('2026-10-20', refDate)).toBe(-7)
      expect(calculateDaysRemaining('2026-09-27', refDate)).toBe(-30)
    })

    it('returns null safely for missing, empty, or invalid dates', () => {
      expect(calculateDaysRemaining('', refDate)).toBeNull()
      expect(calculateDaysRemaining(undefined, refDate)).toBeNull()
      expect(calculateDaysRemaining('not-a-date', refDate)).toBeNull()
      expect(calculateDaysRemaining('2026-99-99', refDate)).toBeNull()
    })

    it('safely parses dates at midnight without throwing', () => {
      const parsed = parseSafeDate('2026-12-25')
      expect(parsed).not.toBeNull()
      expect(parsed?.getFullYear()).toBe(2026)
      expect(parsed?.getMonth()).toBe(11) // December
      expect(parsed?.getDate()).toBe(25)
    })
  })

  describe('getPlanningHorizon', () => {
    it('maps remaining days to calibrated planning horizons', () => {
      expect(getPlanningHorizon(5)).toBe('rush-7')
      expect(getPlanningHorizon(14)).toBe('rush-7')
      expect(getPlanningHorizon(30)).toBe('sprint-30')
      expect(getPlanningHorizon(45)).toBe('sprint-30')
      expect(getPlanningHorizon(90)).toBe('standard-90')
      expect(getPlanningHorizon(120)).toBe('standard-90')
      expect(getPlanningHorizon(180)).toBe('runway-180')
      expect(getPlanningHorizon(250)).toBe('runway-180')
      expect(getPlanningHorizon(-5)).toBe('past')
      expect(getPlanningHorizon(null)).toBe('undated')
    })
  })

  describe('isTaskOverdue & isTaskDueSoon', () => {
    const overdueTask: TimelineTask = {
      id: 't-1',
      eventId: 'ev-1',
      phase: 'vendor-curation',
      title: 'Sign Catering Agreement',
      targetDate: '2026-10-20', // past relative to Oct 27
      status: 'todo',
      priority: 'high',
      isMilestone: false,
      isCriticalPath: true,
      dependencyIds: [],
    }

    const dueSoonTask: TimelineTask = {
      id: 't-2',
      eventId: 'ev-1',
      phase: 'logistics-coordination',
      title: 'Finalize RSVP Headcount',
      targetDate: '2026-10-31', // 4 days away
      status: 'todo',
      priority: 'critical',
      isMilestone: true,
      isCriticalPath: true,
      dependencyIds: [],
    }

    const futureTask: TimelineTask = {
      id: 't-3',
      eventId: 'ev-1',
      phase: 'day-of-execution',
      title: 'Event Commencement',
      targetDate: '2026-11-25', // 29 days away
      status: 'todo',
      priority: 'critical',
      isMilestone: true,
      isCriticalPath: true,
      dependencyIds: [],
    }

    it('identifies overdue tasks accurately when uncompleted', () => {
      expect(isTaskOverdue(overdueTask, refDate)).toBe(true)
      expect(isTaskOverdue(dueSoonTask, refDate)).toBe(false)
      expect(isTaskOverdue(futureTask, refDate)).toBe(false)
    })

    it('completed tasks are NEVER flagged as overdue', () => {
      const completedOverdue: TimelineTask = { ...overdueTask, status: 'completed' }
      expect(isTaskOverdue(completedOverdue, refDate)).toBe(false)
    })

    it('identifies tasks due within threshold window', () => {
      expect(isTaskDueSoon(dueSoonTask, 7, refDate)).toBe(true)
      expect(isTaskDueSoon(futureTask, 7, refDate)).toBe(false)
      expect(isTaskDueSoon(overdueTask, 7, refDate)).toBe(false) // already overdue (< 0)
    })
  })

  describe('generatePreparationTasks', () => {
    const baseEvent: CelebrationEvent = {
      id: 'ev-test',
      title: 'Golden Jubilee Gala',
      category: 'anniversary',
      date: '2027-01-25', // ~90 days away
      location: { venueName: 'Orangerie', city: 'London' },
      totalBudget: 45000,
      currency: 'GBP',
      targetGuestCount: 120,
      confirmedGuestCount: 0,
      status: 'planning',
      syncState: 'in-sync',
      priorities: ['Catering', 'Ambiance'],
      dietaryRequirements: [],
      accessibilityRequirements: [],
      preferences: { indoorOutdoor: 'indoor' },
      createdAt: '2026-10-27T00:00:00Z',
      updatedAt: '2026-10-27T00:00:00Z',
    }

    it('generates sequential milestones reverse-engineered from event date', () => {
      const tasks = generatePreparationTasks(baseEvent, refDate)
      expect(tasks.length).toBeGreaterThan(5)

      // Invariant: ALL generated tasks must strictly be 'todo' (never falsely claim completed)
      tasks.forEach((t) => {
        expect(t.status).toBe('todo')
        expect(t.eventId).toBe(baseEvent.id)
      })

      // Final task is scheduled on celebration day
      const lastTask = tasks[tasks.length - 1]
      expect(lastTask.targetDate).toBe('2027-01-25')
      expect(lastTask.phase).toBe('day-of-execution')
    })

    it('adapts specifically for 7-day rush sprint', () => {
      const rushEvent: CelebrationEvent = {
        ...baseEvent,
        date: '2026-11-03', // 7 days away
      }

      const tasks = generatePreparationTasks(rushEvent, refDate)
      expect(tasks.length).toBeGreaterThan(0)
      // Contains emergency load-in and headcount lock
      const titles = tasks.map((t) => t.title)
      expect(titles.some((t) => t.toLowerCase().includes('venue access'))).toBe(true)
      expect(titles.some((t) => t.toLowerCase().includes('headcount'))).toBe(true)
    })

    it('adapts specifically for 180+ day comprehensive runway', () => {
      const runwayEvent: CelebrationEvent = {
        ...baseEvent,
        date: '2027-06-15', // ~230 days away
      }

      const tasks = generatePreparationTasks(runwayEvent, refDate)
      const titles = tasks.map((t) => t.title)
      expect(titles.some((t) => t.toLowerCase().includes('save-the-dates'))).toBe(true)
    })

    it('handles past event by generating retrospective wrap-up tasks', () => {
      const pastEvent: CelebrationEvent = {
        ...baseEvent,
        date: '2026-10-15', // 12 days ago
      }

      const tasks = generatePreparationTasks(pastEvent, refDate)
      const titles = tasks.map((t) => t.title)
      expect(titles.some((t) => t.toLowerCase().includes('reconcile'))).toBe(true)
      expect(titles.some((t) => t.toLowerCase().includes('security deposit'))).toBe(true)
      expect(titles.some((t) => t.toLowerCase().includes('thank you notes'))).toBe(true)
    })

    it('handles missing date gracefully without throwing', () => {
      const undatedEvent: CelebrationEvent = {
        ...baseEvent,
        date: '',
      }

      const tasks = generatePreparationTasks(undatedEvent, refDate)
      expect(tasks.length).toBeGreaterThan(0)
      // Target date is empty string
      expect(tasks[0].targetDate).toBe('')
    })

    it('includes wedding-specific milestones for wedding events', () => {
      const weddingEvent: CelebrationEvent = {
        ...baseEvent,
        category: 'wedding',
        date: '2027-01-25',
      }
      const tasks = generatePreparationTasks(weddingEvent, refDate)
      const titles = tasks.map((t) => t.title)
      expect(titles.some((t) => t.toLowerCase().includes('wedding ceremony rehearsal'))).toBe(true)
    })
  })

  describe('detectScheduleConflicts', () => {
    it('flags dependency violations when prerequisite deadline is later than dependent task', () => {
      const tasks: TimelineTask[] = [
        {
          id: 't-venue',
          eventId: 'ev-1',
          phase: 'concept-planning',
          title: 'Sign Venue Contract',
          targetDate: '2026-11-15', // LATER than tasting
          status: 'todo',
          priority: 'critical',
          isMilestone: true,
          isCriticalPath: true,
          dependencyIds: [],
        },
        {
          id: 't-tasting',
          eventId: 'ev-1',
          phase: 'vendor-curation',
          title: 'Menu Tasting',
          targetDate: '2026-11-10', // EARLIER than venue dependency
          status: 'todo',
          priority: 'high',
          isMilestone: false,
          isCriticalPath: true,
          dependencyIds: ['t-venue'],
        },
      ]

      const conflicts = detectScheduleConflicts(tasks)
      expect(conflicts.length).toBe(1)
      expect(conflicts[0].conflictType).toBe('dependency-violation')
      expect(conflicts[0].description).toMatch(/is due later/i)
    })

    it('flags deadline compression when critical path task is overdue', () => {
      const tasks: TimelineTask[] = [
        {
          id: 't-critical',
          eventId: 'ev-1',
          phase: 'concept-planning',
          title: 'Lock Venue & Deposit',
          targetDate: '2026-10-10', // past
          status: 'todo',
          priority: 'critical',
          isMilestone: true,
          isCriticalPath: true,
          dependencyIds: [],
        },
      ]

      const conflicts = detectScheduleConflicts(tasks)
      expect(conflicts.length).toBe(1)
      expect(conflicts[0].conflictType).toBe('deadline-compression')
    })
  })

  describe('calculateTimelineStats', () => {
    it('computes accurate total, completed, overdue, and dueSoon counts', () => {
      const tasks: TimelineTask[] = [
        {
          id: '1',
          eventId: 'e',
          phase: 'concept-planning',
          title: 'T1',
          targetDate: '2026-10-20', // overdue
          status: 'todo',
          priority: 'critical',
          isMilestone: true,
          isCriticalPath: true,
          dependencyIds: [],
        },
        {
          id: '2',
          eventId: 'e',
          phase: 'concept-planning',
          title: 'T2',
          targetDate: '2026-10-30', // due in 3 days (due soon)
          status: 'todo',
          priority: 'high',
          isMilestone: false,
          isCriticalPath: false,
          dependencyIds: [],
        },
        {
          id: '3',
          eventId: 'e',
          phase: 'day-of-execution',
          title: 'T3',
          targetDate: '2026-11-20',
          status: 'completed',
          priority: 'high',
          isMilestone: true,
          isCriticalPath: true,
          dependencyIds: [],
        },
      ]

      const stats = calculateTimelineStats(tasks, refDate)
      expect(stats.total).toBe(3)
      expect(stats.completed).toBe(1)
      expect(stats.overdue).toBe(1)
      expect(stats.dueSoon).toBe(1)
      expect(stats.criticalPathCount).toBe(2)
      expect(stats.percentComplete).toBe(33)
    })
  })
})

