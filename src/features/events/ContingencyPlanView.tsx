import React from 'react'
import {
  CloudRain,
  UserX,
  Clock,
  Coins,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'
import { usePlanner } from '@/context/PlannerContext'
import { Card } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'

export const ContingencyPlanView: React.FC = () => {
  const { activeEvent, budgetItems, setCurrentSection } = usePlanner()

  if (!activeEvent) return null

  const contingencyItem = budgetItems.find((i) => i.isContingency)
  const contingencyBuffer = contingencyItem ? contingencyItem.allocatedAmount : 5000
  const bufferPercent = ((contingencyBuffer / activeEvent.totalBudget) * 100).toFixed(1)

  const isOutdoor =
    activeEvent.preferences?.indoorOutdoor === 'outdoor' ||
    activeEvent.preferences?.indoorOutdoor === 'hybrid'

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-ivory-300">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="forest" size="sm">
              Adaptive Resilience Protocol
            </Badge>
            <span className="text-xs text-charcoal-500">
              Deterministic Risk Defense Matrix
            </span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal-900 tracking-tight">
            Contingency &amp; Disruption Playbook
          </h2>
          <p className="text-xs sm:text-sm text-charcoal-600 mt-1 max-w-2xl">
            &ldquo;Plans change. Budgets shift. Deadlines shrink. Celebrio keeps everything in sync.&rdquo;
            Every celebration includes verified fallback vectors to ensure zero panic when disruptions occur.
          </p>
        </div>

        <Button
          variant="terracotta"
          size="sm"
          onClick={() => setCurrentSection('simulator')}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Stress-Test in Simulator
        </Button>
      </div>

      {/* Contingency Vitals */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="default" className="p-5">
          <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider block mb-1">
            Protected Financial Buffer
          </span>
          <div className="font-serif text-2xl font-bold text-forest-800">
            ${contingencyBuffer.toLocaleString()}
          </div>
          <p className="text-xs text-charcoal-500 mt-1">
            {bufferPercent}% of total cap reserved
          </p>
        </Card>

        <Card variant="default" className="p-5">
          <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider block mb-1">
            Weather Exposure
          </span>
          <div className="font-serif text-2xl font-bold text-charcoal-900">
            {isOutdoor ? 'Outdoor / Hybrid' : 'Indoor Controlled'}
          </div>
          <p className="text-xs text-charcoal-500 mt-1">
            {isOutdoor ? 'Tented marquee protocol active' : 'Zero precipitation risk'}
          </p>
        </Card>

        <Card variant="default" className="p-5">
          <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider block mb-1">
            Vendor Redundancy
          </span>
          <div className="font-serif text-2xl font-bold text-charcoal-900">
            Tier-1 Ready
          </div>
          <p className="text-xs text-charcoal-500 mt-1">
            Backup caterers &amp; DJs mapped
          </p>
        </Card>

        <Card variant="default" className="p-5">
          <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider block mb-1">
            Overall Resilience
          </span>
          <div className="font-serif text-2xl font-bold text-gold-700">
            98 / 100
          </div>
          <p className="text-xs text-charcoal-500 mt-1">
            Optimal disruption preparedness
          </p>
        </Card>
      </div>

      {/* 4 Deterministic Risk Protocols */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Vector 1: Weather Contingency */}
        <Card variant="default" className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-ivory-300">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-forest-100 text-forest-800 flex items-center justify-center">
                <CloudRain className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-charcoal-900">
                  Weather &amp; Outdoor Exposure Protocol
                </h3>
                <span className="text-xs text-charcoal-500">
                  {isOutdoor ? 'High Priority' : 'Indoor Low Risk'}
                </span>
              </div>
            </div>
            <Badge variant={isOutdoor ? 'warning' : 'forest'} size="sm">
              {isOutdoor ? 'Tenting Hold' : 'Fully Sheltered'}
            </Badge>
          </div>

          <div className="space-y-2 text-xs text-charcoal-700 leading-relaxed">
            <div className="p-3 rounded-xl bg-ivory-100/70 border border-ivory-200">
              <strong className="text-charcoal-900 block mb-1">48-Hour Rain Decision Trigger:</strong>
              Clear marquee clear-span tenting hold placed with regional supplier. In case of forecasted
              rain exceeding 40%, crew activates load-in 6 hours early without disrupting floral styling.
            </div>
            <div className="flex items-center gap-2 text-forest-800">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Flooring moisture barrier &amp; outdoor patio heaters pre-reserved.</span>
            </div>
          </div>
        </Card>

        {/* Vector 2: Vendor Default & Cancellation */}
        <Card variant="default" className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-ivory-300">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-terracotta-100 text-terracotta-800 flex items-center justify-center">
                <UserX className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-charcoal-900">
                  Vendor Failure &amp; Replacement Defense
                </h3>
                <span className="text-xs text-charcoal-500">Secondary roster standby</span>
              </div>
            </div>
            <Badge variant="forest" size="sm">
              Protected
            </Badge>
          </div>

          <div className="space-y-2 text-xs text-charcoal-700 leading-relaxed">
            <div className="p-3 rounded-xl bg-ivory-100/70 border border-ivory-200">
              <strong className="text-charcoal-900 block mb-1">Deposit Protection &amp; Backup SLAs:</strong>
              Every secured contract contains reciprocal force-majeure and immediate replacement clauses.
              Two secondary certified catering and media vendors have preliminary calendar holds.
            </div>
            <div className="flex items-center gap-2 text-forest-800">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Zero cancellation penalties if notified outside 21-day window.</span>
            </div>
          </div>
        </Card>

        {/* Vector 3: Schedule Compression & Delays */}
        <Card variant="default" className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-ivory-300">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gold-100 text-gold-900 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-charcoal-900">
                  Schedule Compression &amp; Critical Path
                </h3>
                <span className="text-xs text-charcoal-500">Day-of timing cushion</span>
              </div>
            </div>
            <Badge variant="forest" size="sm">
              90m Buffer
            </Badge>
          </div>

          <div className="space-y-2 text-xs text-charcoal-700 leading-relaxed">
            <div className="p-3 rounded-xl bg-ivory-100/70 border border-ivory-200">
              <strong className="text-charcoal-900 block mb-1">Built-in Phase Dampers:</strong>
              The Run of Show includes 20-minute intentional float periods between ceremony, cocktail
              transition, and dinner call, preventing hair/makeup or photography delays from compressing speeches.
            </div>
            <div className="flex items-center gap-2 text-forest-800">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>A/V soundcheck scheduled 3 hours prior to guest arrival.</span>
            </div>
          </div>
        </Card>

        {/* Vector 4: Budget Guardian & Cost Surge */}
        <Card variant="default" className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-ivory-300">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-forest-900 text-gold-300 flex items-center justify-center">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-charcoal-900">
                  Deterministic Budget Guardian
                </h3>
                <span className="text-xs text-charcoal-500">Autonomous overrun guard</span>
              </div>
            </div>
            <Badge variant="gold" size="sm">
              Guardian Active
            </Badge>
          </div>

          <div className="space-y-2 text-xs text-charcoal-700 leading-relaxed">
            <div className="p-3 rounded-xl bg-ivory-100/70 border border-ivory-200">
              <strong className="text-charcoal-900 block mb-1">Isolated Reserve Ringfence:</strong>
              ${contingencyBuffer.toLocaleString()} is locked away from general allocations. Any line item
              exceeding its target quote by &gt;5% requires explicit confirmation before ledger update.
            </div>
            <div className="flex items-center gap-2 text-forest-800">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>All unexpected delivery fees absorb into buffer without altering guest experience.</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
