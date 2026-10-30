import React, { useState, useMemo, useEffect } from 'react'
import {
  UtensilsCrossed,
  HeartHandshake,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Plus,
  Minus,
  Users,
  Search,
  Download,
  Trash2,
  Phone,
  Mail,
  Shield,
  FileSpreadsheet,
} from 'lucide-react'
import { usePlanner } from '@/context/PlannerContext'
import { Card } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { GuestCategory, RsvpStatus } from '@/types/guest'
import {
  sanitizePii,
  exportSanitizedGuestList,
  calculateGuestSummary,
} from '@/utils/security'
import { formatCurrency } from '@/utils/budgetGuardian'

const GUESTS_PER_PAGE = 8

export const GuestExperienceView: React.FC = () => {
  const {
    activeEvent,
    updateActiveEvent,
    guests,
    addGuest,
    updateGuest,
    deleteGuest,
  } = usePlanner()

  const [activeSubTab, setActiveSubTab] = useState<'roster' | 'dietary' | 'accessibility'>('roster')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [rsvpFilter, setRsvpFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [copyFeedback, setCopyFeedback] = useState('')

  // Add Guest Form State
  const [name, setName] = useState('')
  const [category, setCategory] = useState<GuestCategory>('family')
  const [rsvpStatus, setRsvpStatus] = useState<RsvpStatus>('awaiting')
  const [dietaryRequirement, setDietaryRequirement] = useState('')
  const [tableNumber, setTableNumber] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [plusOnes, setPlusOnes] = useState(0)
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (!isAddModalOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAddModalOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isAddModalOpen])

  const guestSummary = useMemo(() => calculateGuestSummary(guests), [guests])

  // Filtered & Paginated Guests
  const filteredGuests = useMemo(() => {
    return guests.filter((g) => {
      const matchesSearch =
        searchQuery === '' ||
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.dietaryRequirement && g.dietaryRequirement.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (g.tableNumber && g.tableNumber.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesCategory = categoryFilter === 'all' || g.category === categoryFilter
      const matchesRsvp = rsvpFilter === 'all' || g.rsvpStatus === rsvpFilter

      return matchesSearch && matchesCategory && matchesRsvp
    })
  }, [guests, searchQuery, categoryFilter, rsvpFilter])

  const totalPages = Math.max(1, Math.ceil(filteredGuests.length / GUESTS_PER_PAGE))
  const paginatedGuests = useMemo(() => {
    const start = (currentPage - 1) * GUESTS_PER_PAGE
    return filteredGuests.slice(start, start + GUESTS_PER_PAGE)
  }, [filteredGuests, currentPage])

  if (!activeEvent) return null

  const targetGuests = activeEvent.targetGuestCount
  const confirmedGuests = activeEvent.confirmedGuestCount
  const pendingRSVP = Math.max(0, targetGuests - confirmedGuests)
  const currency = activeEvent.currency || 'INR'

  const handleUpdateConfirmed = (delta: number) => {
    const nextVal = Math.max(0, Math.min(targetGuests + 50, confirmedGuests + delta))
    updateActiveEvent({ confirmedGuestCount: nextVal })
  }

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setFormError('Please enter attendee or party name.')
      return
    }

    addGuest({
      eventId: activeEvent.id,
      name: name.trim(),
      category,
      rsvpStatus,
      dietaryRequirement: dietaryRequirement.trim() || undefined,
      tableNumber: tableNumber.trim() || undefined,
      contactPhone: contactPhone.trim() || undefined,
      contactEmail: contactEmail.trim() || undefined,
      plusOnes: Math.max(0, Number(plusOnes) || 0),
      notes: notes.trim() || undefined,
      invitationSent: true,
    })

    // Reset form
    setName('')
    setCategory('family')
    setRsvpStatus('awaiting')
    setDietaryRequirement('')
    setTableNumber('')
    setContactPhone('')
    setContactEmail('')
    setPlusOnes(0)
    setNotes('')
    setFormError('')
    setIsAddModalOpen(false)
  }

  const handleExportCateringCsv = () => {
    const csvContent = exportSanitizedGuestList(guests)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Catering_Dietary_Roster_${activeEvent.id}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    setCopyFeedback('Catering dietary roster downloaded!')
    setTimeout(() => setCopyFeedback(''), 3000)
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* 1. Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ivory-300">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="terracotta" size="sm">
              Hospitality &amp; Inclusivity
            </Badge>
            <span className="text-xs text-charcoal-500 font-medium">
              Guest Centric Experience Management
            </span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal-900 tracking-tight">
            Guest Experience, Dietary &amp; Accessibility
          </h2>
          <p className="text-xs sm:text-sm text-charcoal-600 mt-1 max-w-3xl">
            Coordinate attendee hospitality, manage RSVP responses, verify certified dietary compliance
            with the catering team, and protect attendee personal information.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant={activeSubTab === 'roster' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setActiveSubTab('roster')}
          >
            <Users className="w-3.5 h-3.5 mr-1" />
            Guest Roster ({guests.length})
          </Button>
          <Button
            type="button"
            variant={activeSubTab === 'dietary' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setActiveSubTab('dietary')}
          >
            <UtensilsCrossed className="w-3.5 h-3.5 mr-1" />
            Dietary &amp; Kitchen
          </Button>
          <Button
            type="button"
            variant={activeSubTab === 'accessibility' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setActiveSubTab('accessibility')}
          >
            <HeartHandshake className="w-3.5 h-3.5 mr-1" />
            Accessibility &amp; Care
          </Button>
        </div>
      </div>

      {/* 2. Privacy Policy Banner */}
      <div className="p-3.5 rounded-xl bg-ivory-50 border border-ivory-300 flex items-start gap-2.5 text-xs text-charcoal-700">
        <Shield className="w-4 h-4 text-forest-700 shrink-0 mt-0.5" />
        <div className="flex-1">
          <strong>Privacy Shield Active:</strong> Attendee contact details are stored strictly in client-side persistence and masked in the interface. When exporting lists for external catering teams, phone numbers and emails are automatically stripped to protect personal guest information.
        </div>
        {copyFeedback && (
          <span className="text-xs font-semibold text-forest-800 bg-forest-100 px-2 py-0.5 rounded-md">
            {copyFeedback}
          </span>
        )}
      </div>

      {/* 3. Headcount & Attendance Tracker Vitals */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            Est. Plate Cost: ~{formatCurrency(Math.round((activeEvent.totalBudget * 0.32) / Math.max(1, targetGuests)), currency)}/head
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
                className="w-7 h-7 rounded-lg bg-ivory-200 hover:bg-ivory-300 flex items-center justify-center text-charcoal-700 focus:outline-none focus:ring-2 focus:ring-forest-600"
                aria-label="Decrease confirmed guests"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleUpdateConfirmed(1)}
                className="w-7 h-7 rounded-lg bg-forest-100 hover:bg-forest-200 flex items-center justify-center text-forest-800 focus:outline-none focus:ring-2 focus:ring-forest-600"
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
            <p className="text-xs text-charcoal-500">Awaiting RSVP cutoff</p>
          </div>
          <div className="mt-4 pt-3 border-t border-ivory-200 text-xs text-forest-700 font-medium">
            Lock deadline: 14 days before celebration date
          </div>
        </Card>

        <Card variant="default" className="p-5 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider block mb-1">
              Roster Count
            </span>
            <div className="font-serif text-3xl font-bold text-charcoal-900 mb-1">
              {guestSummary.totalInvited}
            </div>
            <p className="text-xs text-charcoal-500">
              {guestSummary.confirmedAttending} attending · {guestSummary.declined} declined
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-ivory-200 text-xs text-charcoal-600">
            {guests.length} entries on digital roster
          </div>
        </Card>
      </div>

      {/* 4. Tab Content: SUBTAB 1 - ROSTER */}
      {activeSubTab === 'roster' && (
        <div className="space-y-4">
          {/* Controls Bar: Search, Category Filter, RSVP Filter, Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-ivory-100/70 rounded-2xl border border-ivory-200">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
                <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search attendee, dietary, table..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-ivory-300 rounded-xl text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-forest-700"
                  aria-label="Search attendees"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="px-2.5 py-1.5 text-xs bg-white border border-ivory-300 rounded-xl text-charcoal-800 focus:outline-none focus:ring-2 focus:ring-forest-700"
                aria-label="Filter by guest category"
              >
                <option value="all">All Categories</option>
                <option value="family">Family Elders</option>
                <option value="bride-side">Bride Side</option>
                <option value="groom-side">Groom Side</option>
                <option value="friends">Friends</option>
                <option value="colleagues">Colleagues</option>
                <option value="vip">VIP Guests</option>
              </select>

              <select
                value={rsvpFilter}
                onChange={(e) => {
                  setRsvpFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="px-2.5 py-1.5 text-xs bg-white border border-ivory-300 rounded-xl text-charcoal-800 focus:outline-none focus:ring-2 focus:ring-forest-700"
                aria-label="Filter by RSVP status"
              >
                <option value="all">All RSVP States</option>
                <option value="attending">Attending</option>
                <option value="awaiting">Awaiting Response</option>
                <option value="declined">Declined</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleExportCateringCsv}
                title="Download CSV without personal phone/email for kitchen staff"
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                Export Catering List
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setIsAddModalOpen(true)}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Attendee
              </Button>
            </div>
          </div>

          {/* Guest Roster Table / Card Grid */}
          {paginatedGuests.length === 0 ? (
            <Card variant="default" className="p-8 text-center text-charcoal-600">
              <Users className="w-10 h-10 mx-auto text-charcoal-400 mb-3" />
              <h3 className="font-serif font-bold text-lg text-charcoal-900 mb-1">
                No matching attendees found
              </h3>
              <p className="text-xs text-charcoal-500 max-w-md mx-auto mb-4">
                {searchQuery || categoryFilter !== 'all' || rsvpFilter !== 'all'
                  ? 'Try clearing your filters or search keywords.'
                  : 'Start building your celebration roster by adding your first attendee.'}
              </p>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setIsAddModalOpen(true)}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Attendee
              </Button>
            </Card>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-ivory-300 bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-ivory-100/80 border-b border-ivory-300 text-charcoal-700 uppercase font-semibold text-[11px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Attendee Name</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">RSVP Status</th>
                    <th className="px-4 py-3">Dietary / Allergies</th>
                    <th className="px-4 py-3">Seating / Table</th>
                    <th className="px-4 py-3">Private Contact (Masked)</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ivory-200 text-charcoal-800">
                  {paginatedGuests.map((guest) => {
                    const isAttending = guest.rsvpStatus === 'attending'
                    const isDeclined = guest.rsvpStatus === 'declined'

                    return (
                      <tr key={guest.id} className="hover:bg-ivory-50/80 transition-colors">
                        <td className="px-4 py-3 font-semibold text-charcoal-900">
                          <div>{guest.name}</div>
                          {guest.plusOnes > 0 && (
                            <span className="text-[10px] text-forest-700 font-normal">
                              +{guest.plusOnes} guest{guest.plusOnes > 1 ? 's' : ''}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-medium capitalize bg-ivory-200 text-charcoal-800 border border-ivory-300">
                            {guest.category.replace('-', ' ')}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <select
                            value={guest.rsvpStatus}
                            onChange={(e) =>
                              updateGuest(guest.id, { rsvpStatus: e.target.value as RsvpStatus })
                            }
                            className={`px-2 py-1 rounded-lg text-[11px] font-semibold border ${
                              isAttending
                                ? 'bg-forest-100 text-forest-800 border-forest-300'
                                : isDeclined
                                ? 'bg-terracotta-100 text-terracotta-800 border-terracotta-300'
                                : 'bg-gold-100 text-gold-900 border-gold-300'
                            }`}
                            aria-label={`Update RSVP for ${guest.name}`}
                          >
                            <option value="attending">✓ Attending</option>
                            <option value="awaiting">⏳ Awaiting</option>
                            <option value="declined">✕ Declined</option>
                          </select>
                        </td>

                        <td className="px-4 py-3">
                          {guest.dietaryRequirement ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-terracotta-800 bg-terracotta-50 px-2 py-0.5 rounded border border-terracotta-200">
                              <UtensilsCrossed className="w-3 h-3 text-terracotta-600" />
                              {guest.dietaryRequirement}
                            </span>
                          ) : (
                            <span className="text-charcoal-400 italic text-[11px]">Standard</span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-charcoal-700 font-medium">
                          {guest.tableNumber || (
                            <span className="text-charcoal-400 italic">Unassigned</span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-charcoal-600 text-[11px]">
                          {guest.contactPhone || guest.contactEmail ? (
                            <div className="space-y-0.5">
                              {guest.contactPhone && (
                                <div className="flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-charcoal-400" />
                                  <span>{sanitizePii(guest.contactPhone, 'phone')}</span>
                                </div>
                              )}
                              {guest.contactEmail && (
                                <div className="flex items-center gap-1">
                                  <Mail className="w-3 h-3 text-charcoal-400" />
                                  <span>{sanitizePii(guest.contactEmail, 'email')}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-charcoal-400 italic">Protected (None)</span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => deleteGuest(guest.id)}
                            className="p-1.5 text-charcoal-400 hover:text-terracotta-700 rounded-lg hover:bg-terracotta-50 transition-colors"
                            aria-label={`Remove ${guest.name} from roster`}
                            title="Remove Attendee"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {/* Pagination Bar */}
              <div className="flex items-center justify-between px-4 py-3 bg-ivory-50 border-t border-ivory-200 text-xs text-charcoal-600">
                <div>
                  Showing {Math.min(filteredGuests.length, (currentPage - 1) * GUESTS_PER_PAGE + 1)} to{' '}
                  {Math.min(filteredGuests.length, currentPage * GUESTS_PER_PAGE)} of {filteredGuests.length} attendees
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <span className="font-medium text-charcoal-800">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Tab Content: SUBTAB 2 - DIETARY & KITCHEN ALLERGIES */}
      {activeSubTab === 'dietary' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Certified Dietary Compliance Panel */}
          <Card variant="default" className="p-6 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-ivory-300">
              <div className="w-8 h-8 rounded-xl bg-terracotta-100 text-terracotta-700 flex items-center justify-center">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-charcoal-900">
                  Dietary Requirements &amp; Allergies
                </h3>
                <p className="text-xs text-charcoal-500">Transmitted directly to catering kitchen</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-xs font-semibold text-charcoal-700 block mb-2">
                  Certified Celebration Menu Accommodations:
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

          {/* Roster Dietary Breakdown Summary Table */}
          <Card variant="default" className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-ivory-300">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-forest-100 text-forest-700 flex items-center justify-center">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-charcoal-900">
                    Roster Dietary Breakdown
                  </h3>
                  <p className="text-xs text-charcoal-500">Real-time attendee meal counts</p>
                </div>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleExportCateringCsv}
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                Export
              </Button>
            </div>

            <div className="divide-y divide-ivory-200 text-xs">
              {Object.entries(guestSummary.dietaryBreakdown).map(([diet, count]) => (
                <div key={diet} className="py-2.5 flex items-center justify-between">
                  <span className="font-medium text-charcoal-800">{diet}</span>
                  <span className="font-bold text-forest-800 px-2 py-0.5 rounded bg-forest-50 border border-forest-200">
                    {count} portion{count > 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* 6. Tab Content: SUBTAB 3 - UNIVERSAL ACCESSIBILITY & HOSPITALITY */}
      {activeSubTab === 'accessibility' && (
        <div className="space-y-6">
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
                  Valet greeting, coat check, and traditional welcome refreshments (Aam Panna / Coconut water / Coupe).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-ivory-100/60 border border-ivory-200 space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-forest-800">
                  Phase 2 · Circulation
                </span>
                <h4 className="font-semibold text-xs text-charcoal-900">Appetizers &amp; Chai</h4>
                <p className="text-[11px] text-charcoal-600 leading-snug">
                  Passed hors d&apos;oeuvres, acoustic shehnai or strings, and dedicated elder seating alcoves.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-ivory-100/60 border border-ivory-200 space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-forest-800">
                  Phase 3 · Dining
                </span>
                <h4 className="font-semibold text-xs text-charcoal-900">Feast Banquet</h4>
                <p className="text-[11px] text-charcoal-600 leading-snug">
                  Table escort, dietary counter verification, continuous hot bread service, and live dessert counters.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-ivory-100/60 border border-ivory-200 space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-forest-800">
                  Phase 4 · Departure
                </span>
                <h4 className="font-semibold text-xs text-charcoal-900">Mithai &amp; Keepsake</h4>
                <p className="text-[11px] text-charcoal-600 leading-snug">
                  Personalized handcrafted mithai box, arranged rideshare/valet retrieval, and blessings exchange.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 7. Modal: Add Attendee */}
      {isAddModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-attendee-title"
          className="fixed inset-0 z-50 bg-charcoal-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-ivory-300 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-ivory-200">
              <div>
                <h3 id="add-attendee-title" className="font-serif text-xl font-bold text-charcoal-900">
                  Add Attendee to Roster
                </h3>
                <p className="text-xs text-charcoal-500">
                  Attendee data is stored securely on your local device.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-charcoal-400 hover:text-charcoal-700 text-sm font-semibold p-1"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-terracotta-50 border border-terracotta-200 text-xs text-terracotta-800">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label htmlFor="guest-name" className="block text-xs font-semibold text-charcoal-800 mb-1">
                  Full Name / Party Title *
                </label>
                <input
                  id="guest-name"
                  type="text"
                  required
                  placeholder="e.g. Ananya Mukherjee &amp; Family"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-ivory-50 border border-ivory-300 rounded-xl text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-forest-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="guest-category" className="block text-xs font-semibold text-charcoal-800 mb-1">
                    Relationship Category
                  </label>
                  <select
                    id="guest-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as GuestCategory)}
                    className="w-full px-3 py-2 text-xs bg-ivory-50 border border-ivory-300 rounded-xl text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-forest-700"
                  >
                    <option value="family">Family Elders</option>
                    <option value="bride-side">Bride Side</option>
                    <option value="groom-side">Groom Side</option>
                    <option value="friends">Friends</option>
                    <option value="colleagues">Colleagues</option>
                    <option value="vip">VIP Guests</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="guest-rsvp" className="block text-xs font-semibold text-charcoal-800 mb-1">
                    RSVP Status
                  </label>
                  <select
                    id="guest-rsvp"
                    value={rsvpStatus}
                    onChange={(e) => setRsvpStatus(e.target.value as RsvpStatus)}
                    className="w-full px-3 py-2 text-xs bg-ivory-50 border border-ivory-300 rounded-xl text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-forest-700"
                  >
                    <option value="awaiting">⏳ Awaiting Response</option>
                    <option value="attending">✓ Attending</option>
                    <option value="declined">✕ Declined</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="guest-dietary" className="block text-xs font-semibold text-charcoal-800 mb-1">
                    Dietary Requirements
                  </label>
                  <input
                    id="guest-dietary"
                    type="text"
                    placeholder="e.g. Pure Veg, Jain, Nut Allergy"
                    value={dietaryRequirement}
                    onChange={(e) => setDietaryRequirement(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-ivory-50 border border-ivory-300 rounded-xl text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-forest-700"
                  />
                </div>

                <div>
                  <label htmlFor="guest-table" className="block text-xs font-semibold text-charcoal-800 mb-1">
                    Table / Seating Assignment
                  </label>
                  <input
                    id="guest-table"
                    type="text"
                    placeholder="e.g. Table 2 (Bride Family)"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-ivory-50 border border-ivory-300 rounded-xl text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-forest-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="guest-phone" className="block text-xs font-semibold text-charcoal-800 mb-1">
                    Private Phone (Optional)
                  </label>
                  <input
                    id="guest-phone"
                    type="tel"
                    placeholder="+91 98300 00000"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-ivory-50 border border-ivory-300 rounded-xl text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-forest-700"
                  />
                </div>

                <div>
                  <label htmlFor="guest-plus-ones" className="block text-xs font-semibold text-charcoal-800 mb-1">
                    Additional Plus Ones
                  </label>
                  <input
                    id="guest-plus-ones"
                    type="number"
                    min="0"
                    max="10"
                    value={plusOnes}
                    onChange={(e) => setPlusOnes(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-ivory-50 border border-ivory-300 rounded-xl text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-forest-700"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="guest-notes" className="block text-xs font-semibold text-charcoal-800 mb-1">
                  Hospitality / Seating Notes
                </label>
                <textarea
                  id="guest-notes"
                  rows={2}
                  placeholder="e.g. Senior elder requires step-free seating near ceremonial mandap."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-ivory-50 border border-ivory-300 rounded-xl text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-forest-700"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-ivory-200">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Save Attendee
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
