import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  X,
  Sparkles,
  Bot,
  AlertTriangle,
  Clock,
  Send,
  HelpCircle,
  Calendar,
  Flower2,
} from 'lucide-react'
import { usePlanner } from '@/context/PlannerContext'
import { Card } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { AICopilotTaskAdviceResponse } from '@/types/ai'
import { explainUrgentTasks } from '@/services/ai/aiPlanningService'
import { formatCurrency } from '@/utils/budgetGuardian'
import { isTaskOverdue, isTaskDueSoon, calculateDaysRemaining } from '@/utils/timelineEngine'

const QUICK_PROMPTS = [
  'Explain the most urgent tasks',
  'How do we manage our budget constraint & contingency?',
  'Bengali tradition checklist & ceremony coordination',
  'What should we prioritize before sending invitations?',
]

export const AICopilotModal: React.FC = () => {
  const {
    activeEvent,
    timelineTasks,
    budgetItems,
    isCopilotOpen,
    setIsCopilotOpen,
    copilotInitialQuery,
    setCurrentSection,
  } = usePlanner()

  const [query, setQuery] = useState(() => copilotInitialQuery || 'Explain the most urgent tasks')
  const [advice, setAdvice] = useState<AICopilotTaskAdviceResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorNotice, setErrorNotice] = useState<string | null>(null)

  // Keyboard Escape listener
  useEffect(() => {
    if (!isCopilotOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCopilotOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isCopilotOpen, setIsCopilotOpen])

  // Compute urgent and critical tasks from active event
  const urgentTasksList = useMemo(() => {
    return timelineTasks.filter((t) => isTaskOverdue(t) || isTaskDueSoon(t) || t.isCriticalPath)
  }, [timelineTasks])

  const currency = activeEvent?.currency || 'INR'
  const daysRem = activeEvent?.date ? calculateDaysRemaining(activeEvent.date) : null

  const handleFetchAdvice = useCallback(
    async (userQuery?: string) => {
      if (!activeEvent) return
      setIsLoading(true)
      setErrorNotice(null)

      try {
        const payload = {
          eventId: activeEvent.id,
          eventTitle: activeEvent.title,
          category: activeEvent.category,
          city: activeEvent.location?.city,
          eventDate: activeEvent.date,
          targetGuestCount: activeEvent.targetGuestCount,
          totalBudget: activeEvent.totalBudget,
          currency: activeEvent.currency,
          traditions: activeEvent.culturalPreferences?.selectedCeremonies && activeEvent.culturalPreferences.selectedCeremonies.length > 0
            ? activeEvent.culturalPreferences.selectedCeremonies
            : (activeEvent.preferences?.specialNotes
              ? [activeEvent.preferences.specialNotes]
              : [activeEvent.themePreference || 'traditional celebration']),
          urgentTasks: urgentTasksList.map((t) => ({
            id: t.id,
            title: t.title,
            deadline: t.targetDate || t.deadline,
            isCriticalPath: t.isCriticalPath,
            priority: t.priority,
            phase: t.phase,
            status: t.status,
          })),
          budgetItems: budgetItems.map((b) => ({
            category: b.category,
            allocatedAmount: b.allocatedAmount,
            costStatus: b.costStatus,
          })),
          query: userQuery || 'Explain the most urgent tasks and critical preparation milestones.',
        }

        const res = await explainUrgentTasks(payload)
        setAdvice(res)
      } catch {
        setErrorNotice('Unable to fetch live Copilot advice. Deterministic engine fallback ready.')
      } finally {
        setIsLoading(false)
      }
    },
    [activeEvent, budgetItems, urgentTasksList],
  )

  // Auto-fetch when modal opens or initialQuery changes
  useEffect(() => {
    if (!isCopilotOpen || !activeEvent) return
    const timer = setTimeout(() => {
      handleFetchAdvice(copilotInitialQuery || 'Explain the most urgent tasks')
    }, 0)
    return () => clearTimeout(timer)
  }, [isCopilotOpen, copilotInitialQuery, activeEvent, handleFetchAdvice])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    handleFetchAdvice(query.trim())
  }

  const handlePromptClick = (p: string) => {
    setQuery(p)
    handleFetchAdvice(p)
  }

  if (!isCopilotOpen || !activeEvent) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="copilot-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 lg:p-6 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-3xl bg-ivory-50 rounded-3xl border border-ivory-300 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-forest-950 via-forest-900 to-forest-800 text-ivory-100 flex items-start justify-between gap-4 border-b border-forest-700/60 shrink-0">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gold-400 text-forest-950">
                <Bot className="w-3.5 h-3.5" />
                Celebrio AI Copilot
              </span>
              <span className="text-[11px] text-gold-300 font-medium">
                Cultural Intelligence &amp; Critical-Path Engine
              </span>
            </div>
            <h2 id="copilot-title" className="font-serif font-bold text-xl sm:text-2xl text-ivory-50">
              Celebration Advisor &amp; Task Navigator
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-ivory-200/90 pt-0.5">
              <span className="font-semibold text-ivory-50">{activeEvent.title}</span>
              <span>&bull;</span>
              <span>{activeEvent.location.city || 'Kolkata'}</span>
              <span>&bull;</span>
              <span>{activeEvent.targetGuestCount} Guests</span>
              <span>&bull;</span>
              <span>{formatCurrency(activeEvent.totalBudget, currency)}</span>
              {daysRem !== null && (
                <>
                  <span>&bull;</span>
                  <span className="text-gold-300 font-bold">
                    {daysRem > 0 ? `T-${daysRem} Days Away` : 'Today'}
                  </span>
                </>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsCopilotOpen(false)}
            className="p-2 rounded-xl text-ivory-300 hover:text-ivory-50 hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-gold-400"
            aria-label="Close Copilot"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Query & Quick Prompts Bar */}
        <div className="p-4 sm:p-5 border-b border-ivory-300 bg-ivory-100/70 space-y-3 shrink-0">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask AI Copilot about urgent tasks, tradition timing, or budget trade-offs..."
              aria-label="Copilot Query Input"
              className="flex-1 px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-ivory-300 bg-white focus:outline-none focus:ring-2 focus:ring-forest-700 shadow-2xs"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isLoading || !query.trim()}
              leftIcon={<Send className="w-3.5 h-3.5" />}
            >
              Ask
            </Button>
          </form>

          {/* Quick Prompt Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-charcoal-500 shrink-0">
              Suggestions:
            </span>
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handlePromptClick(p)}
                className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white text-forest-900 border border-ivory-300 hover:border-forest-600 hover:bg-forest-50 transition-colors shadow-2xs"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Copilot Response Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-center">
              <LoadingSpinner size="lg" />
              <div className="space-y-1">
                <p className="font-serif font-bold text-charcoal-900 text-sm">
                  Analyzing critical-path milestones &amp; cultural priorities...
                </p>
                <p className="text-xs text-charcoal-500">
                  Cross-referencing timeline deadlines, vendor lead times, and budget reserves.
                </p>
              </div>
            </div>
          )}

          {errorNotice && !isLoading && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>{errorNotice}</span>
            </div>
          )}

          {advice && !isLoading && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Honest Model Source Badge */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-charcoal-500">
                  Copilot Intelligence Report
                </span>
                <Badge
                  variant={advice.source === 'gemini-live' ? 'forest' : 'terracotta'}
                  size="sm"
                >
                  {advice.source === 'gemini-live'
                    ? '✨ Live Gemini 2.5 Flash'
                    : '💡 Celebrio Intelligence (High-Fidelity Demo Mode)'}
                </Badge>
              </div>

              {/* Strategic Summary Headline Card */}
              <Card variant="default" className="p-5 border-forest-300 bg-forest-50/60 space-y-2">
                <h3 className="font-serif font-bold text-base sm:text-lg text-forest-950 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-gold-600 shrink-0" />
                  <span>{advice.headline}</span>
                </h3>
                <p className="text-xs sm:text-sm text-forest-900 leading-relaxed font-sans">
                  {advice.strategicSummary}
                </p>
              </Card>

              {/* Urgent Task Analyses */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif font-bold text-sm text-charcoal-900 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-terracotta-600" />
                    <span>Most Urgent Critical-Path Tasks</span>
                  </h4>
                  <span className="text-[11px] text-charcoal-500">
                    {advice.urgentTaskAnalyses.length} Priority Milestones
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {advice.urgentTaskAnalyses.map((task, idx) => (
                    <Card
                      key={task.taskId || idx}
                      variant="default"
                      className="p-4 space-y-2.5 border-ivory-300 hover:border-gold-400 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-bold text-xs sm:text-sm text-charcoal-900">
                          {idx + 1}. {task.taskTitle}
                        </div>
                        <Badge
                          variant={task.urgencyLevel === 'critical' ? 'danger' : 'warning'}
                          size="sm"
                        >
                          {task.urgencyLevel === 'critical' ? 'Critical Urgency' : 'High Priority'}
                        </Badge>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <p className="text-charcoal-700 leading-relaxed">
                          <strong className="text-charcoal-900">Why it matters now:</strong>{' '}
                          {task.whyItMatters}
                        </p>
                        <p className="text-forest-900 font-medium">
                          <strong>Recommended Action:</strong> {task.recommendedAction}
                        </p>
                        {task.culturalContext && (
                          <div className="p-2 rounded-lg bg-ivory-100 text-charcoal-700 text-[11px] flex items-start gap-1.5 border border-ivory-200">
                            <Flower2 className="w-3.5 h-3.5 text-terracotta-600 shrink-0 mt-0.5" />
                            <span>
                              <strong>Cultural &amp; Tradition Note:</strong> {task.culturalContext}
                            </span>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Tradition Advisories & Budget Guidance Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tradition Advisories */}
                {advice.traditionAdvisories.length > 0 && (
                  <Card variant="default" className="p-4 space-y-2 bg-ivory-100/70 border-ivory-300">
                    <h5 className="font-serif font-bold text-xs text-charcoal-900 flex items-center gap-1.5">
                      <Flower2 className="w-3.5 h-3.5 text-terracotta-600" />
                      <span>Tradition &amp; Ritual Logistics</span>
                    </h5>
                    <ul className="space-y-1.5 text-xs text-charcoal-700">
                      {advice.traditionAdvisories.map((trad, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-gold-700 font-bold">&bull;</span>
                          <span>{trad}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}

                {/* Budget Guardian Guidance */}
                <Card variant="default" className="p-4 space-y-2 bg-amber-50/50 border-amber-200">
                  <h5 className="font-serif font-bold text-xs text-amber-950 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                    <span>Budget Guardian &amp; Contingency</span>
                  </h5>
                  <p className="text-xs text-amber-950 leading-relaxed font-sans">
                    {advice.budgetGuidance}
                  </p>
                </Card>
              </div>

              {/* Suggested Next Steps */}
              {advice.suggestedNextSteps.length > 0 && (
                <div className="p-4 rounded-xl bg-ivory-100 border border-ivory-300 space-y-2 text-xs">
                  <span className="font-bold text-charcoal-900 uppercase tracking-wider text-[11px] block">
                    Immediate 72-Hour Next Steps:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {advice.suggestedNextSteps.map((step, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-lg bg-white border border-ivory-200 text-charcoal-800 font-medium"
                      >
                        <span className="text-forest-700 font-bold block mb-0.5">Step {i + 1}</span>
                        {step}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Clarifying Question */}
              {advice.clarifyingQuestion && (
                <div className="p-3.5 rounded-xl bg-forest-900 text-gold-200 text-xs flex items-center gap-2.5">
                  <HelpCircle className="w-4 h-4 text-gold-400 shrink-0" />
                  <span>
                    <strong>Copilot Question:</strong> {advice.clarifyingQuestion}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="p-4 sm:p-5 border-t border-ivory-300 bg-ivory-100/90 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setIsCopilotOpen(false)
                setCurrentSection('timeline')
              }}
              leftIcon={<Calendar className="w-3.5 h-3.5" />}
            >
              Open Full Timeline
            </Button>

            <Button
              type="button"
              variant="terracotta"
              size="sm"
              onClick={() => {
                setIsCopilotOpen(false)
                setCurrentSection('simulator')
              }}
              leftIcon={<Sparkles className="w-3.5 h-3.5" />}
            >
              What-If Simulator
            </Button>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsCopilotOpen(false)}
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  )
}
