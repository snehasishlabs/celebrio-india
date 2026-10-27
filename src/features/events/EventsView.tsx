import React, { useState } from 'react'
import { Plus, Calendar, MapPin, Users, Coins, Check, Sparkles } from 'lucide-react'
import { usePlanner } from '@/context/PlannerContext'
import { CelebrationEvent, EventCategory } from '@/types/event'
import { Card } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { StorageService } from '@/services/storage/storageService'

export const EventsView: React.FC = () => {
  const { events, activeEvent, setActiveEventId, setCurrentSection } = usePlanner()
  const [isCreating, setIsCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<EventCategory>('wedding')
  const [date, setDate] = useState('')
  const [venueName, setVenueName] = useState('')
  const [city, setCity] = useState('')
  const [budget, setBudget] = useState('45000')
  const [guests, setGuests] = useState('120')
  const [errorMsg, setErrorMsg] = useState('')

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !date || !venueName.trim() || !city.trim()) {
      setErrorMsg('Please complete all required fields.')
      return
    }

    const budgetNum = Number(budget)
    const guestsNum = Number(guests)
    if (isNaN(budgetNum) || budgetNum <= 0) {
      setErrorMsg('Please specify a valid total budget.')
      return
    }

    const newEvent: CelebrationEvent = {
      id: `ev-${Date.now()}`,
      title: title.trim(),
      category,
      date,
      location: {
        venueName: venueName.trim(),
        city: city.trim(),
        isIndoor: true,
      },
      totalBudget: budgetNum,
      currency: 'USD',
      targetGuestCount: guestsNum || 100,
      confirmedGuestCount: 0,
      status: 'planning',
      syncState: 'in-sync',
      syncSummary: 'Initial celebration framework established.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const updated = [...events, newEvent]
    StorageService.saveEvents(updated)
    setActiveEventId(newEvent.id)
    setIsCreating(false)
    setTitle('')
    setDate('')
    setVenueName('')
    setCity('')
    setErrorMsg('')
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ivory-300">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal-900 tracking-tight">
            Celebration Portfolio
          </h2>
          <p className="text-xs sm:text-sm text-charcoal-600 mt-1">
            Manage multiple celebrations with isolated budget models and synchronized timelines.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsCreating(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          New Celebration
        </Button>
      </div>

      {/* Creation Modal / Form */}
      {isCreating && (
        <Card variant="elevated" className="border-forest-300 p-6 max-w-2xl mx-auto">
          <div className="flex items-center justify-between pb-4 border-b border-ivory-300 mb-5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-terracotta-500" />
              <h3 className="font-serif font-bold text-lg text-charcoal-900">
                Initialize New Celebration
              </h3>
            </div>
            <button
              onClick={() => setIsCreating(false)}
              className="text-xs text-charcoal-500 hover:text-charcoal-900"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-terracotta-50 border border-terracotta-200 text-xs text-terracotta-800">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase mb-1">
                Celebration Name *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Elysian Manor Summer Wedding"
                className="w-full px-3.5 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-sm focus:outline-none focus:ring-2 focus:ring-forest-700"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 uppercase mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as EventCategory)}
                  className="w-full px-3.5 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-sm focus:outline-none focus:ring-2 focus:ring-forest-700"
                >
                  <option value="wedding">Wedding</option>
                  <option value="gala">Gala / Fundraiser</option>
                  <option value="anniversary">Anniversary</option>
                  <option value="milestone-birthday">Milestone Birthday</option>
                  <option value="corporate-summit">Corporate Summit</option>
                  <option value="product-launch">Product Launch</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 uppercase mb-1">
                  Target Date *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-sm focus:outline-none focus:ring-2 focus:ring-forest-700"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 uppercase mb-1">
                  Venue Name *
                </label>
                <input
                  type="text"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  placeholder="e.g. The Glasshouse Conservatory"
                  className="w-full px-3.5 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-sm focus:outline-none focus:ring-2 focus:ring-forest-700"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 uppercase mb-1">
                  City, Region *
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. San Francisco, CA"
                  className="w-full px-3.5 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-sm focus:outline-none focus:ring-2 focus:ring-forest-700"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 uppercase mb-1">
                  Total Budget (USD)
                </label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-sm focus:outline-none focus:ring-2 focus:ring-forest-700"
                  min="1000"
                  step="500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 uppercase mb-1">
                  Target Guest Count
                </label>
                <input
                  type="number"
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-sm focus:outline-none focus:ring-2 focus:ring-forest-700"
                  min="1"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-ivory-300">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsCreating(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save &amp; Activate Plan
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {events.map((ev) => {
          const isActive = ev.id === activeEvent?.id
          return (
            <Card
              key={ev.id}
              variant={isActive ? 'default' : 'default'}
              isInteractive
              onClick={() => {
                setActiveEventId(ev.id)
                setCurrentSection('dashboard')
              }}
              className={`p-6 relative group transition-all ${
                isActive
                  ? 'ring-2 ring-forest-700 border-forest-400 bg-ivory-50'
                  : 'hover:border-forest-300'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <Badge variant={isActive ? 'forest' : 'neutral'} size="sm">
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
                <span className="text-forest-700 font-semibold group-hover:underline">
                  {isActive ? 'Currently Planning' : 'Switch to this Event'}
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
  )
}
