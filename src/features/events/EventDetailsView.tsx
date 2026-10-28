import React, { useState, useEffect } from 'react'
import {
  Calendar,
  MapPin,
  Users,
  Coins,
  Sparkles,
  Clock,
  Briefcase,
  HeartHandshake,
  ShieldCheck,
  Palette,
  ArrowRight,
  Edit3,
  Trash2,
  X,
} from 'lucide-react'
import { usePlanner, EventDetailTab } from '@/context/PlannerContext'
import { Card } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { ThemeConceptsView } from '@/features/ideas/ThemeConceptsView'
import { BudgetView } from '@/features/budget/BudgetView'
import { TimelineView } from '@/features/timeline/TimelineView'
import { VendorsView } from '@/features/vendors/VendorsView'
import { GuestExperienceView } from '@/features/events/GuestExperienceView'
import { ContingencyPlanView } from '@/features/events/ContingencyPlanView'
import { calculateDaysRemaining } from '@/utils/timelineEngine'
import { formatCurrency } from '@/utils/budgetGuardian'

const TABS: { id: EventDetailTab; label: string; icon: typeof Calendar }[] = [
  { id: 'overview', label: 'Overview', icon: Calendar },
  { id: 'ideas', label: 'Personalized Ideas', icon: Palette },
  { id: 'budget', label: 'Budget Planner', icon: Coins },
  { id: 'timeline', label: 'Timeline & Run of Show', icon: Clock },
  { id: 'vendors', label: 'Vendors', icon: Briefcase },
  { id: 'guest-experience', label: 'Guest Experience', icon: HeartHandshake },
  { id: 'contingency', label: 'Contingency Plan', icon: ShieldCheck },
]

export const EventDetailsView: React.FC = () => {
  const {
    events,
    activeEvent,
    activeTab,
    setActiveTab,
    budgetItems,
    timelineTasks,
    vendors,
    selectedConcept,
    setCurrentSection,
    updateActiveEvent,
    deleteEvent,
  } = usePlanner()

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editGuestCount, setEditGuestCount] = useState('')
  const [editCity, setEditCity] = useState('')
  const [editVenue, setEditVenue] = useState('')
  const [isConfirmDelete, setIsConfirmDelete] = useState(false)

  const handleOpenEdit = () => {
    if (!activeEvent) return
    setEditTitle(activeEvent.title)
    setEditDate(activeEvent.date)
    setEditGuestCount(String(activeEvent.targetGuestCount))
    setEditCity(activeEvent.location.city)
    setEditVenue(activeEvent.location.venueName)
    setIsConfirmDelete(false)
    setIsEditModalOpen(true)
  }

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeEvent || !editTitle.trim()) return
    updateActiveEvent({
      title: editTitle.trim(),
      date: editDate.trim() || activeEvent.date,
      targetGuestCount: Math.max(1, parseInt(editGuestCount, 10) || activeEvent.targetGuestCount),
      location: {
        ...activeEvent.location,
        city: editCity.trim() || activeEvent.location.city,
        venueName: editVenue.trim() || activeEvent.location.venueName,
      },
    })
    setIsEditModalOpen(false)
  }

  const handleDelete = () => {
    if (!activeEvent) return
    deleteEvent(activeEvent.id)
    setIsEditModalOpen(false)
    setCurrentSection('dashboard')
  }

  useEffect(() => {
    if (!isEditModalOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsEditModalOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isEditModalOpen])

  if (!activeEvent) return null

  // Financial calculations
  const totalBudget = activeEvent.totalBudget
  const allocated = budgetItems.reduce((acc, i) => acc + i.allocatedAmount, 0)
  const paid = budgetItems.reduce((acc, i) => acc + i.paidAmount, 0)
  const remaining = totalBudget - allocated

  // Timeline & Vendors
  const completedTasks = timelineTasks.filter((t) => t.status === 'completed').length
  const totalTasks = timelineTasks.length
  const signedVendors = vendors.filter(
    (v) => v.contractStatus === 'contract-signed' || v.contractStatus === 'deposit-paid',
  ).length

  // Days remaining
  const daysRemaining = Math.max(0, calculateDaysRemaining(activeEvent.date) ?? 0)

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Event Header Banner */}
      <div className="bg-ivory-50 border border-ivory-300 rounded-2xl p-5 sm:p-7 shadow-subtle">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-ivory-200">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="forest" size="sm" className="capitalize">
                {activeEvent.category.replace('-', ' ')}
              </Badge>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-forest-100 text-forest-800 border border-forest-200 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {activeEvent.syncState === 'in-sync' ? 'Fully Synchronized' : 'Drift Detected'}
              </span>
              <span className="text-xs text-charcoal-500">
                Created {new Date(activeEvent.createdAt).toLocaleDateString()}
              </span>
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal-900 tracking-tight">
              {activeEvent.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-charcoal-600 mt-2">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-forest-700" />
                {activeEvent.date}
                <strong className="text-forest-800 ml-1">({daysRemaining} days away)</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-forest-700" />
                {activeEvent.location.venueName}, {activeEvent.location.city}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-forest-700" />
                {activeEvent.targetGuestCount} Target Guests
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <Button
              variant="terracotta"
              size="sm"
              onClick={() => setCurrentSection('simulator')}
              leftIcon={<Sparkles className="w-3.5 h-3.5" />}
            >
              Simulate Shifts
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setActiveTab('ideas')}
              leftIcon={<Palette className="w-3.5 h-3.5 text-forest-700" />}
            >
              Explore Ideas
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleOpenEdit}
              leftIcon={<Edit3 className="w-3.5 h-3.5 text-forest-700" />}
            >
              Edit Plan
            </Button>
          </div>
        </div>

        {/* Tab Navigation Navigation Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-3 -mb-1 scrollbar-none" role="tablist">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon

            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-700 ${
                  isActive
                    ? 'bg-forest-900 text-ivory-50 shadow-subtle'
                    : 'text-charcoal-600 hover:text-charcoal-900 hover:bg-ivory-200/70'
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 ${
                    isActive ? 'text-gold-300' : 'text-charcoal-400'
                  }`}
                  aria-hidden="true"
                />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content Display */}
      {activeTab === 'overview' && (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-150">
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card variant="default" className="p-5">
              <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider block mb-1">
                Total Budget
              </span>
              <div className="font-serif text-2xl font-bold text-charcoal-900">
                {formatCurrency(totalBudget, activeEvent.currency)}
              </div>
              <div className="flex justify-between text-xs text-charcoal-500 mt-2">
                <span>Allocated: {formatCurrency(allocated, activeEvent.currency)}</span>
                <span className="text-forest-700 font-semibold">
                  {formatCurrency(Math.max(0, remaining), activeEvent.currency)} free
                </span>
              </div>
            </Card>

            <Card variant="default" className="p-5">
              <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider block mb-1">
                Milestones Progress
              </span>
              <div className="font-serif text-2xl font-bold text-charcoal-900">
                {completedTasks} / {totalTasks}
              </div>
              <p className="text-xs text-forest-700 font-medium mt-2">
                {totalTasks > 0
                  ? `${Math.round((completedTasks / totalTasks) * 100)}% on schedule`
                  : 'Ready to plan'}
              </p>
            </Card>

            <Card variant="default" className="p-5">
              <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider block mb-1">
                Vendor Contracts
              </span>
              <div className="font-serif text-2xl font-bold text-charcoal-900">
                {signedVendors} / {vendors.length}
              </div>
              <p className="text-xs text-charcoal-500 mt-2">
                {formatCurrency(paid, activeEvent.currency)} in deposits secured
              </p>
            </Card>

            <Card variant="default" className="p-5">
              <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider block mb-1">
                Guest Attendance
              </span>
              <div className="font-serif text-2xl font-bold text-charcoal-900">
                {activeEvent.confirmedGuestCount} / {activeEvent.targetGuestCount}
              </div>
              <p className="text-xs text-charcoal-500 mt-2">
                {activeEvent.dietaryRequirements.length} special dietary menus active
              </p>
            </Card>
          </div>

          {/* Active Concept Showcase & Priorities */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Active Theme Concept Summary */}
            <Card variant="default" className="lg:col-span-2 p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-ivory-300">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-forest-700" />
                  <h3 className="font-serif font-bold text-base text-charcoal-900">
                    Active Design Concept
                  </h3>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setActiveTab('ideas')}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Change Concept
                </Button>
              </div>

              {selectedConcept ? (
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-forest-100 text-forest-800">
                      {selectedConcept.tier.replace('-', ' ')}
                    </span>
                    <h4 className="font-serif font-bold text-xl text-charcoal-900 mt-1.5">
                      {selectedConcept.title}
                    </h4>
                    <p className="text-xs text-forest-800 italic mt-0.5">
                      &ldquo;{selectedConcept.tagline}&rdquo;
                    </p>
                    <p className="text-xs text-charcoal-600 mt-2 leading-relaxed">
                      {selectedConcept.description}
                    </p>
                  </div>

                  {/* Swatches */}
                  <div>
                    <span className="text-xs font-semibold text-charcoal-700 block mb-2">
                      Design Color Harmony:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {selectedConcept.colorPalette.map((color) => (
                        <div
                          key={color.name}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-ivory-100 border border-ivory-200 text-xs text-charcoal-800"
                        >
                          <span
                            className="w-4 h-4 rounded-full border border-black/10 shrink-0 shadow-subtle"
                            style={{ backgroundColor: color.hex }}
                          />
                          <span className="font-medium text-[11px]">{color.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Highlights Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-charcoal-600">
                    <div className="p-3 rounded-xl bg-ivory-100/70 border border-ivory-200">
                      <strong className="text-charcoal-900 block mb-0.5">Focal Décor:</strong>
                      {selectedConcept.decor.focalPoint}
                    </div>
                    <div className="p-3 rounded-xl bg-ivory-100/70 border border-ivory-200">
                      <strong className="text-charcoal-900 block mb-0.5">Dining Experience:</strong>
                      {selectedConcept.foodAndBeverage.serviceStyle}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-charcoal-500">
                  No concept currently selected. Click &quot;Explore Ideas&quot; to review suggestions.
                </div>
              )}
            </Card>

            {/* Event Priorities & Preferences Card */}
            <Card variant="default" className="p-6 space-y-4">
              <h3 className="font-serif font-bold text-base text-charcoal-900 pb-3 border-b border-ivory-300">
                Core Priorities
              </h3>

              <div>
                <span className="text-xs font-semibold text-charcoal-700 block mb-2">
                  Designated Focus Areas:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {activeEvent.priorities && activeEvent.priorities.length > 0 ? (
                    activeEvent.priorities.map((p) => (
                      <span
                        key={p}
                        className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-forest-50 text-forest-800 border border-forest-200"
                      >
                        {p}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-charcoal-500 italic">None specified.</span>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-ivory-200/80 space-y-2 text-xs text-charcoal-600">
                <div>
                  <strong className="text-charcoal-800">Setting: </strong>
                  <span className="capitalize">{activeEvent.preferences?.indoorOutdoor || 'Indoor'}</span>
                </div>
                {activeEvent.preferences?.dressCode && (
                  <div>
                    <strong className="text-charcoal-800">Dress Code: </strong>
                    <span>{activeEvent.preferences.dressCode}</span>
                  </div>
                )}
                {activeEvent.preferences?.specialNotes && (
                  <div>
                    <strong className="text-charcoal-800">Special Notes: </strong>
                    <span>{activeEvent.preferences.specialNotes}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-ivory-200">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setActiveTab('guest-experience')}
                  className="w-full"
                >
                  Manage Guest Experience
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'ideas' && <ThemeConceptsView />}

      {activeTab === 'budget' && <BudgetView />}

      {activeTab === 'timeline' && <TimelineView />}

      {activeTab === 'vendors' && <VendorsView />}

      {activeTab === 'guest-experience' && <GuestExperienceView />}

      {activeTab === 'contingency' && <ContingencyPlanView />}

      {/* Edit Event Modal */}
      {isEditModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-event-modal-title"
          className="fixed inset-0 z-50 bg-charcoal-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <Card
            variant="default"
            className="w-full max-w-lg p-6 bg-ivory-50 max-h-[90vh] overflow-y-auto shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-ivory-300">
              <h3 id="edit-event-modal-title" className="font-serif font-bold text-lg text-charcoal-900">
                Edit Celebration Plan
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-xs text-charcoal-500 hover:text-charcoal-900 p-1 rounded-lg"
                aria-label="Close edit celebration modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label htmlFor="edit-title" className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Celebration Name *
                </label>
                <input
                  id="edit-title"
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-ivory-300 bg-white focus:outline-none focus:ring-2 focus:ring-forest-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="edit-date" className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Event Date *
                  </label>
                  <input
                    id="edit-date"
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-ivory-300 bg-white focus:outline-none focus:ring-2 focus:ring-forest-700"
                  />
                  <span className="text-[10px] text-charcoal-500 mt-1 block">
                    Changing the date auto-shifts milestone deadlines.
                  </span>
                </div>

                <div>
                  <label htmlFor="edit-guests" className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Target Guest Count *
                  </label>
                  <input
                    id="edit-guests"
                    type="number"
                    min="1"
                    max="10000"
                    value={editGuestCount}
                    onChange={(e) => setEditGuestCount(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-ivory-300 bg-white focus:outline-none focus:ring-2 focus:ring-forest-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="edit-city" className="block text-xs font-semibold text-charcoal-700 mb-1">
                    City / Destination
                  </label>
                  <input
                    id="edit-city"
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-ivory-300 bg-white focus:outline-none focus:ring-2 focus:ring-forest-700"
                  />
                </div>

                <div>
                  <label htmlFor="edit-venue" className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Venue Name
                  </label>
                  <input
                    id="edit-venue"
                    type="text"
                    value={editVenue}
                    onChange={(e) => setEditVenue(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-ivory-300 bg-white focus:outline-none focus:ring-2 focus:ring-forest-700"
                  />
                </div>
              </div>

              {/* Danger Zone: Delete Plan */}
              {events.length > 1 && (
                <div className="pt-3 border-t border-ivory-300">
                  {!isConfirmDelete ? (
                    <button
                      type="button"
                      onClick={() => setIsConfirmDelete(true)}
                      className="text-xs text-rose-700 hover:text-rose-900 font-semibold flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete this celebration
                    </button>
                  ) : (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
                      <p className="text-xs text-rose-800">
                        Are you sure you want to delete &ldquo;{activeEvent.title}&rdquo;? All linked budget items, milestones, and suppliers will be removed.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={handleDelete}
                        >
                          Confirm Delete
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => setIsConfirmDelete(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-ivory-300">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
