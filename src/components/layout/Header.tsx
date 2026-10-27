import React from 'react'
import { Menu, CheckCircle2, RefreshCw, Calendar, Sparkles, Plus } from 'lucide-react'
import { usePlanner } from '@/context/PlannerContext'
import { Button } from '@/components/common/Button'
import { Badge } from '@/components/common/Badge'

export const Header: React.FC = () => {
  const {
    activeEvent,
    isMobileNavOpen,
    setIsMobileNavOpen,
    isSyncing,
    triggerManualSync,
    setCurrentSection,
    setIsCreateEventOpen,
  } = usePlanner()

  // Calculate days remaining
  const daysRemaining = activeEvent?.date
    ? Math.max(
        0,
        Math.ceil(
          (new Date(activeEvent.date).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      )
    : 0

  return (
    <header className="sticky top-0 z-10 bg-ivory-100/90 backdrop-blur-md border-b border-ivory-300 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4 transition-all">
      {/* Left: Mobile Toggle & Active Celebration Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
          className="md:hidden p-2 -ml-2 rounded-xl text-charcoal-700 hover:bg-ivory-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-700"
          aria-label={isMobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isMobileNavOpen}
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-serif font-bold text-base sm:text-lg text-charcoal-900 truncate">
              {activeEvent ? activeEvent.title : 'Celebration Workspace'}
            </h1>
            <Badge variant="forest" size="sm" className="hidden sm:inline-flex capitalize">
              {activeEvent?.category.replace('-', ' ') || 'Event'}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-xs text-charcoal-500 mt-0.5">
            <span className="flex items-center gap-1 truncate">
              <Calendar className="w-3.5 h-3.5 shrink-0 text-charcoal-400" />
              {activeEvent?.date ? (
                <>
                  {activeEvent.date}
                  <span className="text-forest-700 font-semibold ml-1">
                    ({daysRemaining} days away)
                  </span>
                </>
              ) : (
                'No date selected'
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Sync Status & Quick Actions */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Adaptive Sync Pill */}
        <button
          onClick={triggerManualSync}
          disabled={isSyncing}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-700 ${
            isSyncing
              ? 'bg-gold-50 text-gold-800 border-gold-300'
              : 'bg-forest-50 hover:bg-forest-100 text-forest-800 border-forest-200/80 shadow-subtle'
          }`}
          title="Click to recalculate cross-module plan sync"
          aria-label="Cross-module sync status indicator"
        >
          {isSyncing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-gold-600" />
              <span className="hidden sm:inline">Syncing Plan...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-forest-600" />
              <span className="hidden sm:inline">Everything In Sync</span>
              <span className="sm:hidden">Synced</span>
            </>
          )}
        </button>

        {/* Quick Simulator CTA */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setCurrentSection('simulator')}
          leftIcon={<Sparkles className="w-3.5 h-3.5 text-terracotta-500" />}
          className="hidden xl:inline-flex"
        >
          Simulate Changes
        </Button>

        {/* Switch / View Events */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setCurrentSection('events')}
          className="hidden sm:inline-flex"
        >
          My Events
        </Button>

        {/* Create Event Trigger */}
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsCreateEventOpen(true)}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Create Event
        </Button>
      </div>
    </header>
  )
}
