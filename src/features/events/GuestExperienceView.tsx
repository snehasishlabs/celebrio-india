import React from 'react'
import {
  UtensilsCrossed,
  HeartHandshake,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Plus,
  Minus,
} from 'lucide-react'
import { usePlanner } from '@/context/PlannerContext'
import { Card } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'

export const GuestExperienceView: React.FC = () => {
  const { activeEvent, updateActiveEvent } = usePlanner()

  if (!activeEvent) return null

  const targetGuests = activeEvent.targetGuestCount
  const confirmedGuests = activeEvent.confirmedGuestCount
  const pendingRSVP = Math.max(0, targetGuests - confirmedGuests)

  const handleUpdateConfirmed = (delta: number) => {
    const nextVal = Math.max(0, Math.min(targetGuests + 50, confirmedGuests + delta))
    updateActiveEvent({ confirmedGuestCount: nextVal })
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="pb-4 border-b border-ivory-300">
        <div className="flex items-center gap-2 mb-1.5">
          <Badge variant="terracotta" size="sm">
            Hospitality &amp; Inclusivity
          </Badge>
          <span className="text-xs text-charcoal-500">
            Guest Centric Experience Management
          </span>
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal-900 tracking-tight">
          Guest Experience, Dietary &amp; Accessibility
        </h2>
        <p className="text-xs sm:text-sm text-charcoal-600 mt-1 max-w-2xl">
          Coordinate attendee hospitality, ensure certified dietary compliance with the culinary team,
          and verify universal physical and sensory accessibility.
        </p>
      </div>

      {/* Headcount & Attendance Tracker */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card variant="default" className="p-5 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider block mb-1">
              Target Guest List
            </span>
            <div className="font-serif text-3xl font-bold text-charcoal-900 mb-1">
              {targetGuests}
            </div>
            <p className="text-xs text-charcoal-500">Capacity reserved with venue</p>
          </div>
          <div className="mt-4 pt-3 border-t border-ivory-200 text-xs text-charcoal-600">
            Estimated Plate Cost: ~${Math.round(
              (activeEvent.totalBudget * 0.32) / Math.max(1, targetGuests),
            )}/person
          </div>
        </Card>

        <Card variant="default" className="p-5 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider block mb-1">
              Confirmed Attendees
            </span>
            <div className="font-serif text-3xl font-bold text-forest-800 mb-1">
              {confirmedGuests}
            </div>
            <p className="text-xs text-charcoal-500">
              {Math.round((confirmedGuests / Math.max(1, targetGuests)) * 100)}% RSVP response rate
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-ivory-200 flex items-center justify-between">
            <span className="text-xs font-medium text-charcoal-700">Quick Adjust:</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleUpdateConfirmed(-1)}
                className="w-7 h-7 rounded-lg bg-ivory-200 hover:bg-ivory-300 flex items-center justify-center text-charcoal-700"
                aria-label="Decrease confirmed guests"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleUpdateConfirmed(1)}
                className="w-7 h-7 rounded-lg bg-forest-100 hover:bg-forest-200 flex items-center justify-center text-forest-800"
                aria-label="Increase confirmed guests"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </Card>

        <Card variant="default" className="p-5 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider block mb-1">
              Pending Responses
            </span>
            <div className="font-serif text-3xl font-bold text-terracotta-600 mb-1">
              {pendingRSVP}
            </div>
            <p className="text-xs text-charcoal-500">Awaiting RSVP closing window</p>
          </div>
          <div className="mt-4 pt-3 border-t border-ivory-200 text-xs text-forest-700 font-medium">
            Lock deadline: 14 days before celebration date
          </div>
        </Card>
      </div>

      {/* Dietary & Accessibility Accommodations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dietary Panel */}
        <Card variant="default" className="p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-ivory-300">
            <div className="w-8 h-8 rounded-xl bg-terracotta-100 text-terracotta-700 flex items-center justify-center">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-charcoal-900">
                Dietary Requirements &amp; Allergies
              </h3>
              <p className="text-xs text-charcoal-500">Transmitted to catering kitchen</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-xs font-semibold text-charcoal-700 block mb-2">
                Certified Menu Accommodations:
              </span>
              <div className="flex flex-wrap gap-2">
                {activeEvent.dietaryRequirements.length > 0 ? (
                  activeEvent.dietaryRequirements.map((diet) => (
                    <span
                      key={diet}
                      className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-terracotta-100 text-terracotta-800 border border-terracotta-200 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-terracotta-600" />
                      {diet}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-charcoal-500 italic">
                    No dietary restrictions noted. Standard seasonal menu active.
                  </span>
                )}
              </div>
            </div>

            {activeEvent.dietaryNotes && (
              <div className="p-3.5 rounded-xl bg-ivory-100/80 border border-ivory-200 text-xs text-charcoal-700">
                <span className="font-semibold text-charcoal-900 block mb-0.5">
                  Culinary Specifics &amp; Allergy Precautions:
                </span>
                {activeEvent.dietaryNotes}
              </div>
            )}
          </div>
        </Card>

        {/* Accessibility Panel */}
        <Card variant="default" className="p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-ivory-300">
            <div className="w-8 h-8 rounded-xl bg-gold-100 text-gold-800 flex items-center justify-center">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-charcoal-900">
                Universal Accessibility &amp; Sensory Care
              </h3>
              <p className="text-xs text-charcoal-500">Venue facilities audit checklist</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-xs font-semibold text-charcoal-700 block mb-2">
                Configured Accommodations:
              </span>
              <div className="flex flex-wrap gap-2">
                {activeEvent.accessibilityRequirements.length > 0 ? (
                  activeEvent.accessibilityRequirements.map((acc) => (
                    <span
                      key={acc}
                      className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-gold-100 text-gold-900 border border-gold-200 flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-gold-700" />
                      {acc}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-charcoal-500 italic">
                    Standard step-free circulation and accessible restrooms confirmed.
                  </span>
                )}
              </div>
            </div>

            {activeEvent.accessibilityNotes && (
              <div className="p-3.5 rounded-xl bg-ivory-100/80 border border-ivory-200 text-xs text-charcoal-700">
                <span className="font-semibold text-charcoal-900 block mb-0.5">
                  Mobility &amp; Sensory Instructions:
                </span>
                {activeEvent.accessibilityNotes}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Guest Arrival & Hospitality Touchpoints */}
      <Card variant="default" className="p-6">
        <h3 className="font-serif font-bold text-base text-charcoal-900 pb-3 border-b border-ivory-300 mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-forest-700" />
          <span>Curated Guest Touchpoint Sequence</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-ivory-100/60 border border-ivory-200 space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-forest-800">
              Phase 1 · Arrival
            </span>
            <h4 className="font-semibold text-xs text-charcoal-900">Welcome &amp; Check-In</h4>
            <p className="text-[11px] text-charcoal-600 leading-snug">
              Valet greeting, coat check, and champagne or botanical mocktail coupe upon entry.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-ivory-100/60 border border-ivory-200 space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-forest-800">
              Phase 2 · Circulation
            </span>
            <h4 className="font-semibold text-xs text-charcoal-900">Cocktail &amp; Aperitif</h4>
            <p className="text-[11px] text-charcoal-600 leading-snug">
              Passed tasting stations and roaming acoustic strings; open seating lounges available.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-ivory-100/60 border border-ivory-200 space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-forest-800">
              Phase 3 · Dining
            </span>
            <h4 className="font-semibold text-xs text-charcoal-900">Dinner Service</h4>
            <p className="text-[11px] text-charcoal-600 leading-snug">
              Table escort, synchronized plate service, sommelier wine pairing, and dietary cards.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-ivory-100/60 border border-ivory-200 space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-forest-800">
              Phase 4 · Departure
            </span>
            <h4 className="font-semibold text-xs text-charcoal-900">Farewell Keepsake</h4>
            <p className="text-[11px] text-charcoal-600 leading-snug">
              Personalized take-home keepsake, arranged rideshare/valet retrieval, and memory cards.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
