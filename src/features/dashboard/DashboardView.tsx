import React from 'react'
import {
  Coins,
  Clock,
  Briefcase,
  Sparkles,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  MapPin,
  Users,
} from 'lucide-react'
import { usePlanner } from '@/context/PlannerContext'
import { Card, CardBody } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'

export const DashboardView: React.FC = () => {
  const {
    activeEvent,
    budgetItems,
    timelineTasks,
    vendors,
    alerts,
    setCurrentSection,
  } = usePlanner()

  if (!activeEvent) return null

  // Financial calculations
  const totalAllocated = budgetItems.reduce((acc, item) => acc + item.allocatedAmount, 0)
  const totalPaid = budgetItems.reduce((acc, item) => acc + item.paidAmount, 0)
  const contingencyItem = budgetItems.find((i) => i.isContingency)
  const contingencyFund = contingencyItem ? contingencyItem.allocatedAmount : 0
  const allocationPercent = Math.min(
    100,
    Math.round((totalAllocated / activeEvent.totalBudget) * 100),
  )

  // Timeline calculations
  const completedTasks = timelineTasks.filter((t) => t.status === 'completed').length
  const totalTasks = timelineTasks.length
  const timelinePercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Vendor calculations
  const signedVendors = vendors.filter(
    (v) => v.contractStatus === 'contract-signed' || v.contractStatus === 'deposit-paid',
  ).length

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Editorial Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-ivory-300">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs uppercase tracking-wider font-semibold text-terracotta-600 bg-terracotta-50 px-2 py-0.5 rounded border border-terracotta-200">
              Active Celebration Plan
            </span>
            <Badge variant="gold" size="sm">
              Health Score: 96/100
            </Badge>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal-900 tracking-tight">
            {activeEvent.title}
          </h2>
          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-charcoal-600 mt-2">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-forest-700" />
              {activeEvent.location.venueName}, {activeEvent.location.city}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-forest-700" />
              {activeEvent.confirmedGuestCount} / {activeEvent.targetGuestCount} Guests Confirmed
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="terracotta"
            size="sm"
            onClick={() => setCurrentSection('simulator')}
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            What-If Simulator
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setCurrentSection('budget')}
          >
            Review Budget
          </Button>
        </div>
      </div>

      {/* Vital Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Budget Vital */}
        <Card
          variant="default"
          isInteractive
          onClick={() => setCurrentSection('budget')}
          className="group"
        >
          <CardBody className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
                Total Budget
              </span>
              <div className="w-8 h-8 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center group-hover:bg-forest-100 transition-colors">
                <Coins className="w-4 h-4" />
              </div>
            </div>
            <div className="font-serif text-2xl font-bold text-charcoal-900 mb-1">
              ${activeEvent.totalBudget.toLocaleString()}
            </div>
            <div className="flex items-center justify-between text-xs text-charcoal-500 mb-2">
              <span>{allocationPercent}% Allocated</span>
              <span className="text-forest-700 font-medium">
                ${contingencyFund.toLocaleString()} Buffer
              </span>
            </div>
            <div className="w-full h-1.5 bg-ivory-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-forest-700 rounded-full transition-all duration-500"
                style={{ width: `${allocationPercent}%` }}
              />
            </div>
          </CardBody>
        </Card>

        {/* Timeline Vital */}
        <Card
          variant="default"
          isInteractive
          onClick={() => setCurrentSection('timeline')}
          className="group"
        >
          <CardBody className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
                Milestones & Tasks
              </span>
              <div className="w-8 h-8 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center group-hover:bg-forest-100 transition-colors">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="font-serif text-2xl font-bold text-charcoal-900 mb-1">
              {completedTasks} / {totalTasks}
            </div>
            <div className="flex items-center justify-between text-xs text-charcoal-500 mb-2">
              <span>{timelinePercent}% Completed</span>
              <span className="text-forest-700 font-medium">On Schedule</span>
            </div>
            <div className="w-full h-1.5 bg-ivory-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-forest-700 rounded-full transition-all duration-500"
                style={{ width: `${timelinePercent}%` }}
              />
            </div>
          </CardBody>
        </Card>

        {/* Vendors Vital */}
        <Card
          variant="default"
          isInteractive
          onClick={() => setCurrentSection('vendors')}
          className="group"
        >
          <CardBody className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
                Vendors Secured
              </span>
              <div className="w-8 h-8 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center group-hover:bg-forest-100 transition-colors">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>
            <div className="font-serif text-2xl font-bold text-charcoal-900 mb-1">
              {signedVendors} / {vendors.length}
            </div>
            <div className="flex items-center justify-between text-xs text-charcoal-500 mb-2">
              <span>Deposits Disbursed</span>
              <span className="text-forest-700 font-medium">${totalPaid.toLocaleString()}</span>
            </div>
            <div className="w-full h-1.5 bg-ivory-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-forest-700 rounded-full transition-all duration-500"
                style={{ width: `${(signedVendors / Math.max(1, vendors.length)) * 100}%` }}
              />
            </div>
          </CardBody>
        </Card>

        {/* Adaptive Sync Vital */}
        <Card
          variant="forest-accent"
          isInteractive
          onClick={() => setCurrentSection('simulator')}
          className="group cursor-pointer"
        >
          <CardBody className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gold-300 uppercase tracking-wider">
                Sync Engine
              </span>
              <div className="w-8 h-8 rounded-xl bg-forest-800 text-gold-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="font-serif text-2xl font-bold text-ivory-50 mb-1">
              Zero Drift
            </div>
            <p className="text-xs text-ivory-200 line-clamp-2">
              Budgets, timelines, and vendor deliverables fully reconciled.
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Sync Engine Insights & Action Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts / Proactive Sync Recommendations */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold text-charcoal-900 flex items-center gap-2">
              <span>Proactive Plan Sync Insights</span>
              <span className="text-xs font-sans font-normal px-2 py-0.5 rounded-full bg-forest-100 text-forest-800">
                {alerts.length} Active Notes
              </span>
            </h3>
            <button
              onClick={() => setCurrentSection('simulator')}
              className="text-xs font-semibold text-forest-700 hover:text-forest-900 flex items-center gap-1 group"
            >
              <span>Explore Tradeoffs</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="p-4 sm:p-5 rounded-2xl bg-ivory-50 border border-ivory-300 shadow-subtle flex flex-col sm:flex-row sm:items-start gap-4 transition-all hover:border-forest-300"
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    alert.severity === 'warning'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-forest-100 text-forest-800 border border-forest-200'
                  }`}
                >
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm text-charcoal-900">
                      {alert.title}
                    </h4>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-ivory-200 text-charcoal-600">
                      {alert.source}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-charcoal-600 mb-2 leading-relaxed">
                    {alert.description}
                  </p>
                  <div className="bg-ivory-100/80 rounded-xl p-2.5 border border-ivory-200/80 text-xs">
                    <span className="font-semibold text-forest-800">
                      Suggested Action:{' '}
                    </span>
                    <span className="text-charcoal-700">{alert.suggestedAction}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick What-If Simulation Trigger Card */}
        <div className="space-y-4">
          <h3 className="font-serif text-lg font-bold text-charcoal-900">
            Adaptive Contingency
          </h3>
          <Card variant="default" className="p-5 sm:p-6 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-terracotta-100 text-terracotta-700 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-base text-charcoal-900 mb-1">
                Simulate Scenario Drifts
              </h4>
              <p className="text-xs text-charcoal-600 leading-relaxed mb-4">
                What if your guest count increases by 30? Or vendor fees increase?
                Celebrio calculates ripple effects across budget lines and schedules
                instantly.
              </p>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-ivory-100 border border-ivory-200 flex items-center justify-between">
                <span className="text-charcoal-700 font-medium">15% Budget Cut</span>
                <span className="text-terracotta-600 font-semibold">Ready to test</span>
              </div>
              <div className="p-2.5 rounded-xl bg-ivory-100 border border-ivory-200 flex items-center justify-between">
                <span className="text-charcoal-700 font-medium">Guest Surge (+40)</span>
                <span className="text-terracotta-600 font-semibold">Ready to test</span>
              </div>
              <div className="p-2.5 rounded-xl bg-ivory-100 border border-ivory-200 flex items-center justify-between">
                <span className="text-charcoal-700 font-medium">Compress Timeline</span>
                <span className="text-terracotta-600 font-semibold">Ready to test</span>
              </div>
            </div>
            <Button
              variant="terracotta"
              size="sm"
              onClick={() => setCurrentSection('simulator')}
              className="w-full mt-2"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Launch What-If Engine
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
