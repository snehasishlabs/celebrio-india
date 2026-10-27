import React, { useState } from 'react'
import {
  SlidersHorizontal,
  Sparkles,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import { usePlanner } from '@/context/PlannerContext'
import { Card } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { TradeoffRecommendation } from '@/types/simulation'

type ScenarioType = 'budget-cut' | 'guest-surge' | 'timeline-compression' | 'venue-spike'

export const SimulatorView: React.FC = () => {
  const { activeEvent } = usePlanner()
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType>('budget-cut')
  const [budgetCutPercent, setBudgetCutPercent] = useState<number>(15)
  const [extraGuests, setExtraGuests] = useState<number>(30)
  const [compressedDays, setCompressedDays] = useState<number>(14)
  const [appliedNotification, setAppliedNotification] = useState<string | null>(null)

  if (!activeEvent) return null

  const currentTotal = activeEvent.totalBudget

  // Dynamic calculations based on scenario
  let simulatedBudgetVariance = 0
  let simulatedStressScore = 20
  let affectedTaskCount = 2
  let affectedVendorCount = 2
  let recommendations: TradeoffRecommendation[] = []

  if (selectedScenario === 'budget-cut') {
    simulatedBudgetVariance = -Math.round((currentTotal * budgetCutPercent) / 100)
    simulatedStressScore = 65
    affectedTaskCount = 3
    affectedVendorCount = 3
    recommendations = [
      {
        id: 'rec-1',
        category: 'Floral & Decor',
        actionTitle: 'Transition to Architectural Greenery & Candlelight',
        rationale: 'Replace out-of-season cut florals with olive branches and brass urns; preserves editorial atmosphere.',
        costDelta: -Math.round(Math.abs(simulatedBudgetVariance) * 0.45),
        timelineDeltaDays: 0,
        riskLevel: 'low',
        isRecommended: true,
      },
      {
        id: 'rec-2',
        category: 'Entertainment',
        actionTitle: 'Consolidate Music Ensemble Hours',
        rationale: 'Retain 6-piece jazz band for 3 peak hours instead of 5; utilize curated playlist during aperitifs.',
        costDelta: -Math.round(Math.abs(simulatedBudgetVariance) * 0.35),
        timelineDeltaDays: 0,
        riskLevel: 'low',
        isRecommended: true,
      },
      {
        id: 'rec-3',
        category: 'Stationery',
        actionTitle: 'Digital Interactive RSVP Concierge',
        rationale: 'Streamline physical paper suite into letterpress invitation + QR RSVP concierge.',
        costDelta: -Math.round(Math.abs(simulatedBudgetVariance) * 0.2),
        timelineDeltaDays: -4,
        riskLevel: 'low',
        isRecommended: true,
      },
    ]
  } else if (selectedScenario === 'guest-surge') {
    const costPerGuest = 125 // catering + rentals
    simulatedBudgetVariance = extraGuests * costPerGuest
    simulatedStressScore = 78
    affectedTaskCount = 4
    affectedVendorCount = 3
    recommendations = [
      {
        id: 'rec-g1',
        category: 'Catering & Dining',
        actionTitle: 'Deploy Passed Tasting Course Station',
        rationale: 'Switch first course to passed gourmet hors d\'oeuvres to expand capacity without additional table seating rentals.',
        costDelta: -1400,
        timelineDeltaDays: 0,
        riskLevel: 'low',
        isRecommended: true,
      },
      {
        id: 'rec-g2',
        category: 'Rentals & Furniture',
        actionTitle: 'Lock Additional Table Linens 14 Days Ahead',
        rationale: 'Secure second tier delivery now before rush expedite surcharges apply.',
        costDelta: 600,
        timelineDeltaDays: -2,
        riskLevel: 'moderate',
        isRecommended: true,
      },
    ]
  } else if (selectedScenario === 'timeline-compression') {
    simulatedBudgetVariance = 1800 // expedited vendor fees
    simulatedStressScore = 88
    affectedTaskCount = 6
    affectedVendorCount = 4
    recommendations = [
      {
        id: 'rec-t1',
        category: 'Critical Path',
        actionTitle: 'Parallelize Menu Tasting & Rigging Inspection',
        rationale: 'Conduct on-site engineering check and menu tasting concurrently to reclaim 8 days on the schedule.',
        costDelta: 0,
        timelineDeltaDays: -8,
        riskLevel: 'low',
        isRecommended: true,
      },
      {
        id: 'rec-t2',
        category: 'Logistics',
        actionTitle: 'Advance RSVP Closing Date by 10 Days',
        rationale: 'Give catering kitchen adequate lead time without paying overtime prep premiums.',
        costDelta: 0,
        timelineDeltaDays: -10,
        riskLevel: 'low',
        isRecommended: true,
      },
    ]
  } else {
    // venue spike
    simulatedBudgetVariance = 2800
    simulatedStressScore = 55
    affectedTaskCount = 2
    affectedVendorCount = 1
    recommendations = [
      {
        id: 'rec-v1',
        category: 'Contingency Allocation',
        actionTitle: 'Absorb Surge from $5,000 Protected Contingency',
        rationale: 'Protected contingency reserve was specifically budgeted for venue surcharge defense.',
        costDelta: -2800,
        timelineDeltaDays: 0,
        riskLevel: 'low',
        isRecommended: true,
      },
    ]
  }

  const newEstimatedTotal = currentTotal + simulatedBudgetVariance

  const handleApplyTradeoff = (rec: TradeoffRecommendation) => {
    setAppliedNotification(
      `Applied tradeoff: "${rec.actionTitle}". Plan sync updated with savings of $${Math.abs(
        rec.costDelta,
      ).toLocaleString()}.`,
    )
    setTimeout(() => {
      setAppliedNotification(null)
    }, 4000)
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Header with USP */}
      <div className="pb-4 border-b border-ivory-300">
        <div className="flex items-center gap-2 mb-1.5">
          <Badge variant="terracotta" size="sm">
            Core Engine
          </Badge>
          <span className="text-xs font-semibold text-gold-700">
            Real-time Cross-Module Impact Simulation
          </span>
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal-900 tracking-tight">
          Adaptive What-If Simulator
        </h2>
        <p className="text-xs sm:text-sm text-charcoal-600 mt-1 max-w-2xl">
          &ldquo;Plans change. Budgets shift. Deadlines shrink. Celebrio AI keeps your entire
          celebration plan in sync.&rdquo; Stress-test unexpected shifts and preview intelligent
          tradeoffs.
        </p>
      </div>

      {/* Applied Feedback Banner */}
      {appliedNotification && (
        <div className="p-4 rounded-xl bg-forest-100 border border-forest-300 text-forest-900 text-xs sm:text-sm flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-forest-700" />
          <span>{appliedNotification}</span>
        </div>
      )}

      {/* Scenario Presets Selector */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <button
          onClick={() => setSelectedScenario('budget-cut')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            selectedScenario === 'budget-cut'
              ? 'bg-ivory-50 border-terracotta-500 shadow-card ring-1 ring-terracotta-500'
              : 'bg-ivory-50/70 border-ivory-300 hover:border-ivory-400'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold uppercase text-terracotta-600">Shift</span>
            <TrendingDown className="w-4 h-4 text-terracotta-500" />
          </div>
          <h3 className="font-serif font-bold text-sm text-charcoal-900">
            Budget Reduction
          </h3>
          <p className="text-[11px] text-charcoal-500 mt-0.5">
            Test 10% – 25% cost contraction
          </p>
        </button>

        <button
          onClick={() => setSelectedScenario('guest-surge')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            selectedScenario === 'guest-surge'
              ? 'bg-ivory-50 border-terracotta-500 shadow-card ring-1 ring-terracotta-500'
              : 'bg-ivory-50/70 border-ivory-300 hover:border-ivory-400'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold uppercase text-forest-700">Surge</span>
            <TrendingUp className="w-4 h-4 text-forest-600" />
          </div>
          <h3 className="font-serif font-bold text-sm text-charcoal-900">
            Guest Count Surge
          </h3>
          <p className="text-[11px] text-charcoal-500 mt-0.5">
            High RSVP acceptance impact
          </p>
        </button>

        <button
          onClick={() => setSelectedScenario('timeline-compression')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            selectedScenario === 'timeline-compression'
              ? 'bg-ivory-50 border-terracotta-500 shadow-card ring-1 ring-terracotta-500'
              : 'bg-ivory-50/70 border-ivory-300 hover:border-ivory-400'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold uppercase text-gold-700">Compress</span>
            <AlertTriangle className="w-4 h-4 text-gold-600" />
          </div>
          <h3 className="font-serif font-bold text-sm text-charcoal-900">
            Compressed Timeline
          </h3>
          <p className="text-[11px] text-charcoal-500 mt-0.5">
            Date brought forward by weeks
          </p>
        </button>

        <button
          onClick={() => setSelectedScenario('venue-spike')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            selectedScenario === 'venue-spike'
              ? 'bg-ivory-50 border-terracotta-500 shadow-card ring-1 ring-terracotta-500'
              : 'bg-ivory-50/70 border-ivory-300 hover:border-ivory-400'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold uppercase text-charcoal-600">Surprise</span>
            <Sparkles className="w-4 h-4 text-charcoal-600" />
          </div>
          <h3 className="font-serif font-bold text-sm text-charcoal-900">
            Vendor Rate Spike
          </h3>
          <p className="text-[11px] text-charcoal-500 mt-0.5">
            Unexpected fee adjustment
          </p>
        </button>
      </div>

      {/* Simulator Control & Impact Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Card */}
        <Card variant="default" className="p-5 sm:p-6 space-y-5">
          <h3 className="font-serif font-bold text-base text-charcoal-900 flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-forest-700" />
            <span>Scenario Parameters</span>
          </h3>

          {selectedScenario === 'budget-cut' && (
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-charcoal-600">Budget Reduction</span>
                <span className="font-bold text-terracotta-600">{budgetCutPercent}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                step="5"
                value={budgetCutPercent}
                onChange={(e) => setBudgetCutPercent(Number(e.target.value))}
                className="w-full accent-terracotta-500 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-charcoal-400">
                <span>-5% ($3,250)</span>
                <span>-30% ($19,500)</span>
              </div>
            </div>
          )}

          {selectedScenario === 'guest-surge' && (
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-charcoal-600">Additional Guests</span>
                <span className="font-bold text-forest-700">+{extraGuests} Attendees</span>
              </div>
              <input
                type="range"
                min="10"
                max="60"
                step="5"
                value={extraGuests}
                onChange={(e) => setExtraGuests(Number(e.target.value))}
                className="w-full accent-forest-700 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-charcoal-400">
                <span>+10 Guests</span>
                <span>+60 Guests</span>
              </div>
            </div>
          )}

          {selectedScenario === 'timeline-compression' && (
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-charcoal-600">Schedule Compression</span>
                <span className="font-bold text-gold-700">-{compressedDays} Days Early</span>
              </div>
              <input
                type="range"
                min="7"
                max="30"
                step="7"
                value={compressedDays}
                onChange={(e) => setCompressedDays(Number(e.target.value))}
                className="w-full accent-gold-600 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-charcoal-400">
                <span>-1 Week</span>
                <span>-4 Weeks</span>
              </div>
            </div>
          )}

          {selectedScenario === 'venue-spike' && (
            <div className="p-3 rounded-xl bg-ivory-100 text-xs text-charcoal-700">
              Simulating an unpredicted +$2,800 historic venue overtime surcharge.
            </div>
          )}

          <div className="pt-3 border-t border-ivory-200 text-xs text-charcoal-500">
            Calculations executed on client memory; existing committed plan remains untouched until tradeoffs are applied.
          </div>
        </Card>

        {/* Impact Vitals Card */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card variant="default" className="p-5 flex flex-col justify-between">
            <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
              Projected Variance
            </span>
            <div
              className={`font-serif text-2xl font-bold my-2 ${
                simulatedBudgetVariance < 0
                  ? 'text-terracotta-600'
                  : simulatedBudgetVariance > 0
                  ? 'text-amber-700'
                  : 'text-charcoal-900'
              }`}
            >
              {simulatedBudgetVariance >= 0 ? '+' : ''}$
              {simulatedBudgetVariance.toLocaleString()}
            </div>
            <span className="text-xs text-charcoal-500">
              New Total: ${newEstimatedTotal.toLocaleString()}
            </span>
          </Card>

          <Card variant="default" className="p-5 flex flex-col justify-between">
            <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
              Timeline Stress Score
            </span>
            <div className="font-serif text-2xl font-bold my-2 text-charcoal-900 flex items-baseline gap-1">
              <span>{simulatedStressScore}</span>
              <span className="text-xs font-normal text-charcoal-400">/ 100</span>
            </div>
            <span className="text-xs text-charcoal-500">
              {simulatedStressScore > 70 ? 'High schedule compression' : 'Manageable buffer'}
            </span>
          </Card>

          <Card variant="default" className="p-5 flex flex-col justify-between">
            <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
              Ripple Scope
            </span>
            <div className="font-serif text-2xl font-bold my-2 text-forest-800">
              {affectedTaskCount} Tasks · {affectedVendorCount} Vendors
            </div>
            <span className="text-xs text-charcoal-500">
              Directly impacted lines
            </span>
          </Card>
        </div>
      </div>

      {/* AI Adaptive Tradeoff Recommendations */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-lg font-bold text-charcoal-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-terracotta-500" />
            <span>AI Adaptive Tradeoff Solutions</span>
          </h3>
          <span className="text-xs text-charcoal-500">
            Harmonized to keep celebration aesthetic uncompromised
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations.map((rec) => (
            <Card
              key={rec.id}
              variant="default"
              className="p-5 flex flex-col justify-between border-forest-200/80 hover:border-forest-400 transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-forest-100 text-forest-800">
                    {rec.category}
                  </span>
                  <Badge variant={rec.riskLevel === 'low' ? 'forest' : 'warning'} size="sm">
                    {rec.riskLevel} risk
                  </Badge>
                </div>

                <h4 className="font-semibold text-sm text-charcoal-900 mb-1.5">
                  {rec.actionTitle}
                </h4>

                <p className="text-xs text-charcoal-600 leading-relaxed mb-4">
                  {rec.rationale}
                </p>
              </div>

              <div className="pt-3 border-t border-ivory-200/80 flex items-center justify-between gap-2">
                <div className="text-xs">
                  <span className="text-charcoal-400 block text-[10px]">Impact</span>
                  <span className="font-bold text-forest-800">
                    {rec.costDelta <= 0
                      ? `Saves $${Math.abs(rec.costDelta).toLocaleString()}`
                      : `+$${rec.costDelta.toLocaleString()}`}
                  </span>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleApplyTradeoff(rec)}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Apply Tradeoff
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
