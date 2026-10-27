import React, { useState } from 'react'
import { CheckCircle2, Circle, Calendar, Flag } from 'lucide-react'
import { usePlanner } from '@/context/PlannerContext'
import { TimelineTask, TaskStatus } from '@/types/timeline'
import { Card } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { StorageService } from '@/services/storage/storageService'

export const TimelineView: React.FC = () => {
  const { activeEvent, timelineTasks } = usePlanner()
  const [tasks, setTasks] = useState<TimelineTask[]>(timelineTasks)

  if (!activeEvent) return null

  const handleToggleStatus = (taskId: string) => {
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        const nextStatus: TaskStatus = t.status === 'completed' ? 'todo' : 'completed'
        return { ...t, status: nextStatus }
      }
      return t
    })
    setTasks(updated)
    StorageService.saveTasks(updated)
  }

  const completedCount = tasks.filter((t) => t.status === 'completed').length

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ivory-300">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="forest" size="sm">
              Critical Path Engine
            </Badge>
            <span className="text-xs text-charcoal-500">
              {completedCount} of {tasks.length} Milestones Achieved
            </span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal-900 tracking-tight">
            Celebration Timeline &amp; Run of Show
          </h2>
        </div>
      </div>

      {/* Timeline Roadmap */}
      <div className="space-y-4">
        {tasks.map((task, index) => {
          const isDone = task.status === 'completed'

          return (
            <Card
              key={task.id}
              variant="default"
              className={`p-5 transition-all ${
                isDone ? 'bg-ivory-50/50 opacity-80' : 'bg-ivory-50'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Toggle button */}
                <button
                  onClick={() => handleToggleStatus(task.id)}
                  className="mt-0.5 text-forest-700 hover:text-forest-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-700 rounded-full"
                  aria-label={`Mark ${task.title} as ${isDone ? 'incomplete' : 'complete'}`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-forest-700 fill-forest-100" />
                  ) : (
                    <Circle className="w-5 h-5 text-charcoal-400 hover:text-forest-700" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-[11px] font-bold text-charcoal-400">
                      Step {index + 1}
                    </span>
                    <h3
                      className={`font-semibold text-base ${
                        isDone
                          ? 'line-through text-charcoal-500'
                          : 'text-charcoal-900'
                      }`}
                    >
                      {task.title}
                    </h3>
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

                  <div className="flex flex-wrap items-center gap-4 text-xs text-charcoal-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-charcoal-400" />
                      Target: {task.targetDate}
                    </span>
                    <span className="capitalize px-2 py-0.5 rounded bg-ivory-200 text-charcoal-700 text-[11px]">
                      Phase: {task.phase.replace('-', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
