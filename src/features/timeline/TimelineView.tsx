import React, { useState, useMemo, useEffect } from 'react'
import {
  CheckCircle2,
  Circle,
  Calendar,
  Flag,
  AlertTriangle,
  Clock,
  Plus,
  RefreshCw,
  User,
  Edit2,
  Trash2,
  AlertCircle,
  Info,
} from 'lucide-react'
import { usePlanner } from '@/context/PlannerContext'
import { TimelineTask, TaskPriority, TimelinePhase } from '@/types/timeline'
import { Card } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import {
  calculateDaysRemaining,
  getPlanningHorizon,
  getPlanningHorizonInfo,
  isTaskOverdue,
  isTaskDueSoon,
  getTaskUrgency,
  detectScheduleConflicts,
  calculateTimelineStats,
} from '@/utils/timelineEngine'

export const TimelineView: React.FC = () => {
  const {
    activeEvent,
    timelineTasks,
    updateTimelineTask,
    updateTaskStatus,
    reopenTimelineTask,
    addTimelineTask,
    deleteTimelineTask,
    regenerateTimelineTasks,
  } = usePlanner()

  const [activeFilter, setActiveFilter] = useState<'all' | 'urgent' | 'critical' | 'completed'>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)

  // Modal Form State
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [phase, setPhase] = useState<TimelinePhase>('concept-planning')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [assignedTo, setAssignedTo] = useState('')
  const [isMilestone, setIsMilestone] = useState(false)
  const [isCriticalPath, setIsCriticalPath] = useState(false)
  const [formError, setFormError] = useState('')

  // Keyboard Escape listener for modal
  useEffect(() => {
    if (!isModalOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsModalOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isModalOpen])

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    switch (activeFilter) {
      case 'urgent':
        return timelineTasks.filter((t) => isTaskOverdue(t) || isTaskDueSoon(t))
      case 'critical':
        return timelineTasks.filter((t) => t.isCriticalPath)
      case 'completed':
        return timelineTasks.filter((t) => t.status === 'completed')
      default:
        return timelineTasks
    }
  }, [timelineTasks, activeFilter])

  if (!activeEvent) {
    return (
      <div className="p-8 text-center text-charcoal-600">
        No active celebration found. Select or create an event to view timeline milestones.
      </div>
    )
  }

  const daysRemaining = calculateDaysRemaining(activeEvent.date)
  const horizon = getPlanningHorizon(daysRemaining)
  const horizonInfo = getPlanningHorizonInfo(horizon)
  const stats = calculateTimelineStats(timelineTasks)
  const conflicts = detectScheduleConflicts(timelineTasks)

  const handleOpenAddModal = () => {
    setEditingTaskId(null)
    setTitle('')
    setDescription('')
    setTargetDate(activeEvent.date || '')
    setPhase('concept-planning')
    setPriority('medium')
    setAssignedTo('')
    setIsMilestone(false)
    setIsCriticalPath(false)
    setFormError('')
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (task: TimelineTask) => {
    setEditingTaskId(task.id)
    setTitle(task.title)
    setDescription(task.description || '')
    setTargetDate(task.targetDate || task.deadline || '')
    setPhase(task.phase)
    setPriority(task.priority)
    setAssignedTo(task.assignedTo || task.owner || '')
    setIsMilestone(task.isMilestone)
    setIsCriticalPath(task.isCriticalPath)
    setFormError('')
    setIsModalOpen(true)
  }

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setFormError('Task title is required.')
      return
    }

    if (editingTaskId) {
      updateTimelineTask(editingTaskId, {
        title: title.trim(),
        description: description.trim(),
        targetDate,
        deadline: targetDate,
        phase,
        priority,
        assignedTo: assignedTo.trim() || undefined,
        owner: assignedTo.trim() || undefined,
        isMilestone,
        isCriticalPath,
      })
    } else {
      addTimelineTask({
        title: title.trim(),
        description: description.trim(),
        targetDate,
        deadline: targetDate,
        phase,
        priority,
        assignedTo: assignedTo.trim() || undefined,
        owner: assignedTo.trim() || undefined,
        status: 'todo',
        isMilestone,
        isCriticalPath,
        dependencyIds: [],
      })
    }

    setIsModalOpen(false)
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* 1. Header & Planning Horizon Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ivory-300">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <Badge variant="forest" size="sm">
              Critical Path Timeline
            </Badge>
            <Badge variant={horizonInfo.badgeColor} size="sm">
              {horizonInfo.label}
            </Badge>
            {daysRemaining !== null && (
              <span className="text-xs font-semibold text-charcoal-700 bg-ivory-200/80 px-2.5 py-0.5 rounded-full">
                {daysRemaining > 0
                  ? `T-${daysRemaining} Days to Celebration`
                  : daysRemaining === 0
                  ? 'Celebration Day!'
                  : `${Math.abs(daysRemaining)} Days Past Event`}
              </span>
            )}
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal-900 tracking-tight">
            Preparation Timeline &amp; Milestone Roadmap
          </h2>
          <p className="text-xs sm:text-sm text-charcoal-600 mt-1 max-w-3xl">
            Reverse-engineered from target date ({activeEvent.date || 'Date Pending'}). All milestones
            are tracked dynamically without claiming fake vendor completion.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={regenerateTimelineTasks}
            title="Recalibrate timeline milestones based on current celebration date"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1 text-forest-700" />
            Recalibrate
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleOpenAddModal}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Milestone
          </Button>
        </div>
      </div>

      {/* 2. Planning Horizon Guidance Alert */}
      <div className="p-4 rounded-xl bg-ivory-50 border border-ivory-300 flex items-start gap-3 text-xs text-charcoal-700 shadow-sm">
        <Info className="w-4 h-4 text-forest-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-charcoal-900 text-sm">
            {horizonInfo.label} Recommendations
          </div>
          <p className="leading-relaxed">{horizonInfo.description}</p>
          <div className="text-forest-800 font-semibold pt-0.5">
            Strategic Action: {horizonInfo.recommendation}
          </div>
        </div>
      </div>

      {/* 3. Schedule Conflicts & Compression Banner (if any) */}
      {conflicts.length > 0 && (
        <div className="space-y-2">
          {conflicts.map((conflict, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 flex items-start gap-3 text-xs text-amber-900"
            >
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold uppercase tracking-wider text-[11px] mb-0.5">
                  Schedule Warning: {conflict.conflictType.replace('-', ' ')}
                </div>
                <p>{conflict.description}</p>
                {conflict.suggestedResolution && (
                  <p className="mt-1 font-semibold text-amber-950">
                    Resolution: {conflict.suggestedResolution}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Timeline Vitals (4 Metric Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="default" className="p-4">
          <span className="text-[11px] font-semibold text-charcoal-500 uppercase tracking-wider block mb-1">
            Total Milestones
          </span>
          <div className="font-serif text-2xl font-bold text-charcoal-900">
            {stats.completed} / {stats.total}
          </div>
          <div className="w-full h-1.5 bg-ivory-200 rounded-full mt-2.5 overflow-hidden">
            <div
              className="h-full bg-forest-700 rounded-full transition-all duration-300"
              style={{ width: `${stats.percentComplete}%` }}
            />
          </div>
          <span className="text-[11px] text-charcoal-500 mt-1 block">
            {stats.percentComplete}% Completed
          </span>
        </Card>

        <Card variant="default" className="p-4">
          <span className="text-[11px] font-semibold text-charcoal-500 uppercase tracking-wider block mb-1">
            Overdue Tasks
          </span>
          <div
            className={`font-serif text-2xl font-bold ${
              stats.overdue > 0 ? 'text-rose-700' : 'text-charcoal-900'
            }`}
          >
            {stats.overdue}
          </div>
          <p className="text-xs text-charcoal-500 mt-1">
            {stats.overdue > 0 ? 'Requires immediate action' : 'All deadlines current'}
          </p>
        </Card>

        <Card variant="default" className="p-4">
          <span className="text-[11px] font-semibold text-charcoal-500 uppercase tracking-wider block mb-1">
            Due Next 7 Days
          </span>
          <div
            className={`font-serif text-2xl font-bold ${
              stats.dueSoon > 0 ? 'text-gold-700' : 'text-charcoal-900'
            }`}
          >
            {stats.dueSoon}
          </div>
          <p className="text-xs text-charcoal-500 mt-1">Upcoming critical path window</p>
        </Card>

        <Card variant="default" className="p-4">
          <span className="text-[11px] font-semibold text-charcoal-500 uppercase tracking-wider block mb-1">
            Critical Path
          </span>
          <div className="font-serif text-2xl font-bold text-forest-800">
            {stats.criticalPathCount}
          </div>
          <p className="text-xs text-charcoal-500 mt-1">Milestones driving date feasibility</p>
        </Card>
      </div>

      {/* 5. Filter Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ivory-200 pb-2">
        <div className="flex items-center gap-1.5" role="tablist">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeFilter === 'all'
                ? 'bg-forest-800 text-ivory-50'
                : 'text-charcoal-600 hover:bg-ivory-200'
            }`}
          >
            All Milestones ({timelineTasks.length})
          </button>
          <button
            onClick={() => setActiveFilter('urgent')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeFilter === 'urgent'
                ? 'bg-forest-800 text-ivory-50'
                : 'text-charcoal-600 hover:bg-ivory-200'
            }`}
          >
            Overdue &amp; Due Soon ({stats.overdue + stats.dueSoon})
          </button>
          <button
            onClick={() => setActiveFilter('critical')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeFilter === 'critical'
                ? 'bg-forest-800 text-ivory-50'
                : 'text-charcoal-600 hover:bg-ivory-200'
            }`}
          >
            Critical Path Only ({stats.criticalPathCount})
          </button>
          <button
            onClick={() => setActiveFilter('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeFilter === 'completed'
                ? 'bg-forest-800 text-ivory-50'
                : 'text-charcoal-600 hover:bg-ivory-200'
            }`}
          >
            Completed ({stats.completed})
          </button>
        </div>
      </div>

      {/* 6. Milestone List / Roadmap Cards */}
      <div className="space-y-3.5">
        {filteredTasks.length === 0 ? (
          <Card variant="default" className="p-8 text-center text-charcoal-600">
            <Clock className="w-8 h-8 text-charcoal-400 mx-auto mb-2" />
            <p className="font-semibold text-sm">No milestones found matching this filter.</p>
            <p className="text-xs text-charcoal-500 mt-1">
              Select &quot;All Milestones&quot; or create a new task to expand the schedule.
            </p>
          </Card>
        ) : (
          filteredTasks.map((task, index) => {
            const isDone = task.status === 'completed'
            const isOver = isTaskOverdue(task)
            const isSoon = isTaskDueSoon(task)
            const urgency = getTaskUrgency(task)

            return (
              <Card
                key={task.id}
                variant="default"
                className={`p-4 sm:p-5 transition-all border ${
                  isDone
                    ? 'bg-ivory-50/60 opacity-85 border-ivory-200'
                    : isOver
                    ? 'bg-rose-50/30 border-rose-200 shadow-sm'
                    : isSoon
                    ? 'bg-gold-50/30 border-gold-300 shadow-sm'
                    : 'bg-ivory-50 border-ivory-300 hover:border-ivory-400'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {/* Status Toggle Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (isDone) {
                        reopenTimelineTask(task.id)
                      } else {
                        updateTaskStatus(task.id, true)
                      }
                    }}
                    className="mt-0.5 text-forest-700 hover:text-forest-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-700 rounded-full shrink-0"
                    aria-label={`Mark ${task.title} as ${isDone ? 'incomplete' : 'complete'}`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-forest-700 fill-forest-100" />
                    ) : (
                      <Circle className="w-5 h-5 text-charcoal-400 hover:text-forest-700" />
                    )}
                  </button>

                  {/* Task Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-[11px] font-bold text-charcoal-400">
                        Step {index + 1}
                      </span>
                      <h3
                        className={`font-semibold text-base ${
                          isDone ? 'line-through text-charcoal-500' : 'text-charcoal-900'
                        }`}
                      >
                        {task.title}
                      </h3>

                      {/* Status & Urgency Badges */}
                      {urgency === 'overdue' && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-rose-700" />
                          Overdue
                        </span>
                      )}
                      {urgency === 'due-soon' && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-700" />
                          Due Soon
                        </span>
                      )}
                      {task.isCriticalPath && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-terracotta-100 text-terracotta-800 border border-terracotta-200">
                          Critical Path
                        </span>
                      )}
                      {task.isMilestone && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-gold-100 text-gold-900 border border-gold-200 flex items-center gap-1">
                          <Flag className="w-2.5 h-2.5" />
                          Milestone
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p className="text-xs sm:text-sm text-charcoal-600 mb-3">
                        {task.description}
                      </p>
                    )}

                    {/* Metadata & Ownership Footer */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-charcoal-500 pt-1">
                      <span className="flex items-center gap-1 font-medium text-charcoal-700">
                        <Calendar className="w-3.5 h-3.5 text-charcoal-400" />
                        Deadline: {task.targetDate || task.deadline || 'Date TBD'}
                      </span>

                      {(task.assignedTo || task.owner) && (
                        <span className="flex items-center gap-1 text-charcoal-600">
                          <User className="w-3.5 h-3.5 text-charcoal-400" />
                          Owner: {task.assignedTo || task.owner}
                        </span>
                      )}

                      <span className="capitalize px-2 py-0.5 rounded bg-ivory-200/90 text-charcoal-700 text-[11px]">
                        Phase: {task.phase.replace('-', ' ')}
                      </span>

                      <span
                        className={`capitalize px-2 py-0.5 rounded text-[11px] font-semibold ${
                          task.priority === 'critical'
                            ? 'bg-rose-100 text-rose-800'
                            : task.priority === 'high'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-ivory-200 text-charcoal-600'
                        }`}
                      >
                        Priority: {task.priority}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(task)}
                      className="p-1.5 text-charcoal-400 hover:text-forest-800 rounded-lg hover:bg-ivory-200 transition-colors"
                      title="Edit milestone details and deadline"
                      aria-label={`Edit ${task.title}`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteTimelineTask(task.id)}
                      className="p-1.5 text-charcoal-400 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Remove milestone"
                      aria-label={`Delete ${task.title}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>

      {/* 7. Add / Edit Milestone Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-charcoal-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <Card
            variant="default"
            className="w-full max-w-lg p-6 bg-ivory-50 max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-ivory-300">
              <h3 className="font-serif font-bold text-lg text-charcoal-900">
                {editingTaskId ? 'Edit Timeline Milestone' : 'Add Preparation Milestone'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-xs text-charcoal-500 hover:text-charcoal-900"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium">
                  {formError}
                </div>
              )}

              <div>
                <label
                  htmlFor="task-title"
                  className="block text-xs font-semibold text-charcoal-700 uppercase mb-1"
                >
                  Milestone Title *
                </label>
                <input
                  id="task-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Catering Menu Tasting & Sommelier Review"
                  className="w-full px-3.5 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-sm focus:outline-none focus:ring-2 focus:ring-forest-700"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="task-description"
                  className="block text-xs font-semibold text-charcoal-700 uppercase mb-1"
                >
                  Description &amp; Action Notes
                </label>
                <textarea
                  id="task-description"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Sample 4-course entrée choices and select wine pairings."
                  className="w-full px-3.5 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-xs focus:outline-none focus:ring-2 focus:ring-forest-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="task-target-date"
                    className="block text-xs font-semibold text-charcoal-700 uppercase mb-1"
                  >
                    Deadline Date
                  </label>
                  <input
                    id="task-target-date"
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-sm focus:outline-none focus:ring-2 focus:ring-forest-700"
                  />
                </div>

                <div>
                  <label
                    htmlFor="task-owner"
                    className="block text-xs font-semibold text-charcoal-700 uppercase mb-1"
                  >
                    Assigned Owner
                  </label>
                  <input
                    id="task-owner"
                    type="text"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    placeholder="e.g. Lead Planner / Host"
                    className="w-full px-3 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-sm focus:outline-none focus:ring-2 focus:ring-forest-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="task-phase"
                    className="block text-xs font-semibold text-charcoal-700 uppercase mb-1"
                  >
                    Planning Phase
                  </label>
                  <select
                    id="task-phase"
                    value={phase}
                    onChange={(e) => setPhase(e.target.value as TimelinePhase)}
                    className="w-full px-3 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-sm focus:outline-none focus:ring-2 focus:ring-forest-700"
                  >
                    <option value="concept-planning">Concept Planning</option>
                    <option value="vendor-curation">Vendor Curation</option>
                    <option value="logistics-coordination">Logistics Coordination</option>
                    <option value="rehearsal-prep">Rehearsal &amp; Prep</option>
                    <option value="day-of-execution">Day-of Execution</option>
                    <option value="wrap-up">Wrap-up &amp; Settlement</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="task-priority"
                    className="block text-xs font-semibold text-charcoal-700 uppercase mb-1"
                  >
                    Urgency Priority
                  </label>
                  <select
                    id="task-priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-sm focus:outline-none focus:ring-2 focus:ring-forest-700"
                  >
                    <option value="low">Low (Flexible)</option>
                    <option value="medium">Medium (Standard)</option>
                    <option value="high">High (Urgent)</option>
                    <option value="critical">Critical (Must Not Slip)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-ivory-200">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="task-is-critical"
                    checked={isCriticalPath}
                    onChange={(e) => setIsCriticalPath(e.target.checked)}
                    className="w-4 h-4 rounded text-forest-700 accent-forest-700"
                  />
                  <label htmlFor="task-is-critical" className="text-xs font-medium text-charcoal-800">
                    Flag as Critical Path (Directly affects celebration date feasibility)
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="task-is-milestone"
                    checked={isMilestone}
                    onChange={(e) => setIsMilestone(e.target.checked)}
                    className="w-4 h-4 rounded text-forest-700 accent-forest-700"
                  />
                  <label htmlFor="task-is-milestone" className="text-xs font-medium text-charcoal-800">
                    Mark as Major Celebration Milestone
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-ivory-300">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  {editingTaskId ? 'Update Milestone' : 'Save Milestone'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
