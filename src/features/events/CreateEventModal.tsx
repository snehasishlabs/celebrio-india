import React, { useState } from 'react'
import {
  X,
  Sparkles,
  Calendar,
  MapPin,
  Users,
  Coins,
  Check,
  Heart,
  Cake,
  GlassWater,
  Building,
} from 'lucide-react'
import { usePlanner } from '@/context/PlannerContext'
import { EventCategory, NewCelebrationInput } from '@/types/event'
import { Button } from '@/components/common/Button'

interface CreateEventModalProps {
  isOpen: boolean
  onClose: () => void
}

const CATEGORY_OPTIONS: { id: EventCategory; label: string; icon: typeof Heart; desc: string }[] = [
  { id: 'wedding', label: 'Wedding', icon: Heart, desc: 'Ceremony & reception celebration' },
  { id: 'birthday', label: 'Birthday', icon: Cake, desc: 'Milestone & social gathering' },
  { id: 'anniversary', label: 'Anniversary', icon: GlassWater, desc: 'Milestone jubilee or renewal' },
  { id: 'community', label: 'Community Event', icon: Building, desc: 'Neighborhood festival or civic gala' },
]

const PRIORITY_OPTIONS = [
  'Culinary & Beverage',
  'Ambiance & Florals',
  'Live Music & Sound',
  'Photography & Media',
  'Guest Comfort & Hospitality',
]

const DIETARY_OPTIONS = [
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Nut-Free',
  'Dairy-Free',
  'Halal',
  'Kosher',
]

const ACCESSIBILITY_OPTIONS = [
  'Wheelchair Accessible',
  'Step-Free Entrance',
  'Quiet Sensory Space',
  'ASL / Hearing Loop',
  'Accessible Restrooms',
]

const THEME_PRESET_SUGGESTIONS = [
  'Botanical Conservatory',
  'Artisan Terracotta Twilight',
  'Vintage Speakeasy Glamour',
  'Modern Minimalist Linen',
  'Golden Hour Vineyard',
]

export const CreateEventModal: React.FC<CreateEventModalProps> = ({ isOpen, onClose }) => {
  const { addEvent, setCurrentSection, setActiveTab } = usePlanner()

  // Default date to 90 days in the future
  const defaultDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]

  // Form State
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<EventCategory>('wedding')
  const [date, setDate] = useState(defaultDate)
  const [city, setCity] = useState('')
  const [venueName, setVenueName] = useState('')
  const [budget, setBudget] = useState('35000')
  const [currency, setCurrency] = useState('USD')
  const [guestCount, setGuestCount] = useState('100')
  const [themePreference, setThemePreference] = useState('')
  const [indoorOutdoor, setIndoorOutdoor] = useState<'indoor' | 'outdoor' | 'hybrid'>('indoor')
  const [dressCode, setDressCode] = useState('Cocktail Attire')
  const [specialNotes, setSpecialNotes] = useState('')

  // Multi-select states
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([
    'Culinary & Beverage',
    'Ambiance & Florals',
  ])
  const [selectedDietary, setSelectedDietary] = useState<string[]>(['Vegetarian', 'Gluten-Free'])
  const [dietaryNotes, setDietaryNotes] = useState('')
  const [selectedAccessibility, setSelectedAccessibility] = useState<string[]>([
    'Wheelchair Accessible',
    'Step-Free Entrance',
  ])
  const [accessibilityNotes, setAccessibilityNotes] = useState('')

  // Validation state
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!title.trim()) {
      newErrors.title = 'Event name is required (e.g. Marcus & Clara’s Wedding).'
    } else if (title.trim().length < 3) {
      newErrors.title = 'Event name must be at least 3 characters long.'
    }

    if (!date) {
      newErrors.date = 'Celebration date is required.'
    }

    if (!city.trim()) {
      newErrors.city = 'Location city is required (e.g. San Francisco, CA).'
    }

    const budgetNum = Number(budget)
    if (!budget || isNaN(budgetNum) || budgetNum < 500) {
      newErrors.budget = 'Please enter a realistic celebration budget (minimum $500).'
    }

    const guestNum = Number(guestCount)
    if (!guestCount || isNaN(guestNum) || guestNum < 1) {
      newErrors.guestCount = 'Guest count must be at least 1.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    validate()
  }

  const toggleItem = (list: string[], item: string, setter: (val: string[]) => void) => {
    if (list.includes(item)) {
      setter(list.filter((i) => i !== item))
    } else {
      setter([...list, item])
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({
      title: true,
      date: true,
      city: true,
      budget: true,
      guestCount: true,
    })

    if (!validate()) return

    setIsSubmitting(true)

    const inputData: NewCelebrationInput = {
      title: title.trim(),
      category,
      date,
      venueName: venueName.trim() || 'Venue TBD',
      city: city.trim(),
      totalBudget: Number(budget),
      currency,
      targetGuestCount: Number(guestCount),
      themePreference: themePreference.trim() || undefined,
      priorities: selectedPriorities,
      dietaryRequirements: selectedDietary,
      dietaryNotes: dietaryNotes.trim() || undefined,
      accessibilityRequirements: selectedAccessibility,
      accessibilityNotes: accessibilityNotes.trim() || undefined,
      indoorOutdoor,
      dressCode: dressCode.trim() || undefined,
      specialNotes: specialNotes.trim() || undefined,
    }

    try {
      addEvent(inputData)
      setIsSubmitting(false)
      onClose()
      // Navigate to the newly created event's overview
      setCurrentSection('events')
      setActiveTab('overview')
    } catch {
      setIsSubmitting(false)
      setErrors({ form: 'An error occurred while saving the celebration plan.' })
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-charcoal-900/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-event-heading"
    >
      <div className="relative w-full max-w-3xl bg-ivory-50 rounded-2xl border border-ivory-300 shadow-modal overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-ivory-300 flex items-center justify-between bg-ivory-100/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-forest-900 text-gold-300 flex items-center justify-center shadow-subtle">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="create-event-heading"
                className="font-serif font-bold text-lg sm:text-xl text-charcoal-900"
              >
                Plan a New Celebration
              </h2>
              <p className="text-xs text-charcoal-500">
                Celebrio generates personalized concepts, adaptive budgets, and synchronized schedules.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-charcoal-500 hover:text-charcoal-800 hover:bg-ivory-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-700"
            aria-label="Close celebration creator dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <form noValidate onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-6 space-y-6 flex-1">
          {errors.form && (
            <div className="p-3.5 rounded-xl bg-terracotta-50 border border-terracotta-300 text-xs text-terracotta-800 font-medium">
              {errors.form}
            </div>
          )}

          {/* Section 1: Event Type */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-2.5">
              1. Celebration Type <span className="text-terracotta-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {CATEGORY_OPTIONS.map((cat) => {
                const Icon = cat.icon
                const isSelected = category === cat.id
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`p-3.5 rounded-xl text-left border transition-all ${
                      isSelected
                        ? 'bg-forest-50 border-forest-600 ring-2 ring-forest-700/20 text-forest-900'
                        : 'bg-ivory-50 border-ivory-300 hover:border-ivory-400 text-charcoal-700'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 mb-2 ${
                        isSelected ? 'text-forest-700' : 'text-charcoal-400'
                      }`}
                    />
                    <div className="font-semibold text-xs text-charcoal-900">{cat.label}</div>
                    <div className="text-[10px] text-charcoal-500 mt-0.5 line-clamp-1">
                      {cat.desc}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Section 2: Core Details */}
          <div className="space-y-4 pt-4 border-t border-ivory-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-700">
              2. Core Event Vitals
            </h3>

            <div>
              <label
                htmlFor="event-title-input"
                className="block text-xs font-semibold text-charcoal-800 mb-1"
              >
                Celebration Name <span className="text-terracotta-500">*</span>
              </label>
              <input
                id="event-title-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => handleBlur('title')}
                placeholder="e.g. Seraphina &amp; Liam's Autumn Conservatory Wedding"
                className={`w-full px-3.5 py-2.5 rounded-xl bg-ivory-50 border text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-forest-700 ${
                  touched.title && errors.title
                    ? 'border-terracotta-400 bg-terracotta-50/30'
                    : 'border-ivory-300'
                }`}
                aria-invalid={touched.title && !!errors.title}
                aria-describedby={touched.title && errors.title ? 'title-error' : undefined}
                required
              />
              {touched.title && errors.title && (
                <p id="title-error" className="text-xs text-terracotta-600 mt-1">
                  {errors.title}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="event-date-input"
                  className="block text-xs font-semibold text-charcoal-800 mb-1 flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5 text-forest-700" />
                  Target Date <span className="text-terracotta-500">*</span>
                </label>
                <input
                  id="event-date-input"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  onBlur={() => handleBlur('date')}
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-ivory-50 border text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-forest-700 ${
                    touched.date && errors.date
                      ? 'border-terracotta-400 bg-terracotta-50/30'
                      : 'border-ivory-300'
                  }`}
                  required
                />
                {touched.date && errors.date && (
                  <p className="text-xs text-terracotta-600 mt-1">{errors.date}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="event-city-input"
                  className="block text-xs font-semibold text-charcoal-800 mb-1 flex items-center gap-1.5"
                >
                  <MapPin className="w-3.5 h-3.5 text-forest-700" />
                  City &amp; Region <span className="text-terracotta-500">*</span>
                </label>
                <input
                  id="event-city-input"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  onBlur={() => handleBlur('city')}
                  placeholder="e.g. San Francisco, CA"
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-ivory-50 border text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-forest-700 ${
                    touched.city && errors.city
                      ? 'border-terracotta-400 bg-terracotta-50/30'
                      : 'border-ivory-300'
                  }`}
                  required
                />
                {touched.city && errors.city && (
                  <p className="text-xs text-terracotta-600 mt-1">{errors.city}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="event-venue-input"
                  className="block text-xs font-semibold text-charcoal-800 mb-1"
                >
                  Venue Name or Style (Optional)
                </label>
                <input
                  id="event-venue-input"
                  type="text"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  placeholder="e.g. Botanical Glasshouse Conservatory"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-ivory-50 border border-ivory-300 text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-forest-700"
                />
              </div>

              <div>
                <label
                  htmlFor="event-indoor-outdoor"
                  className="block text-xs font-semibold text-charcoal-800 mb-1"
                >
                  Setting Environment
                </label>
                <select
                  id="event-indoor-outdoor"
                  value={indoorOutdoor}
                  onChange={(e) =>
                    setIndoorOutdoor(e.target.value as 'indoor' | 'outdoor' | 'hybrid')
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-ivory-50 border border-ivory-300 text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-forest-700"
                >
                  <option value="indoor">Indoor (Climate Controlled)</option>
                  <option value="outdoor">Outdoor (Garden / Lawn / Park)</option>
                  <option value="hybrid">Hybrid (Indoor Hall with Outdoor Terrace)</option>
                </select>
              </div>
            </div>

            {/* Budget & Guests */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label
                  htmlFor="event-budget-input"
                  className="block text-xs font-semibold text-charcoal-800 mb-1 flex items-center gap-1.5"
                >
                  <Coins className="w-3.5 h-3.5 text-forest-700" />
                  Total Budget Cap <span className="text-terracotta-500">*</span>
                </label>
                <div className="flex rounded-xl overflow-hidden border border-ivory-300 focus-within:ring-2 focus-within:ring-forest-700">
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="bg-ivory-200/80 px-3 py-2 text-xs font-bold text-charcoal-800 border-r border-ivory-300 focus:outline-none"
                    aria-label="Currency"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CAD">CAD ($)</option>
                    <option value="AUD">AUD ($)</option>
                  </select>
                  <input
                    id="event-budget-input"
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    onBlur={() => handleBlur('budget')}
                    className="w-full px-3 py-2 bg-ivory-50 text-sm font-semibold text-charcoal-900 focus:outline-none"
                    min="500"
                    step="500"
                    required
                  />
                </div>
                {touched.budget && errors.budget && (
                  <p className="text-xs text-terracotta-600 mt-1">{errors.budget}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="event-guests-input"
                  className="block text-xs font-semibold text-charcoal-800 mb-1 flex items-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5 text-forest-700" />
                  Guest Count <span className="text-terracotta-500">*</span>
                </label>
                <input
                  id="event-guests-input"
                  type="number"
                  value={guestCount}
                  onChange={(e) => setGuestCount(e.target.value)}
                  onBlur={() => handleBlur('guestCount')}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-ivory-50 border border-ivory-300 text-sm font-semibold text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-forest-700"
                  min="1"
                  required
                />
                {touched.guestCount && errors.guestCount && (
                  <p className="text-xs text-terracotta-600 mt-1">{errors.guestCount}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Theme Aesthetic & Priorities */}
          <div className="space-y-4 pt-4 border-t border-ivory-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-700">
              3. Theme Preference &amp; Priorities
            </h3>

            <div>
              <label
                htmlFor="theme-pref-input"
                className="block text-xs font-semibold text-charcoal-800 mb-1"
              >
                Aesthetic Vision / Theme Keywords
              </label>
              <input
                id="theme-pref-input"
                type="text"
                value={themePreference}
                onChange={(e) => setThemePreference(e.target.value)}
                placeholder="e.g. Warm Terracotta Botanicals, Candlelight, Earthy Elegance"
                className="w-full px-3.5 py-2.5 rounded-xl bg-ivory-50 border border-ivory-300 text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-forest-700"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-[11px] text-charcoal-500 mr-1">Quick Suggestions:</span>
                {THEME_PRESET_SUGGESTIONS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setThemePreference(preset)}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-ivory-200 hover:bg-forest-100 hover:text-forest-800 text-charcoal-700 transition-colors"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-800 mb-2">
                Core Planning Priorities (Select all that apply)
              </label>
              <div className="flex flex-wrap gap-2">
                {PRIORITY_OPTIONS.map((priority) => {
                  const isChecked = selectedPriorities.includes(priority)
                  return (
                    <button
                      key={priority}
                      type="button"
                      onClick={() =>
                        toggleItem(selectedPriorities, priority, setSelectedPriorities)
                      }
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all ${
                        isChecked
                          ? 'bg-forest-100 text-forest-900 border-forest-300 font-semibold'
                          : 'bg-ivory-50 text-charcoal-700 border-ivory-300 hover:border-ivory-400'
                      }`}
                    >
                      {isChecked && <Check className="w-3.5 h-3.5 text-forest-700" />}
                      <span>{priority}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Section 4: Dietary & Accessibility Accommodations */}
          <div className="space-y-4 pt-4 border-t border-ivory-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-700">
              4. Hospitality, Dietary &amp; Accessibility Accommodations
            </h3>

            <div>
              <label className="block text-xs font-semibold text-charcoal-800 mb-2">
                Dietary Requirements
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {DIETARY_OPTIONS.map((diet) => {
                  const isChecked = selectedDietary.includes(diet)
                  return (
                    <button
                      key={diet}
                      type="button"
                      onClick={() => toggleItem(selectedDietary, diet, setSelectedDietary)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all ${
                        isChecked
                          ? 'bg-terracotta-100 text-terracotta-900 border-terracotta-300 font-semibold'
                          : 'bg-ivory-50 text-charcoal-700 border-ivory-300 hover:border-ivory-400'
                      }`}
                    >
                      {isChecked && <Check className="w-3.5 h-3.5 text-terracotta-700" />}
                      <span>{diet}</span>
                    </button>
                  )
                })}
              </div>
              <input
                type="text"
                value={dietaryNotes}
                onChange={(e) => setDietaryNotes(e.target.value)}
                placeholder="Specific dietary notes (e.g. 2 guests with severe nut allergies)"
                className="w-full px-3 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-xs text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-forest-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-800 mb-2">
                Accessibility Requirements
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {ACCESSIBILITY_OPTIONS.map((acc) => {
                  const isChecked = selectedAccessibility.includes(acc)
                  return (
                    <button
                      key={acc}
                      type="button"
                      onClick={() =>
                        toggleItem(selectedAccessibility, acc, setSelectedAccessibility)
                      }
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all ${
                        isChecked
                          ? 'bg-gold-100 text-gold-900 border-gold-300 font-semibold'
                          : 'bg-ivory-50 text-charcoal-700 border-ivory-300 hover:border-ivory-400'
                      }`}
                    >
                      {isChecked && <Check className="w-3.5 h-3.5 text-gold-700" />}
                      <span>{acc}</span>
                    </button>
                  )
                })}
              </div>
              <input
                type="text"
                value={accessibilityNotes}
                onChange={(e) => setAccessibilityNotes(e.target.value)}
                placeholder="Specific mobility or sensory accommodations (e.g. front row wheelchair spacing)"
                className="w-full px-3 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-xs text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-forest-700"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="dress-code-input"
                  className="block text-xs font-semibold text-charcoal-800 mb-1"
                >
                  Dress Code Recommendation
                </label>
                <input
                  id="dress-code-input"
                  type="text"
                  value={dressCode}
                  onChange={(e) => setDressCode(e.target.value)}
                  placeholder="e.g. Black Tie, Garden Cocktail, Festive Casual"
                  className="w-full px-3 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-xs text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-forest-700"
                />
              </div>

              <div>
                <label
                  htmlFor="special-notes-input"
                  className="block text-xs font-semibold text-charcoal-800 mb-1"
                >
                  Special Notes or Timing Restrictions
                </label>
                <input
                  id="special-notes-input"
                  type="text"
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  placeholder="e.g. Venue sound curfew at 23:00"
                  className="w-full px-3 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-xs text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-forest-700"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-ivory-300 flex items-center justify-between gap-3 shrink-0">
            <span className="text-[11px] text-charcoal-500">
              Personalized themes &amp; budget framework generated immediately.
            </span>
            <div className="flex items-center gap-2.5">
              <Button type="button" variant="secondary" size="md" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                leftIcon={<Sparkles className="w-4 h-4 text-gold-300" />}
              >
                Create Celebration Plan
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
