import React, { useState } from 'react'
import {
  Plus,
  Calendar,
  MapPin,
  Users,
  Coins,
  Check,
  ArrowRight,
  LayoutGrid,
  Layers,
} from 'lucide-react'
import { usePlanner } from '@/context/PlannerContext'
import { Card } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { EventDetailsView } from './EventDetailsView'

export const EventsView: React.FC = () => {
  const {
    events,
    activeEvent,
    setActiveEventId,
    setIsCreateEventOpen,
    setActiveTab,
  } = usePlanner()
  const [viewMode, setViewMode] = useState<'details' | 'portfolio'>('details')

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Top Header & Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ivory-300">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal-900 tracking-tight">
            Celebration Workspace
          </h2>
          <p className="text-xs sm:text-sm text-charcoal-600 mt-1">
            Manage your celebration details, review tailored theme concepts, and maintain cross-module synchrony.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="inline-flex rounded-xl p-1 bg-ivory-200/80 border border-ivory-300 text-xs">
            <button
              onClick={() => setViewMode('details')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                viewMode === 'details'
                  ? 'bg-ivory-50 text-forest-900 shadow-subtle'
                  : 'text-charcoal-600 hover:text-charcoal-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Event Details</span>
            </button>
            <button
              onClick={() => setViewMode('portfolio')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                viewMode === 'portfolio'
                  ? 'bg-ivory-50 text-forest-900 shadow-subtle'
                  : 'text-charcoal-600 hover:text-charcoal-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>All Events ({events.length})</span>
            </button>
          </div>

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

      {/* Portfolio Selector Quick Bar when in Details mode */}
      {viewMode === 'details' && events.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <span className="text-xs font-semibold text-charcoal-500 shrink-0 mr-1">
            Switch Event:
          </span>
          {events.map((ev) => {
            const isSelected = ev.id === activeEvent?.id
            return (
              <button
                key={ev.id}
                onClick={() => setActiveEventId(ev.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-forest-100 text-forest-900 border-forest-400 font-semibold shadow-subtle'
                    : 'bg-ivory-50 text-charcoal-600 border-ivory-300 hover:border-ivory-400'
                }`}
              >
                <span>{ev.title}</span>
                {isSelected && <Check className="w-3 h-3 text-forest-700" />}
              </button>
            )
          })}
        </div>
      )}

      {/* Details View Mode */}
      {viewMode === 'details' && (
        activeEvent ? (
          <EventDetailsView />
        ) : (
          <div className="p-12 text-center bg-ivory-50 rounded-2xl border border-ivory-300">
            <h3 className="font-serif text-lg font-bold text-charcoal-900 mb-2">
              No Event Active
            </h3>
            <p className="text-xs text-charcoal-600 mb-4">
              Select or create an event to view full tabs and personalized ideas.
            </p>
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsCreateEventOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Create New Celebration
            </Button>
          </div>
        )
      )}

      {/* Portfolio Grid View Mode */}
      {viewMode === 'portfolio' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map((ev) => {
              const isActive = ev.id === activeEvent?.id
              return (
                <Card
                  key={ev.id}
                  variant="default"
                  isInteractive
                  onClick={() => {
                    setActiveEventId(ev.id)
                    setViewMode('details')
                    setActiveTab('overview')
                  }}
                  className={`p-6 relative group transition-all ${
                    isActive
                      ? 'ring-2 ring-forest-700 border-forest-400 bg-ivory-50'
                      : 'hover:border-forest-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <Badge variant={isActive ? 'forest' : 'neutral'} size="sm" className="capitalize">
                      {ev.category.replace('-', ' ')}
                    </Badge>
                    {isActive && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-forest-700 bg-forest-100 px-2 py-0.5 rounded-full border border-forest-200">
                        <Check className="w-3 h-3" />
                        Active Plan
                      </span>
                    )}
                  </div>

                  <h3 className="font-serif font-bold text-lg text-charcoal-900 group-hover:text-forest-900 transition-colors mb-2">
                    {ev.title}
                  </h3>

                  <div className="space-y-1.5 text-xs text-charcoal-600 mb-5">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-charcoal-400" />
                      <span>{ev.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-charcoal-400" />
                      <span>
                        {ev.location.venueName}, {ev.location.city}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-charcoal-400" />
                      <span>{ev.targetGuestCount} Target Guests</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Coins className="w-3.5 h-3.5 text-charcoal-400" />
                      <span className="font-semibold text-charcoal-800">
                        ${ev.totalBudget.toLocaleString()} Budget
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-ivory-200/80 text-xs">
                    <span className="text-forest-700 font-semibold group-hover:underline flex items-center gap-1">
                      <span>Open Event Details</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                    <span className="text-[11px] text-charcoal-400">
                      {ev.syncState === 'in-sync' ? 'Synced' : 'Action needed'}
                    </span>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
