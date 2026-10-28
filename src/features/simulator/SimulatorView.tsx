import React, { useState, useMemo, useEffect } from 'react'
import {
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Users,
  RotateCcw,
  Sparkles,
  Info,
  Check,
  X,
  Lock,
  Utensils,
  Music,
  Lightbulb,
  ShieldCheck,
  ShieldAlert,
  Coins,
} from 'lucide-react'
import { usePlanner } from '@/context/PlannerContext'
import { Card } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ScenarioInput } from '@/types/simulation'
import { AITradeoffExplanationResponse } from '@/types/ai'
import { explainScenarioTradeoffs } from '@/services/ai/aiPlanningService'
import { formatCurrency } from '@/utils/budgetGuardian'
import { simulateScenario } from '@/utils/scenarioEngine'

export const SimulatorView: React.FC = () => {
  const {
    activeEvent,
    budgetItems,
    timelineTasks,
    vendors,
    applyScenario,
  } = usePlanner()

  // Base state from activeEvent
  const [totalBudget, setTotalBudget] = useState<number>(() => activeEvent?.totalBudget || 45000)
  const [guestCount, setGuestCount] = useState<number>(() => activeEvent?.targetGuestCount || 80)
  const [eventDate, setEventDate] = useState<string>(() => activeEvent?.date || '')
  const [themePreference, setThemePreference] = useState<string>(() => activeEvent?.themePreference || '')
  const [venueType, setVenueType] = useState<'indoor' | 'outdoor' | 'hybrid'>(
    () => activeEvent?.preferences?.indoorOutdoor || 'indoor',
  )
  const [categoryAdjustments, setCategoryAdjustments] = useState<Record<string, number>>({})

  // UI Flow State
  const [isConfirmApplyOpen, setIsConfirmApplyOpen] = useState(false)
  const [appliedNotice, setAppliedNotice] = useState<string | null>(null)
  const [aiTradeoff, setAiTradeoff] = useState<AITradeoffExplanationResponse | null>(null)
  const [isLoadingAiTradeoff, setIsLoadingAiTradeoff] = useState(false)

  useEffect(() => {
    if (!isConfirmApplyOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsConfirmApplyOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isConfirmApplyOpen])

  // Construct ScenarioInput
  const scenarioInput: ScenarioInput = useMemo(
    () => ({
      totalBudget,
      guestCount,
      eventDate,
      themePreference,
      venueType,
      categoryAdjustments,
      dietaryRequirements: activeEvent?.dietaryRequirements,
      accessibilityRequirements: activeEvent?.accessibilityRequirements,
    }),
    [
      totalBudget,
      guestCount,
      eventDate,
      themePreference,
      venueType,
      categoryAdjustments,
      activeEvent,
    ],
  )

  // Run pure simulation engine
  const simulationResult = useMemo(() => {
    if (!activeEvent) return null
    return simulateScenario(activeEvent, budgetItems, timelineTasks, vendors, scenarioInput)
  }, [activeEvent, budgetItems, timelineTasks, vendors, scenarioInput])

  if (!activeEvent || !simulationResult) {
    return (
      <div className="p-8 text-center text-charcoal-600">
        No active celebration found. Select or create an event to simulate what-if scenarios.
      </div>
    )
  }

  const currency = activeEvent.currency || 'USD'
  const { comparison } = simulationResult
  const { deltas } = comparison

  // Check if scenario has diverged from baseline
  const isDirty =
    totalBudget !== activeEvent.totalBudget ||
    guestCount !== activeEvent.targetGuestCount ||
    eventDate !== activeEvent.date ||
    themePreference !== (activeEvent.themePreference || '') ||
    venueType !== activeEvent.preferences.indoorOutdoor ||
    Object.keys(categoryAdjustments).length > 0

  const handleDiscardScenario = () => {
    setTotalBudget(activeEvent.totalBudget)
    setGuestCount(activeEvent.targetGuestCount)
    setEventDate(activeEvent.date)
    setThemePreference(activeEvent.themePreference || '')
    setVenueType(activeEvent.preferences.indoorOutdoor)
    setCategoryAdjustments({})
    setAiTradeoff(null)
    setAppliedNotice('Scenario discarded. Baseline plan restored.')
    setTimeout(() => setAppliedNotice(null), 3000)
  }

  const handleFetchAiTradeoff = async () => {
    if (!activeEvent || !simulationResult) return
    setIsLoadingAiTradeoff(true)
    try {
      const res = await explainScenarioTradeoffs({
        eventId: activeEvent.id,
        baseline: {
          category: activeEvent.category,
          totalBudget: activeEvent.totalBudget,
          guestCount: activeEvent.targetGuestCount,
        },
        proposed: {
          totalBudget,
          guestCount,
          dateDeltaDays: deltas.daysDelta,
          venueType,
        },
        deltas: {
          budgetDelta: deltas.budgetDelta,
          perGuestDelta: deltas.perGuestCostDelta,
          contingencyDelta: deltas.contingencyDelta,
        },
        affectedCategories: simulationResult.affectedCategories.map((c) => c.categoryName),
      })
      setAiTradeoff(res)
    } finally {
      setIsLoadingAiTradeoff(false)
    }
  }

  const handleExecuteApply = () => {
    applyScenario(scenarioInput, simulationResult)
    setIsConfirmApplyOpen(false)
    setAppliedNotice(
      `Scenario applied successfully! Plan synchronized: Budget ${formatCurrency(totalBudget, currency)}, ${guestCount} guests, Date: ${eventDate}.`,
    )
    setTimeout(() => setAppliedNotice(null), 4000)
  }

  // Preset Scenario Handlers
  const handleApplyPreset = (
    preset: 'cut-15' | 'surge-30' | 'compress-date' | 'expand-budget' | 'demo-bengali-180-240',
  ) => {
    switch (preset) {
      case 'cut-15':
        setTotalBudget(Math.round(activeEvent.totalBudget * 0.85))
        break
      case 'surge-30':
        setGuestCount(Math.round(activeEvent.targetGuestCount + 30))
        break
      case 'compress-date': {
        const d = new Date(activeEvent.date)
        d.setDate(d.getDate() - 21) // 3 weeks earlier
        setEventDate(d.toISOString().split('T')[0])
        break
      }
      case 'expand-budget':
        setTotalBudget(Math.round(activeEvent.totalBudget * 1.2))
        break
      case 'demo-bengali-180-240':
        setTotalBudget(240000)
        setGuestCount(180)
        break
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* 1. Header with USP */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ivory-300">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <Badge variant="terracotta" size="sm">
              Adaptive Planning Engine
            </Badge>
            <span className="text-xs font-semibold text-gold-700 bg-gold-100/70 px-2.5 py-0.5 rounded-full">
              WHAT-IF &rarr; RECALCULATE &rarr; REPLAN
            </span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal-900 tracking-tight">
            Adaptive What-If Scenario Simulator
          </h2>
          <p className="text-xs sm:text-sm text-charcoal-600 mt-1 max-w-3xl">
            Plans change. Budgets shift. Deadlines shrink. Stress-test unexpected pivots safely in a
            sandbox without altering verified vendor contracts or confirmed tasks.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleDiscardScenario}
            disabled={!isDirty}
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Discard Scenario
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setIsConfirmApplyOpen(true)}
            disabled={!isDirty}
          >
            <Check className="w-4 h-4 mr-1" />
            Review &amp; Apply Changes
          </Button>
        </div>
      </div>

      {/* Applied Notice Banner */}
      {appliedNotice && (
        <div className="p-3.5 rounded-xl bg-forest-100 border border-forest-300 text-forest-900 text-xs sm:text-sm flex items-center gap-2 animate-in fade-in shadow-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-forest-700" />
          <span>{appliedNotice}</span>
        </div>
      )}

      {/* 2. Preservation of User Intent & Realistic Constraints Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-3.5 rounded-xl bg-forest-50 border border-forest-200 flex items-start gap-2.5 text-xs text-forest-900">
          <Lock className="w-4 h-4 text-forest-700 shrink-0 mt-0.5" />
          <div>
            <strong>Preserving User Intent:</strong>{' '}
            {simulationResult.userConfirmedDecisionsPreserved} user-confirmed contracts, approved
            allocations, and completed milestones are locked and protected from arbitrary reduction.
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-950">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong>Realistic Constraints:</strong> Celebrio AI flags date shifts and supplier
            capacity limits. We never fabricate vendor availability without direct confirmation.
          </div>
        </div>
      </div>

      {/* 3. Quick Scenario Presets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => handleApplyPreset('cut-15')}
          className="p-3.5 rounded-2xl border text-left transition-all bg-ivory-50/80 border-ivory-300 hover:border-terracotta-400 hover:shadow-subtle"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase text-terracotta-700">Contraction</span>
            <TrendingDown className="w-3.5 h-3.5 text-terracotta-600" />
          </div>
          <div className="font-serif font-bold text-sm text-charcoal-900">-15% Budget Cut</div>
          <p className="text-[11px] text-charcoal-500 mt-0.5">Streamline non-essential vendor fees</p>
        </button>

        <button
          type="button"
          onClick={() => handleApplyPreset('surge-30')}
          className="p-3.5 rounded-2xl border text-left transition-all bg-ivory-50/80 border-ivory-300 hover:border-forest-400 hover:shadow-subtle"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase text-forest-700">Attendance</span>
            <TrendingUp className="w-3.5 h-3.5 text-forest-600" />
          </div>
          <div className="font-serif font-bold text-sm text-charcoal-900">+30 Guest Surge</div>
          <p className="text-[11px] text-charcoal-500 mt-0.5">Extended family &amp; RSVPs surge</p>
        </button>

        <button
          type="button"
          onClick={() => handleApplyPreset('compress-date')}
          className="p-3.5 rounded-2xl border text-left transition-all bg-ivory-50/80 border-ivory-300 hover:border-gold-400 hover:shadow-subtle"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase text-gold-700">Acceleration</span>
            <AlertTriangle className="w-3.5 h-3.5 text-gold-600" />
          </div>
          <div className="font-serif font-bold text-sm text-charcoal-900">-3 Weeks Earlier</div>
          <p className="text-[11px] text-charcoal-500 mt-0.5">Auspicious mahurat date shift</p>
        </button>

        <button
          type="button"
          onClick={() => handleApplyPreset('expand-budget')}
          className="p-3.5 rounded-2xl border text-left transition-all bg-ivory-50/80 border-ivory-300 hover:border-forest-400 hover:shadow-subtle"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase text-forest-700">Investment</span>
            <Coins className="w-3.5 h-3.5 text-forest-600" />
          </div>
          <div className="font-serif font-bold text-sm text-charcoal-900">+20% Luxury Tier</div>
          <p className="text-[11px] text-charcoal-500 mt-0.5">Royal mandap &amp; live sangeet upgrade</p>
        </button>
      </div>

      {/* 4. Interactive Sandbox Controls */}
      <Card variant="default" className="p-5 sm:p-6 space-y-5 border-forest-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-serif font-bold text-base text-charcoal-900 flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-forest-700" />
            <span>Interactive Constraint Controls</span>
          </h3>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => handleApplyPreset('demo-bengali-180-240')}
              className="text-xs font-semibold border-terracotta-300 bg-terracotta-50/80 hover:bg-terracotta-100 text-terracotta-900 shadow-2xs"
            >
              Simulate 180 Guests &amp; {formatCurrency(240000, currency)}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Control 1: Total Budget */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label
                htmlFor="sim-budget-input"
                className="text-xs font-semibold text-charcoal-700 uppercase"
              >
                Total Budget ({currency})
              </label>
              <span className="text-xs font-bold text-forest-800">
                {formatCurrency(totalBudget, currency)}
              </span>
            </div>
            <input
              id="sim-budget-input"
              type="number"
              value={totalBudget}
              onChange={(e) => setTotalBudget(Number(e.target.value))}
              min="1000"
              step="500"
              className="w-full px-3 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-sm font-semibold focus:ring-2 focus:ring-forest-700"
            />
          </div>

          {/* Control 2: Guest Count */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label
                htmlFor="sim-guest-input"
                className="text-xs font-semibold text-charcoal-700 uppercase"
              >
                Target Guest Count
              </label>
              <span className="text-xs font-bold text-forest-800">{guestCount} Guests</span>
            </div>
            <input
              id="sim-guest-input"
              type="number"
              value={guestCount}
              onChange={(e) => setGuestCount(Number(e.target.value))}
              min="1"
              max="1000"
              className="w-full px-3 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-sm font-semibold focus:ring-2 focus:ring-forest-700"
            />
          </div>

          {/* Control 3: Event Date */}
          <div>
            <label
              htmlFor="sim-date-input"
              className="block text-xs font-semibold text-charcoal-700 uppercase mb-1"
            >
              Celebration Target Date
            </label>
            <input
              id="sim-date-input"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-sm focus:ring-2 focus:ring-forest-700"
            />
          </div>

          {/* Control 4: Venue Type */}
          <div>
            <label
              htmlFor="sim-venue-type-select"
              className="block text-xs font-semibold text-charcoal-700 uppercase mb-1"
            >
              Venue Environment
            </label>
            <select
              id="sim-venue-type-select"
              value={venueType}
              onChange={(e) => setVenueType(e.target.value as 'indoor' | 'outdoor' | 'hybrid')}
              className="w-full px-3 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-sm focus:ring-2 focus:ring-forest-700"
            >
              <option value="indoor">Indoor (Weather Protected)</option>
              <option value="outdoor">Outdoor (Requires Rain Plan)</option>
              <option value="hybrid">Hybrid (Indoor + Grounds)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* 5. SIDE-BY-SIDE PLAN COMPARISON */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif font-bold text-lg text-charcoal-900">
            Side-by-Side Impact Analysis
          </h3>
          <span className="text-xs text-charcoal-500">
            Compares Current Plan vs Proposed What-If Scenario
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card A: Original Plan Baseline */}
          <Card variant="default" className="p-5 sm:p-6 space-y-4 bg-ivory-100/50 border-ivory-300">
            <div className="flex items-center justify-between pb-3 border-b border-ivory-300">
              <div>
                <span className="text-[10px] uppercase font-bold text-charcoal-500 tracking-wider">
                  Baseline Plan
                </span>
                <h4 className="font-serif font-bold text-lg text-charcoal-900">
                  Current Committed State
                </h4>
              </div>
              <Badge variant="neutral" size="sm">
                Active Event
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-charcoal-500 block">Total Budget Cap</span>
                <span className="font-serif font-bold text-base text-charcoal-900">
                  {formatCurrency(comparison.original.totalBudget, currency)}
                </span>
              </div>
              <div>
                <span className="text-charcoal-500 block">Per-Guest Cost Ceiling</span>
                <span className="font-serif font-bold text-base text-charcoal-900">
                  {formatCurrency(comparison.original.perGuestCost, currency)} / guest
                </span>
              </div>
              <div>
                <span className="text-charcoal-500 block">Guest Count</span>
                <span className="font-semibold text-charcoal-800">
                  {comparison.original.guestCount} Guests
                </span>
              </div>
              <div>
                <span className="text-charcoal-500 block">Celebration Date</span>
                <span className="font-semibold text-charcoal-800">
                  {comparison.original.eventDate || 'Pending'}
                </span>
              </div>
              <div>
                <span className="text-charcoal-500 block">Contingency Reserve</span>
                <span className="font-semibold text-gold-800">
                  {formatCurrency(comparison.original.contingencyReserve, currency)}
                </span>
              </div>
              <div>
                <span className="text-charcoal-500 block">Remaining Headroom</span>
                <span className="font-semibold text-forest-800">
                  {formatCurrency(comparison.original.remainingBalance, currency)}
                </span>
              </div>
            </div>
          </Card>

          {/* Card B: Proposed What-If Scenario */}
          <Card
            variant="default"
            className={`p-5 sm:p-6 space-y-4 border-2 ${
              simulationResult.hasCriticalWarnings
                ? 'bg-rose-50/30 border-rose-400'
                : 'bg-forest-50/30 border-forest-600 shadow-md'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-ivory-300">
              <div>
                <span className="text-[10px] uppercase font-bold text-forest-800 tracking-wider">
                  What-If Simulation
                </span>
                <h4 className="font-serif font-bold text-lg text-charcoal-900">
                  Proposed Scenario State
                </h4>
              </div>
              <Badge
                variant={simulationResult.hasCriticalWarnings ? 'warning' : 'forest'}
                size="sm"
              >
                {simulationResult.hasCriticalWarnings ? 'Action Required' : 'Feasible & Balanced'}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-charcoal-500 block">Proposed Budget</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-serif font-bold text-base text-charcoal-900">
                    {formatCurrency(comparison.proposed.totalBudget, currency)}
                  </span>
                  {deltas.budgetDelta !== 0 && (
                    <span
                      className={`text-[11px] font-bold ${
                        deltas.budgetDelta < 0 ? 'text-terracotta-600' : 'text-forest-700'
                      }`}
                    >
                      ({deltas.budgetDelta > 0 ? '+' : ''}
                      {formatCurrency(deltas.budgetDelta, currency)})
                    </span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-charcoal-500 block">Per-Guest Cost</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-serif font-bold text-base text-charcoal-900">
                    {formatCurrency(comparison.proposed.perGuestCost, currency)} / guest
                  </span>
                  {deltas.perGuestCostDelta !== 0 && (
                    <span
                      className={`text-[11px] font-bold ${
                        deltas.perGuestCostDelta > 0 ? 'text-amber-700' : 'text-forest-700'
                      }`}
                    >
                      ({deltas.perGuestCostDelta > 0 ? '+' : ''}
                      {formatCurrency(deltas.perGuestCostDelta, currency)})
                    </span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-charcoal-500 block">Simulated Guests</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-semibold text-charcoal-800">
                    {comparison.proposed.guestCount} Guests
                  </span>
                  {deltas.guestCountDelta !== 0 && (
                    <span className="text-[11px] font-bold text-forest-700">
                      ({deltas.guestCountDelta > 0 ? '+' : ''}
                      {deltas.guestCountDelta})
                    </span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-charcoal-500 block">Proposed Target Date</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-semibold text-charcoal-800">
                    {comparison.proposed.eventDate}
                  </span>
                  {deltas.daysDelta !== 0 && (
                    <span
                      className={`text-[11px] font-bold ${
                        deltas.daysDelta < 0 ? 'text-gold-700' : 'text-forest-700'
                      }`}
                    >
                      ({deltas.daysDelta > 0 ? `+${deltas.daysDelta}d` : `${deltas.daysDelta}d`})
                    </span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-charcoal-500 block">Contingency Impact</span>
                <span className="font-semibold text-gold-800">
                  {formatCurrency(comparison.proposed.contingencyReserve, currency)}{' '}
                  {deltas.contingencyDelta !== 0 && (
                    <span className="text-[11px] font-normal text-charcoal-500">
                      ({deltas.contingencyDelta > 0 ? '+' : ''}
                      {formatCurrency(deltas.contingencyDelta, currency)})
                    </span>
                  )}
                </span>
              </div>

              <div>
                <span className="text-charcoal-500 block">Balance / Deficit</span>
                <span
                  className={`font-semibold ${
                    comparison.proposed.remainingBalance < 0
                      ? 'text-rose-700 font-bold'
                      : 'text-forest-800'
                  }`}
                >
                  {formatCurrency(comparison.proposed.remainingBalance, currency)}{' '}
                  {comparison.proposed.remainingBalance < 0 ? '(Deficit)' : '(Headroom)'}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* 6. Critical Warnings & Infeasibility Flags */}
      {simulationResult.infeasibilityReasons.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 space-y-2 text-xs text-rose-900">
          <div className="flex items-center gap-2 font-bold text-sm text-rose-950">
            <ShieldAlert className="w-4 h-4 text-rose-700" />
            <span>Scenario Warnings &amp; Tradeoff Triggers</span>
          </div>
          <ul className="list-disc pl-5 space-y-1">
            {simulationResult.infeasibilityReasons.map((reason, idx) => (
              <li key={idx}>{reason}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 7. Category Allocation Impacts */}
      <Card variant="default" className="p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-ivory-200">
          <div>
            <h4 className="font-serif font-bold text-base text-charcoal-900">
              Category Allocation Impacts
            </h4>
            <p className="text-xs text-charcoal-500">
              Shows how category lines adjust proportionally or exceed allocations.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-ivory-300 text-charcoal-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Baseline</th>
                <th className="py-2.5 px-3">Proposed</th>
                <th className="py-2.5 px-3">Variance</th>
                <th className="py-2.5 px-3">Impact Analysis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ivory-200">
              {simulationResult.affectedCategories.map((cat) => (
                <tr key={cat.category} className="hover:bg-ivory-100/40">
                  <td className="py-2.5 px-3 font-semibold text-charcoal-800">
                    {cat.categoryName}
                  </td>
                  <td className="py-2.5 px-3 text-charcoal-600">
                    {formatCurrency(cat.originalAllocation, currency)}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-charcoal-900">
                    {formatCurrency(cat.proposedAllocation, currency)}
                  </td>
                  <td
                    className={`py-2.5 px-3 font-semibold ${
                      cat.variance > 0
                        ? 'text-amber-700'
                        : cat.variance < 0
                        ? 'text-forest-700'
                        : 'text-charcoal-400'
                    }`}
                  >
                    {cat.variance > 0 ? '+' : ''}
                    {formatCurrency(cat.variance, currency)}
                  </td>
                  <td className="py-2.5 px-3 text-charcoal-600">{cat.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 8. Ripple-Effect Replanning: Tasks & Vendors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Affected Tasks */}
        <Card variant="default" className="p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-ivory-200">
            <h4 className="font-serif font-bold text-sm text-charcoal-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-forest-700" />
              <span>Timeline Milestone Recomputation</span>
            </h4>
            <span className="text-[11px] text-charcoal-500">
              {simulationResult.affectedTasks.length} Milestones
            </span>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {simulationResult.affectedTasks.map((t) => (
              <div
                key={t.taskId}
                className={`p-2.5 rounded-lg border text-xs space-y-1 ${
                  t.isInfeasible
                    ? 'bg-rose-50 border-rose-300 text-rose-950'
                    : t.isNowUrgent
                    ? 'bg-amber-50 border-amber-300 text-amber-950'
                    : 'bg-ivory-50 border-ivory-200 text-charcoal-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold">{t.title}</span>
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-ivory-200">
                    {t.proposedPriority}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-charcoal-500">
                  <span>Orig: {t.originalDeadline}</span>
                  <span>&rarr;</span>
                  <span className="font-semibold text-charcoal-800">
                    New: {t.proposedDeadline}
                  </span>
                </div>
                <p className="text-[11px] text-charcoal-600">{t.reason}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Affected Vendors */}
        <Card variant="default" className="p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-ivory-200">
            <h4 className="font-serif font-bold text-sm text-charcoal-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-forest-700" />
              <span>Vendor Commitments &amp; Constraints</span>
            </h4>
            <span className="text-[11px] text-charcoal-500">
              {simulationResult.affectedVendors.length} Suppliers
            </span>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {simulationResult.affectedVendors.map((v) => (
              <div
                key={v.vendorId}
                className={`p-2.5 rounded-lg border text-xs space-y-1 ${
                  v.uncertaintyFlag
                    ? 'bg-amber-50 border-amber-300 text-amber-950'
                    : 'bg-ivory-50 border-ivory-200 text-charcoal-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-charcoal-900">{v.vendorName}</span>
                  <Badge variant={v.isContractLocked ? 'forest' : 'neutral'} size="sm">
                    {v.contractStatus}
                  </Badge>
                </div>
                <div className="text-[11px] text-charcoal-500">
                  Agreed Cost: {formatCurrency(v.originalCost, currency)}
                </div>
                <p className="text-[11px] text-charcoal-600">{v.actionAdvice}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 9. Recommended Trade-offs */}
      {simulationResult.tradeoffs.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-serif font-bold text-base text-charcoal-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-terracotta-600" />
            <span>Recommended Strategic Trade-Offs</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {simulationResult.tradeoffs.map((to) => (
              <Card key={to.id} variant="default" className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-forest-800 bg-forest-100 px-2 py-0.5 rounded">
                    {to.category}
                  </span>
                  <span className="text-xs font-bold text-forest-700">
                    {to.savingsOrCost > 0
                      ? `Saves ${formatCurrency(to.savingsOrCost, currency)}`
                      : 'Schedule Buffer'}
                  </span>
                </div>
                <h5 className="font-bold text-xs text-charcoal-900">{to.title}</h5>
                <p className="text-xs text-charcoal-600">{to.description}</p>
                <div className="text-[11px] text-charcoal-500 italic pt-1 border-t border-ivory-200">
                  Tradeoff: {to.compromiseSummary}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 9b. AI Scenario Replanning Narrative & Culinary/Entertainment Pivots */}
      <Card variant="default" className="p-5 sm:p-6 space-y-4 bg-ivory-50/90 border-forest-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-ivory-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-serif font-bold text-base text-charcoal-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-forest-700" />
                <span>AI Scenario Advisory &amp; Experience Pivots</span>
              </h4>
              {aiTradeoff && (
                aiTradeoff.source === 'gemini-live' ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Gemini 2.5 Flash
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                    Deterministic Demo Mode
                  </span>
                )
              )}
            </div>
            <p className="text-xs text-charcoal-600">
              Synthesizes custom hospitality pivots, menu adaptations, and sound alternatives for your simulated parameters.
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handleFetchAiTradeoff}
            disabled={isLoadingAiTradeoff}
            leftIcon={
              isLoadingAiTradeoff ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-gold-300" />
              )
            }
          >
            {isLoadingAiTradeoff
              ? 'Synthesizing Pivots...'
              : aiTradeoff
              ? 'Refresh AI Advisory'
              : 'Analyze Scenario with AI'}
          </Button>
        </div>

        {aiTradeoff ? (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Strategic Narrative Summary */}
            <div className="p-3.5 rounded-xl bg-forest-900/5 border border-forest-700/20 text-xs text-charcoal-800 leading-relaxed">
              <strong className="text-forest-900 block font-semibold mb-1">
                Executive Scenario Assessment:
              </strong>
              {aiTradeoff.strategicSummary}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Culinary & Beverage Pivots */}
              <div className="p-3.5 rounded-xl bg-ivory-100/80 border border-ivory-200 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-charcoal-900">
                  <Utensils className="w-3.5 h-3.5 text-forest-700" />
                  <span>Culinary &amp; Beverage Adaptations</span>
                </div>
                <ul className="space-y-1.5 text-charcoal-700 pl-4 list-disc">
                  {aiTradeoff.culinaryRecommendations.map((item, idx) => (
                    <li key={idx} className="leading-relaxed">{item}</li>
                  ))}
                </ul>
              </div>

              {/* Entertainment & Sound Alternatives */}
              <div className="p-3.5 rounded-xl bg-ivory-100/80 border border-ivory-200 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-charcoal-900">
                  <Music className="w-3.5 h-3.5 text-gold-600" />
                  <span>Entertainment &amp; Sound Alternatives</span>
                </div>
                <ul className="space-y-1.5 text-charcoal-700 pl-4 list-disc">
                  {aiTradeoff.entertainmentAlternatives.map((item, idx) => (
                    <li key={idx} className="leading-relaxed">{item}</li>
                  ))}
                </ul>
              </div>

              {/* Smart Budget-Saving Tips */}
              <div className="p-3.5 rounded-xl bg-ivory-100/80 border border-ivory-200 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-charcoal-900">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                  <span>Smart Budget-Saving Opportunities</span>
                </div>
                <ul className="space-y-1.5 text-charcoal-700 pl-4 list-disc">
                  {aiTradeoff.budgetSavingTips.map((item, idx) => (
                    <li key={idx} className="leading-relaxed">{item}</li>
                  ))}
                </ul>
              </div>

              {/* Guest Experience Safeguards */}
              <div className="p-3.5 rounded-xl bg-ivory-100/80 border border-ivory-200 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-charcoal-900">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Guest Experience &amp; Risk Safeguards</span>
                </div>
                <ul className="space-y-1.5 text-charcoal-700 pl-4 list-disc">
                  {aiTradeoff.guestExperienceRiskMitigation.map((item, idx) => (
                    <li key={idx} className="leading-relaxed">{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-4 text-center text-xs text-charcoal-500 bg-ivory-100/40 rounded-xl border border-dashed border-ivory-300">
            Click <strong>&quot;Analyze Scenario with AI&quot;</strong> above to generate tailored culinary adaptations, entertainment compromises, and smart savings based on this specific what-if delta.
          </div>
        )}
      </Card>

      {/* 10. Confirmation Modal for Applying Scenario */}
      {isConfirmApplyOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-charcoal-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <Card
            variant="default"
            className="w-full max-w-lg p-6 bg-ivory-50 max-h-[90vh] overflow-y-auto shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-ivory-300">
              <h3 className="font-serif font-bold text-lg text-charcoal-900">
                Confirm Scenario Application
              </h3>
              <button
                type="button"
                onClick={() => setIsConfirmApplyOpen(false)}
                className="text-xs text-charcoal-500 hover:text-charcoal-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-charcoal-600 leading-relaxed">
              Applying this scenario will synchronize the event budget limit to{' '}
              <strong>{formatCurrency(totalBudget, currency)}</strong>, guest count to{' '}
              <strong>{guestCount}</strong>, and target date to <strong>{eventDate}</strong>.
            </p>

            <div className="p-3 rounded-xl bg-forest-50 border border-forest-200 text-xs text-forest-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                Guaranteed Intent Preservation
              </div>
              <p>
                {simulationResult.userConfirmedDecisionsPreserved} confirmed vendor contracts,
                locked allocations, and completed milestones will NOT be silently deleted or
                reduced.
              </p>
            </div>

            {simulationResult.hasCriticalWarnings && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950">
                <strong>Attention:</strong> This scenario creates a deficit or supplier date
                uncertainty. The event sync indicator will be flagged as &ldquo;Action Required&rdquo;
                until negotiations are complete.
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-ivory-300">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsConfirmApplyOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleExecuteApply}
              >
                Confirm &amp; Apply Changes
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
