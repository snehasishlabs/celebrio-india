import React from 'react'
import {
  Coins,
  Clock,
  Briefcase,
  Sparkles,
  AlertCircle,
  ArrowRight,
  Calendar,
  Plus,
  Palette,
  ShieldCheck,
  History,
  PartyPopper,
} from 'lucide-react'
import { usePlanner } from '@/context/PlannerContext'
import { Card, CardBody } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { EmptyState } from '@/components/common/EmptyState'

export const DashboardView: React.FC = () => {
  const {
    events,
    activeEvent,
    setActiveEventId,
    budgetItems,
    timelineTasks,
    vendors,
    activities,
    alerts,
    selectedConcept,
    setCurrentSection,
    setActiveTab,
    setIsCreateEventOpen,
  } = usePlanner()

  // Empty State if no events exist
  if (!activeEvent || events.length === 0) {
    return (
      <div className="py-12">
        <EmptyState
          icon={<PartyPopper className="w-6 h-6 text-forest-700" />}
          title="Welcome to Celebrio AI"
          description="You don't have any celebrations planned yet. Create your first wedding, birthday, anniversary, or community event to generate personalized concepts and adaptive budgets."
          actionLabel="Create First Celebration"
          onAction={() => setIsCreateEventOpen(true)}
        />
      </div>
    )
  }

  // Financial calculations
  const totalBudget = activeEvent.totalBudget
  const totalAllocated = budgetItems.reduce((acc, item) => acc + item.allocatedAmount, 0)
  const totalPaid = budgetItems.reduce((acc, item) => acc + item.paidAmount, 0)
  const remainingBudget = totalBudget - totalAllocated
  const contingencyItem = budgetItems.find((i) => i.isContingency)
  const contingencyFund = contingencyItem ? contingencyItem.allocatedAmount : 0
  const allocationPercent = Math.min(
    100,
    Math.round((totalAllocated / totalBudget) * 100),
  )

  // Timeline calculations
  const pendingTasks = timelineTasks.filter((t) => t.status !== 'completed')
  const completedTasks = timelineTasks.filter((t) => t.status === 'completed')
  const totalTasks = timelineTasks.length
  const timelinePercent = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0
  const nextUpcomingTask = pendingTasks[0] || null

  // Vendor calculations
  const signedVendors = vendors.filter(
    (v) => v.contractStatus === 'contract-signed' || v.contractStatus === 'deposit-paid',
  ).length
  const totalVendors = vendors.length
  const vendorPercent = totalVendors > 0 ? Math.round((signedVendors / totalVendors) * 100) : 0

  // Days remaining
  const daysRemaining = Math.max(
    0,
    Math.ceil(
      (new Date(activeEvent.date).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24),
    ),
  )

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* 1. Welcome Heading & Action */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-ivory-300">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs uppercase tracking-wider font-semibold text-forest-800 bg-forest-100 px-2 py-0.5 rounded border border-forest-200 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active Plan Workspace
            </span>
            <Badge variant="gold" size="sm">
              Health Score: 96/100
            </Badge>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal-900 tracking-tight">
            Welcome to Celebrio AI
          </h2>
          <p className="text-xs sm:text-sm text-charcoal-600 mt-1 max-w-2xl">
            Currently orchestrating{' '}
            <strong className="text-charcoal-900 font-semibold">{activeEvent.title}</strong>{' '}
            <span className="text-forest-700 font-medium">({daysRemaining} days away)</span>.{' '}
            All budgets, timelines, and vendor commitments are synchronized in real time.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="terracotta"
            size="sm"
            onClick={() => setCurrentSection('simulator')}
            leftIcon={<Sparkles className="w-4 h-4 text-ivory-50" />}
          >
            What-If Simulator
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateEventOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Event
          </Button>
        </div>
      </div>

      {/* 2. Upcoming Events Portfolio Switcher */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-base font-bold text-charcoal-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-forest-700" />
            <span>Upcoming Celebrations ({events.length})</span>
          </h3>
          <button
            onClick={() => setCurrentSection('events')}
            className="text-xs font-semibold text-forest-700 hover:text-forest-900 flex items-center gap-1"
          >
            <span>Manage All Events</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((ev) => {
            const isSelected = ev.id === activeEvent.id
            const daysAway = Math.max(
              0,
              Math.ceil(
                (new Date(ev.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
              ),
            )

            return (
              <div
                key={ev.id}
                onClick={() => {
                  setActiveEventId(ev.id)
                  setCurrentSection('events')
                  setActiveTab('overview')
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-ivory-50 border-forest-400 ring-2 ring-forest-700/20 shadow-card'
                    : 'bg-ivory-50/70 border-ivory-300 hover:border-ivory-400 hover:bg-ivory-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={isSelected ? 'forest' : 'neutral'} size="sm" className="capitalize">
                    {ev.category.replace('-', ' ')}
                  </Badge>
                  <span className="text-[11px] font-bold text-forest-800">
                    {daysAway} days away
                  </span>
                </div>
                <h4 className="font-serif font-bold text-sm text-charcoal-900 truncate mb-1">
                  {ev.title}
                </h4>
                <div className="flex items-center justify-between text-xs text-charcoal-500">
                  <span>{ev.date}</span>
                  <span className="font-medium text-charcoal-800">
                    ${ev.totalBudget.toLocaleString()}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 3. Vital Metrics: Spending, Remaining, Tasks, Vendors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Metric 1: Total Planned Spending */}
        <Card
          variant="default"
          isInteractive
          onClick={() => {
            setCurrentSection('events')
            setActiveTab('budget')
          }}
          className="group"
        >
          <CardBody className="p-5">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
                Planned Spending
              </span>
              <div className="w-8 h-8 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center group-hover:bg-forest-100 transition-colors">
                <Coins className="w-4 h-4" />
              </div>
            </div>
            <div className="font-serif text-2xl font-bold text-charcoal-900 mb-1">
              ${totalAllocated.toLocaleString()}
            </div>
            <div className="flex items-center justify-between text-xs text-charcoal-500 mb-2">
              <span>{allocationPercent}% of total cap</span>
              <span className="text-forest-700 font-semibold">${totalPaid.toLocaleString()} paid</span>
            </div>
            <div className="w-full h-1.5 bg-ivory-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-forest-700 rounded-full transition-all duration-500"
                style={{ width: `${allocationPercent}%` }}
              />
            </div>
          </CardBody>
        </Card>

        {/* Metric 2: Remaining Budget */}
        <Card
          variant="default"
          isInteractive
          onClick={() => {
            setCurrentSection('events')
            setActiveTab('budget')
          }}
          className="group"
        >
          <CardBody className="p-5">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
                Remaining Budget
              </span>
              <div className="w-8 h-8 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center group-hover:bg-forest-100 transition-colors">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div
              className={`font-serif text-2xl font-bold mb-1 ${
                remainingBudget < 0 ? 'text-terracotta-600' : 'text-forest-800'
              }`}
            >
              ${Math.max(0, remainingBudget).toLocaleString()}
            </div>
            <div className="flex items-center justify-between text-xs text-charcoal-500 mb-2">
              <span>Buffer Protected</span>
              <span className="text-gold-700 font-semibold">
                ${contingencyFund.toLocaleString()} reserve
              </span>
            </div>
            <div className="w-full h-1.5 bg-ivory-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gold-600 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (contingencyFund / totalBudget) * 100)}%`,
                }}
              />
            </div>
          </CardBody>
        </Card>

        {/* Metric 3: Pending Tasks */}
        <Card
          variant="default"
          isInteractive
          onClick={() => {
            setCurrentSection('events')
            setActiveTab('timeline')
          }}
          className="group"
        >
          <CardBody className="p-5">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
                Pending Tasks
              </span>
              <div className="w-8 h-8 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center group-hover:bg-forest-100 transition-colors">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="font-serif text-2xl font-bold text-charcoal-900 mb-1">
              {pendingTasks.length}{' '}
              <span className="text-xs font-normal text-charcoal-500 font-sans">
                ({completedTasks.length} done)
              </span>
            </div>
            <div className="text-xs text-charcoal-500 truncate mb-2">
              Next:{' '}
              <span className="text-forest-800 font-medium">
                {nextUpcomingTask ? nextUpcomingTask.title : 'All milestones up to date'}
              </span>
            </div>
            <div className="w-full h-1.5 bg-ivory-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-forest-700 rounded-full transition-all duration-500"
                style={{ width: `${timelinePercent}%` }}
              />
            </div>
          </CardBody>
        </Card>

        {/* Metric 4: Vendor Booking Progress */}
        <Card
          variant="default"
          isInteractive
          onClick={() => {
            setCurrentSection('events')
            setActiveTab('vendors')
          }}
          className="group"
        >
          <CardBody className="p-5">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
                Vendors Secured
              </span>
              <div className="w-8 h-8 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center group-hover:bg-forest-100 transition-colors">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>
            <div className="font-serif text-2xl font-bold text-charcoal-900 mb-1">
              {signedVendors} / {totalVendors}
            </div>
            <div className="flex items-center justify-between text-xs text-charcoal-500 mb-2">
              <span>Booking Progress</span>
              <span className="text-forest-800 font-semibold">{vendorPercent}% Secured</span>
            </div>
            <div className="w-full h-1.5 bg-ivory-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-forest-700 rounded-full transition-all duration-500"
                style={{ width: `${vendorPercent}%` }}
              />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* 4. Active Theme Concept & Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Theme Preview Card */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold text-charcoal-900 flex items-center gap-2">
              <Palette className="w-4 h-4 text-forest-700" />
              <span>Active Design Concept &amp; Aesthetic</span>
            </h3>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setCurrentSection('events')
                setActiveTab('ideas')
              }}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Explore 3 Concepts
            </Button>
          </div>

          {selectedConcept ? (
            <Card variant="default" className="p-6 space-y-4 border-forest-200/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-ivory-200">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-forest-100 text-forest-800">
                    {selectedConcept.tier.replace('-', ' ')}
                  </span>
                  <h4 className="font-serif font-bold text-xl text-charcoal-900 mt-1">
                    {selectedConcept.title}
                  </h4>
                  <p className="text-xs text-forest-800 italic">
                    &ldquo;{selectedConcept.tagline}&rdquo;
                  </p>
                </div>
                <div className="text-right sm:text-right">
                  <span className="text-xs text-charcoal-500 block">Est. Implication</span>
                  <span className="font-serif font-bold text-base text-forest-900">
                    ${selectedConcept.costEstimation.estimatedTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Swatches */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-charcoal-700 mr-1">Palette:</span>
                {selectedConcept.colorPalette.map((color) => (
                  <div
                    key={color.name}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-ivory-100 border border-ivory-200 text-xs"
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-subtle shrink-0"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span className="text-[11px] font-medium text-charcoal-800">{color.name}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-charcoal-600">
                <div className="p-3 rounded-xl bg-ivory-100/70 border border-ivory-200">
                  <strong className="text-charcoal-900 block mb-0.5">Atmospheric Styling:</strong>
                  {selectedConcept.decor.focalPoint}
                </div>
                <div className="p-3 rounded-xl bg-ivory-100/70 border border-ivory-200">
                  <strong className="text-charcoal-900 block mb-0.5">Culinary Service:</strong>
                  {selectedConcept.foodAndBeverage.serviceStyle}
                </div>
              </div>
            </Card>
          ) : (
            <Card variant="default" className="p-6 text-center">
              <p className="text-xs text-charcoal-500 mb-3">
                No personalized concept selected yet. Review generated themes for this event.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setCurrentSection('events')
                  setActiveTab('ideas')
                }}
              >
                Review Generated Concepts
              </Button>
            </Card>
          )}

          {/* Sync Alerts */}
          <div className="space-y-3 pt-2">
            <h4 className="font-serif font-bold text-sm text-charcoal-900">
              Proactive Plan Sync Warnings
            </h4>
            {alerts.slice(0, 2).map((alert) => (
              <div
                key={alert.id}
                className="p-4 rounded-xl bg-ivory-50 border border-ivory-300 flex items-start gap-3 text-xs"
              >
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-charcoal-900">{alert.title}</div>
                  <p className="text-charcoal-600 mt-0.5">{alert.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Recent Planning Activity Log */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold text-charcoal-900 flex items-center gap-2">
              <History className="w-4 h-4 text-forest-700" />
              <span>Recent Activity</span>
            </h3>
            <span className="text-xs text-charcoal-500">Live Audit Trail</span>
          </div>

          <Card variant="default" className="p-5 space-y-4">
            {activities.length > 0 ? (
              <div className="space-y-3">
                {activities.slice(0, 6).map((act) => (
                  <div
                    key={act.id}
                    className="flex items-start gap-3 pb-3 border-b border-ivory-200/80 last:border-b-0 last:pb-0 text-xs"
                  >
                    <div className="w-2 h-2 rounded-full bg-forest-600 mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-charcoal-900">{act.title}</div>
                      <p className="text-charcoal-600 leading-snug mt-0.5 line-clamp-2">
                        {act.description}
                      </p>
                      <span className="text-[10px] text-charcoal-400 mt-1 block">
                        {act.timestamp}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-charcoal-500">
                No recent activity recorded yet.
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
