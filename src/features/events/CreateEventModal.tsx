import React, { useState, useEffect } from 'react'
import {
  X,
  Sparkles,
  Coins,
  Check,
  Heart,
  Cake,
  GlassWater,
  Building,
  Flower2,
  ChevronRight,
  ChevronLeft,
  Utensils,
  Accessibility,
  CheckCircle2,
  Calendar,
  Clock,
  Globe,
  Plus,
  Shield,
} from 'lucide-react'
import { usePlanner } from '@/context/PlannerContext'
import { EventCategory, NewCelebrationInput, CulturalPreferences } from '@/types/event'
import { Button } from '@/components/common/Button'
import { addDays, formatDateIso } from '@/utils/timelineEngine'
import { INDIAN_EVENT_TEMPLATES } from '@/constants/indianEventTemplates'
import { LotusMotif, DiyaLampMotif } from '@/components/common/IndianMotifs'

interface CreateEventModalProps {
  isOpen: boolean
  onClose: () => void
}

const CATEGORY_OPTIONS: { id: EventCategory; label: string; icon: typeof Heart; desc: string }[] = [
  { id: 'wedding', label: 'Wedding', icon: Heart, desc: 'Multi-day ceremonial or contemporary wedding' },
  { id: 'birthday', label: 'Birthday', icon: Cake, desc: 'Milestone jubilee, 1st birthday, or gala' },
  { id: 'anniversary', label: 'Anniversary', icon: GlassWater, desc: 'Silver/golden jubilee or renewal of vows' },
  { id: 'community', label: 'Community Event', icon: Building, desc: 'Durga Puja, Diwali festival, or neighborhood gala' },
]

const REGIONAL_TRADITIONS = [
  { id: 'bengali', label: 'Bengali (Biye & Gaye Holud)', desc: 'Alpona, Rajnigandha florals, Bou Bhat feast & Dhak', templateId: 'bengali-wedding' },
  { id: 'punjabi', label: 'Punjabi (Sangeet & Anand Karaj)', desc: 'High-energy dhol, Phulkari marigold mandap & Awadhi feast', templateId: 'punjabi-wedding' },
  { id: 'south-indian', label: 'South Indian (Muhurtham)', desc: 'Jasmine garlands, Kuthuvilakku lamps & Elai Saapadu', templateId: 'south-indian-wedding' },
  { id: 'maharashtrian', label: 'Maharashtrian (Lagnasohala)', desc: 'Paithani silks, Mundavalya pearls, Mangalashtak & Puran Poli', templateId: 'maharashtrian-wedding' },
  { id: 'gujarati', label: 'Gujarati (Garba & Lagan)', desc: 'Mirror-work canopies, Dandiya night & live Farsan banquet', templateId: 'gujarati-wedding' },
  { id: 'durga-puja', label: 'Durga Puja (Sharodotsav)', desc: 'Architectural pandal, Dhunuchi dance, Maha Bhog & Bisorjon', templateId: 'durga-puja' },
  { id: 'diwali', label: 'Diwali (Festival of Lights)', desc: 'Handcrafted diyas, floating Urlis, Lakshmi Puja & mithai hampers', templateId: 'diwali-gala' },
  { id: 'eid', label: 'Eid Gathering (Eid Milan)', desc: 'Dum Biryani, fragrant attar, Sheer Khurma & Eidi blessing', templateId: 'eid-gathering' },
  { id: 'onam', label: 'Onam (Thiruvonam & Sadya)', desc: 'Athapookalam floral carpet, 26-dish Onasadya & Chenda Melam', templateId: 'onam-celebration' },
  { id: 'griha-pravesh', label: 'Housewarming (Griha Pravesh)', desc: 'Vastu puja, sacred milk boiling (Doodh Ubalna) & feast', templateId: 'griha-pravesh' },
  { id: 'contemporary', label: 'Contemporary / Fusion', desc: 'Indo-Western rooftop lounge, acoustic fusion & tapas', templateId: 'contemporary-fusion' },
  { id: 'pan-indian', label: 'Pan-Indian Classic', desc: 'Harmonious blend of contemporary & traditional rituals', templateId: 'contemporary-fusion' },
]

const DEFAULT_CEREMONIES_BY_TRADITION: Record<string, string[]> = {
  bengali: [
    'Aiburobhat (Bachelor Feast)',
    'Gaye Holud (Turmeric Ceremony)',
    'Saat Paake Ghaura & Subho Drishti',
    'Sindoor Daan',
    'Bou Bhaat (Reception Feast)',
  ],
  punjabi: [
    'Mehndi & Chooda Ceremony',
    'High-Energy Sangeet & Jaggo Night',
    'Baraat Procession & Milni',
    'Anand Karaj / Vedic Phere',
    'Grand Reception Banquet',
  ],
  'south-indian': [
    'Vratham & Sumangali Prarthanai',
    'Nichayathartham (Engagement Blessing)',
    'Oonjal (Swing Ritual) & Nadaswaram',
    'Kanyadanam & Mangalya Dharanam',
    'Kalyana Elai Saapadu Feast',
  ],
  maharashtrian: [
    'Sakharpuda & Kelvan',
    'Halad Chadavane',
    'Antarpat & Mangalashtak Recitation',
    'Kanyadaan & Saptapadi',
    'Traditional Pangat Feast (Puran Poli)',
  ],
  gujarati: [
    'Mandva Mahurat & Mameru',
    'Garba & Dandiya Raas Night',
    'Ponkhana & Jaan Welcome',
    'Hasta Melap & Mangal Pheras',
    'Live Farsan Banquet',
  ],
  'durga-puja': [
    'Maha Sasthi (Bodhon)',
    'Maha Saptami (Kola Bou Snan)',
    'Maha Ashtami & Sandhi Puja (108 Lotuses)',
    'Maha Nabami (Dhunuchi Naach)',
    'Bijoya Dashami (Sindoor Khela & Bisorjon)',
  ],
  diwali: [
    'Chandan Tilak & Rosewater Welcome',
    'Traditional Rangoli & 108 Diya Lighting',
    'Lakshmi-Ganesh Puja & Aarti',
    'Gourmet Festive Feast & Mithai Lounge',
  ],
  eid: [
    'Eid Welcoming with Ittar & Rose Water',
    'Eidi Blessing Distribution',
    'Royal Dastarkhwan Dum Biryani Feast',
    'Evening Mehfil-e-Ghazal',
  ],
  onam: [
    'Dawn Athapookalam Floral Assembly',
    'Chenda Melam Percussion Welcome',
    'Thiruvathirakali Dance',
    'The 26-Dish Grand Onasadya Feast',
  ],
  'griha-pravesh': [
    'Auspicious Entry (Shubh Muhurat)',
    'Vastu Shanti Puja & Navagraha Havan',
    'Doodh Ubalna (Milk Boiling Blessing)',
    'Threshold Toran Blessing & Family Bhojan',
  ],
  contemporary: [
    'Welcome Cocktails & Grazing Tables',
    'Personalized Vow Exchange & Rings',
    'Sunset Champagne Toast',
    'Progressive Tasting Banquet',
    'Live Indie-Fusion Band & Afterparty',
  ],
  'pan-indian': [
    'Haldi / Gaye Holud',
    'Sangeet & Musical Night',
    'Pheras / Muhurtham Ceremony',
    'Grand Reception Banquet',
  ],
}

const PRIORITY_OPTIONS = [
  'Culinary Excellence & Live Counters',
  'Mandap & Floral Architecture',
  'Live Music, DJ & Dhol Artists',
  'Cinematic Photography & Film',
  'Guest Hospitality & Elder Comfort',
  'Artisan Invitations & Favors',
]

const DIETARY_OPTIONS = [
  'Vegetarian',
  'Pure Vegetarian (No Onion/Garlic)',
  'Jain Specialty Menu',
  'Traditional Banana Leaf (Elai Saapadu)',
  'Halal Menu',
  'Vegan',
  'Gluten-Free',
  'Nut-Free',
]

const ACCESSIBILITY_OPTIONS = [
  'Wheelchair Accessible',
  'Step-Free Entrance',
  'Wheelchair Ramp to Mandap / Stage',
  'Golf Cart Transit for Elders',
  'Quiet Sensory Zone for Seniors',
  'Accessible Restrooms',
]

const THEME_PRESET_SUGGESTIONS = [
  'Royal Rajputana Heritage & Marigold',
  'Jasmine & Antique Brass Temple Elegance',
  'Alpona White & Terracotta Twilight',
  'Chikankari Ivory & Botanical Pastels',
  'Mirror-Work Garba & Sunset Gold',
  'Contemporary Indo-Western Rooftop',
]

const INDIAN_CITIES = [
  'Mumbai',
  'Delhi-NCR',
  'Bengaluru',
  'Kolkata',
  'Jaipur',
  'Chennai',
  'Hyderabad',
  'Udaipur',
  'Pune',
  'Goa',
  'Ahmedabad',
  'Lucknow',
]

const INDIAN_LANGUAGES = [
  'English',
  'Bengali',
  'Hindi',
  'Punjabi',
  'Tamil',
  'Telugu',
  'Marathi',
  'Gujarati',
  'Malayalam',
  'Urdu',
  'Kannada',
  'Odia',
  'Assamese',
]

const AUSPICIOUS_TIMINGS = [
  { id: 'brahma-muhurta', label: 'Brahma Muhurta (Dawn 4:30 AM – 7:00 AM)', desc: 'Traditional South Indian & Vedic dawn rituals' },
  { id: 'godhuli-lagna', label: 'Godhuli Lagna (Twilight Sunset)', desc: 'Traditional Bengali & North Indian sunset ceremonies' },
  { id: 'pradosh-kaal', label: 'Pradosh Kaal (Evening Twilight)', desc: 'Auspicious evening Lakshmi Puja & festivals' },
  { id: 'mid-morning', label: 'Mid-Morning Shubh Muhurat (9:30 AM – 12:00 PM)', desc: 'Lagnasohala, Anand Karaj & Griha Pravesh' },
  { id: 'flexible-secular', label: 'Flexible / Secular Schedule', desc: 'No astrological timing restrictions' },
]

const WIZARD_STEPS = [
  { step: 1, label: 'Celebration Type' },
  { step: 2, label: 'Location & Dates' },
  { step: 3, label: 'Traditions & Rituals' },
  { step: 4, label: 'Budget & Guests' },
  { step: 5, label: 'Food & Access' },
  { step: 6, label: 'Theme & Review' },
]

export const CreateEventModal: React.FC<CreateEventModalProps> = ({ isOpen, onClose }) => {
  const { addEvent, setCurrentSection, setActiveTab } = usePlanner()

  // Wizard Navigation
  const [currentStep, setCurrentStep] = useState(1)

  // Form State
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<EventCategory>('wedding')
  const [date, setDate] = useState(() => addDays(formatDateIso(new Date()), 90))
  const [city, setCity] = useState('')
  const [venueName, setVenueName] = useState('')
  const [budget, setBudget] = useState('3500000') // 35 Lakhs default
  const [currency, setCurrency] = useState('INR')
  const [guestCount, setGuestCount] = useState('250')
  const [themePreference, setThemePreference] = useState('')
  const [indoorOutdoor, setIndoorOutdoor] = useState<'indoor' | 'outdoor' | 'hybrid'>('hybrid')
  const [dressCode, setDressCode] = useState('Traditional Festive / Indo-Western')
  const [specialNotes, setSpecialNotes] = useState('')

  // Cultural Preferences State
  const [selectedTradition, setSelectedTradition] = useState('pan-indian')
  const [isSecularOnly, setIsSecularOnly] = useState(false)
  const [preferredLanguage, setPreferredLanguage] = useState('English')
  const [ceremonyScheduleType, setCeremonyScheduleType] = useState<'single-day' | 'multi-day-2' | 'multi-day-3' | 'multi-day-4' | 'custom'>('multi-day-3')
  const [auspiciousTiming, setAuspiciousTiming] = useState('Godhuli Lagna (Twilight Sunset)')
  const [foodTradition, setFoodTradition] = useState('Pan-Indian Culinary Feast')
  const [decorStyle, setDecorStyle] = useState('Royal Marigold & Antique Brass')
  const [musicVibe, setMusicVibe] = useState('Live Shehnai, Dhol & Acoustic Sangeet')
  const [customCeremonyInput, setCustomCeremonyInput] = useState('')
  const [selectedCeremonies, setSelectedCeremonies] = useState<string[]>([
    'Haldi / Gaye Holud',
    'Sangeet & Musical Night',
    'Pheras / Muhurtham Ceremony',
    'Grand Reception Banquet',
  ])

  // Multi-select states
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([
    'Culinary Excellence & Live Counters',
    'Mandap & Floral Architecture',
  ])
  const [selectedDietary, setSelectedDietary] = useState<string[]>([
    'Vegetarian',
    'Pure Vegetarian (No Onion/Garlic)',
  ])
  const [dietaryNotes, setDietaryNotes] = useState('')
  const [selectedAccessibility, setSelectedAccessibility] = useState<string[]>([
    'Wheelchair Accessible',
    'Golf Cart Transit for Elders',
  ])
  const [accessibilityNotes, setAccessibilityNotes] = useState('')

  // Validation state
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Keyboard Escape listener
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSelectTradition = (tradId: string) => {
    setSelectedTradition(tradId)
    setIsSecularOnly(tradId === 'contemporary')

    // Look up template defaults if available
    const matchedTemplate = INDIAN_EVENT_TEMPLATES.find((t) => t.id === tradId || t.id.startsWith(tradId))
    if (matchedTemplate) {
      if (matchedTemplate.culturalPreferences.selectedCeremonies) {
        setSelectedCeremonies(matchedTemplate.culturalPreferences.selectedCeremonies)
      }
      if (matchedTemplate.culturalPreferences.foodTradition) {
        setFoodTradition(matchedTemplate.culturalPreferences.foodTradition)
      }
      if (matchedTemplate.culturalPreferences.decorStyle) {
        setDecorStyle(matchedTemplate.culturalPreferences.decorStyle)
      }
      if (matchedTemplate.culturalPreferences.musicAndVibe) {
        setMusicVibe(matchedTemplate.culturalPreferences.musicAndVibe)
      }
      if (matchedTemplate.culturalPreferences.preferredLanguage) {
        setPreferredLanguage(matchedTemplate.culturalPreferences.preferredLanguage)
      }
      if (matchedTemplate.culturalPreferences.auspiciousTimingPreference) {
        setAuspiciousTiming(matchedTemplate.culturalPreferences.auspiciousTimingPreference)
      }
      if (matchedTemplate.culturalPreferences.ceremonyScheduleType) {
        setCeremonyScheduleType(matchedTemplate.culturalPreferences.ceremonyScheduleType)
      }
      if (!themePreference) {
        setThemePreference(matchedTemplate.decorThemes[0] || `${matchedTemplate.name} Styling`)
      }
    } else if (DEFAULT_CEREMONIES_BY_TRADITION[tradId]) {
      setSelectedCeremonies(DEFAULT_CEREMONIES_BY_TRADITION[tradId])
    }
  }

  const handleAddCustomCeremony = () => {
    if (!customCeremonyInput.trim()) return
    if (!selectedCeremonies.includes(customCeremonyInput.trim())) {
      setSelectedCeremonies([...selectedCeremonies, customCeremonyInput.trim()])
    }
    setCustomCeremonyInput('')
  }

  const handleSkipCulturalQuestions = () => {
    setIsSecularOnly(true)
    setSelectedTradition('contemporary')
    setSelectedCeremonies([
      'Welcome Gathering & Cocktail Hour',
      'Personal Vow Exchange & Ring Ceremony',
      'Celebratory Banquet & Toasts',
      'Evening Dance & Celebration',
    ])
    setFoodTradition('Contemporary Indo-Global Fusion')
    setMusicVibe('Acoustic Indie & Global Lounge')
    setDecorStyle('Botanical Minimalist & Fairy Lights')
    setAuspiciousTiming('Flexible / Secular Schedule')
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!title.trim()) {
      newErrors.title = 'Event name is required (e.g. Aarav & Meera’s Royal Wedding).'
    } else if (title.trim().length < 3) {
      newErrors.title = 'Event name must be at least 3 characters long.'
    }

    if (!date) {
      newErrors.date = 'Celebration date is required.'
    }

    if (!city.trim()) {
      newErrors.city = 'Location city is required (e.g. Jaipur, Mumbai, Kolkata).'
    }

    const budgetNum = Number(budget)
    if (!budget || isNaN(budgetNum) || budgetNum < 500) {
      newErrors.budget = 'Please enter a realistic celebration budget.'
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

  const handleNextStep = () => {
    if (currentStep === 2) {
      // Validate location & dates before advancing
      setTouched((prev) => ({ ...prev, title: true, city: true, date: true }))
      if (!title.trim() || !city.trim() || !date) {
        validate()
        return
      }
    }
    if (currentStep < 6) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
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

    if (!validate()) {
      // If title or city missing, jump to step 2 to guide the user
      if (!title.trim() || !city.trim()) {
        setCurrentStep(2)
      }
      return
    }

    setIsSubmitting(true)

    const culturalPrefs: CulturalPreferences = {
      traditionId: selectedTradition,
      regionOrState: city.trim(),
      preferredLanguage,
      ceremonyScheduleType,
      selectedCeremonies,
      auspiciousTimingPreference: auspiciousTiming,
      foodTradition,
      musicAndVibe: musicVibe,
      decorStyle,
      isReligiousOrCultural: !isSecularOnly,
      guestHospitalityNotes: specialNotes || undefined,
    }

    const inputData: NewCelebrationInput = {
      title: title.trim(),
      category,
      date,
      venueName: venueName.trim() || 'Heritage Venue TBD',
      city: city.trim(),
      totalBudget: Number(budget),
      currency,
      targetGuestCount: Number(guestCount),
      themePreference: themePreference.trim() || `${selectedTradition.replace('-', ' ')} celebration`,
      priorities: selectedPriorities,
      dietaryRequirements: selectedDietary,
      dietaryNotes: dietaryNotes.trim() || undefined,
      accessibilityRequirements: selectedAccessibility,
      accessibilityNotes: accessibilityNotes.trim() || undefined,
      indoorOutdoor,
      dressCode,
      specialNotes: `Tradition: ${selectedTradition}. Language: ${preferredLanguage}. Timing: ${auspiciousTiming}. Ceremonies: ${selectedCeremonies.join(', ')}. ${specialNotes}`.trim(),
      culturalPreferences: culturalPrefs,
    }

    try {
      addEvent(inputData)
      setIsSubmitting(false)
      onClose()
      setCurrentSection('events')
      setActiveTab('overview')
    } catch {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="wizard-title"
      className="fixed inset-0 z-50 bg-charcoal-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
    >
      <div className="w-full max-w-2xl bg-ivory-50 rounded-2xl shadow-modal border border-ivory-300 max-h-[92vh] flex flex-col overflow-hidden relative">
        {/* Subtle decorative Jaali background watermark */}
        <div
          className="absolute inset-0 opacity-[0.025] pointer-events-none pattern-jaali"
          aria-hidden="true"
        />

        {/* Wizard Header */}
        <div className="p-4 sm:p-5 border-b border-ivory-300 bg-gradient-to-r from-ivory-100 to-ivory-50 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-forest-900 text-gold-300 flex items-center justify-center shadow-subtle">
              <LotusMotif size={20} className="text-gold-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="wizard-title" className="font-serif font-bold text-lg text-charcoal-900">
                  Plan a New Celebration
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-forest-100 text-forest-800 border border-forest-200">
                  Celebrio India
                </span>
              </div>
              <p className="text-xs text-charcoal-500 mt-0.5">
                Step {currentStep} of 6 — {WIZARD_STEPS[currentStep - 1].label}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-xs text-charcoal-500 hover:text-charcoal-900 p-1.5 rounded-lg hover:bg-ivory-200 transition-colors"
            aria-label="Close celebration planner wizard"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar & Step Navigation Pills */}
        <div className="px-5 py-2.5 bg-ivory-100/70 border-b border-ivory-200 relative z-10">
          <div className="w-full bg-ivory-300 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-forest-700 h-full transition-all duration-300 rounded-full"
              style={{ width: `${(currentStep / 6) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between gap-1 mt-2.5 overflow-x-auto scrollbar-none">
            {WIZARD_STEPS.map((s) => (
              <button
                key={s.step}
                type="button"
                onClick={() => setCurrentStep(s.step)}
                className={`text-[11px] font-semibold px-2 py-1 rounded-lg transition-colors whitespace-nowrap ${
                  currentStep === s.step
                    ? 'bg-forest-900 text-gold-300 shadow-2xs'
                    : currentStep > s.step
                    ? 'text-forest-800 hover:bg-ivory-200'
                    : 'text-charcoal-400 hover:text-charcoal-600'
                }`}
              >
                {s.step}. {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 relative z-10">
          {/* STEP 1: Celebration Category */}
          <div className={currentStep === 1 ? 'space-y-4 animate-in fade-in duration-150' : 'hidden'}>
            <div>
              <h3 className="font-serif font-bold text-base text-charcoal-900">
                Select Celebration Type
              </h3>
              <p className="text-xs text-charcoal-600 mt-0.5">
                Choose the archetype that best matches your upcoming celebration.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CATEGORY_OPTIONS.map((cat) => {
                const Icon = cat.icon
                const isSelected = category === cat.id
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`p-4 rounded-xl border text-left transition-all duration-150 flex items-start gap-3.5 ${
                      isSelected
                        ? 'border-forest-700 bg-forest-50/80 ring-2 ring-forest-700/20 shadow-subtle'
                        : 'border-ivory-300 hover:border-ivory-400 bg-white hover:bg-ivory-50/50'
                    }`}
                  >
                    <div
                      className={`p-2.5 rounded-lg shrink-0 ${
                        isSelected ? 'bg-forest-900 text-gold-300' : 'bg-ivory-100 text-charcoal-600'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-charcoal-900">
                        {cat.label}
                      </div>
                      <div className="text-[11px] text-charcoal-500 mt-0.5 leading-snug">
                        {cat.desc}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="p-3.5 rounded-xl bg-ivory-100/90 border border-ivory-300 text-xs text-charcoal-700 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-gold-600 shrink-0" />
                <span>
                  Celebrio adapts budgets, milestones, and supplier checklists dynamically.
                </span>
              </div>
              <button
                type="button"
                onClick={handleSkipCulturalQuestions}
                className="text-[11px] font-semibold text-terracotta-700 hover:underline shrink-0"
              >
                Plan Secular / Contemporary &rarr;
              </button>
            </div>
          </div>

          {/* STEP 2: Location & Dates */}
          <div className={currentStep === 2 ? 'space-y-4 animate-in fade-in duration-150' : 'hidden'}>
            <div>
              <h3 className="font-serif font-bold text-base text-charcoal-900">
                Celebration Name &amp; Destination
              </h3>
              <p className="text-xs text-charcoal-600 mt-0.5">
                Give your celebration a title and specify the location and date.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label htmlFor="wizard-title" className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Celebration Name *
                </label>
                <input
                  id="wizard-title"
                  aria-label="Celebration Name"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => handleBlur('title')}
                  placeholder="e.g. Aarav & Meera's Royal Wedding, Diya's 1st Birthday"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-ivory-300 bg-white focus:outline-none focus:ring-2 focus:ring-forest-700"
                />
                {touched.title && errors.title && (
                  <span className="text-[11px] text-rose-700 mt-1 block font-medium">
                    {errors.title}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="wizard-city" className="block text-xs font-semibold text-charcoal-700 mb-1">
                    City &amp; Region *
                  </label>
                  <input
                    id="wizard-city"
                    aria-label="City & Region"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    onBlur={() => handleBlur('city')}
                    placeholder="e.g. Jaipur, Mumbai, Kolkata"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-ivory-300 bg-white focus:outline-none focus:ring-2 focus:ring-forest-700"
                  />
                  {touched.city && errors.city && (
                    <span className="text-[11px] text-rose-700 mt-1 block font-medium">
                      {errors.city}
                    </span>
                  )}

                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {INDIAN_CITIES.slice(0, 6).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCity(c)}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-ivory-100 hover:bg-ivory-200 text-charcoal-600 border border-ivory-200"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="wizard-venue" className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Venue Name (Optional)
                  </label>
                  <input
                    id="wizard-venue"
                    type="text"
                    value={venueName}
                    onChange={(e) => setVenueName(e.target.value)}
                    placeholder="e.g. Jai Mahal Palace, Grand Ballroom"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-ivory-300 bg-white focus:outline-none focus:ring-2 focus:ring-forest-700"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="wizard-date" className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Celebration Date *
                </label>
                <input
                  id="wizard-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  onBlur={() => handleBlur('date')}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-ivory-300 bg-white focus:outline-none focus:ring-2 focus:ring-forest-700"
                />
                <span className="text-[11px] text-charcoal-500 mt-1 block">
                  Critical-path milestone deadlines adapt automatically based on this target date.
                </span>
              </div>
            </div>
          </div>

          {/* STEP 3: Regional Traditions & Cultural Preferences */}
          <div className={currentStep === 3 ? 'space-y-4 animate-in fade-in duration-150' : 'hidden'}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-serif font-bold text-base text-charcoal-900 flex items-center gap-2">
                  <Flower2 className="w-4 h-4 text-forest-700" />
                  Cultural Traditions &amp; Ceremonies
                </h3>
                <p className="text-xs text-charcoal-600 mt-0.5">
                  Tailor regional rituals, preferred language, and ceremony schedules.
                </p>
              </div>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleSkipCulturalQuestions}
                className="text-[11px] py-1 shrink-0"
              >
                Skip / Secular Mode
              </Button>
            </div>

            {/* Cultural Disclaimer Banner */}
            <div className="p-3 rounded-xl bg-forest-50/80 border border-forest-200/80 text-[11px] text-forest-900 flex items-start gap-2 leading-relaxed">
              <Shield className="w-4 h-4 text-forest-700 shrink-0 mt-0.5" />
              <div>
                <strong>Culturally Intelligent &amp; Adaptable:</strong> Cultural suggestions are flexible starting points based on your preferences—never universal or assumed. Feel free to modify, uncheck, or add any ritual to match your family customs.
              </div>
            </div>

            {/* Cultural Archetype Selector */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-charcoal-700 block">
                Regional Heritage or Celebration Archetype:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {REGIONAL_TRADITIONS.map((trad) => {
                  const isSelected = selectedTradition === trad.id
                  return (
                    <button
                      key={trad.id}
                      type="button"
                      onClick={() => handleSelectTradition(trad.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-forest-700 bg-forest-50/80 ring-1 ring-forest-700 shadow-2xs'
                          : 'border-ivory-300 bg-white hover:bg-ivory-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-charcoal-900">
                          {trad.label}
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-forest-700" />}
                      </div>
                      <div className="text-[10.5px] text-charcoal-500 mt-0.5 leading-snug">
                        {trad.desc}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Language & Muhurat Timing Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-ivory-200">
              <div>
                <label htmlFor="wizard-language" className="block text-xs font-semibold text-charcoal-700 mb-1 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-forest-700" />
                  Preferred Language
                </label>
                <select
                  id="wizard-language"
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-ivory-300 bg-white focus:outline-none focus:ring-2 focus:ring-forest-700"
                >
                  {INDIAN_LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="wizard-schedule-type" className="block text-xs font-semibold text-charcoal-700 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-forest-700" />
                  Ceremony Schedule
                </label>
                <select
                  id="wizard-schedule-type"
                  value={ceremonyScheduleType}
                  onChange={(e) => setCeremonyScheduleType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-ivory-300 bg-white focus:outline-none focus:ring-2 focus:ring-forest-700"
                >
                  <option value="single-day">Single Day (Intensive / Reception)</option>
                  <option value="multi-day-2">2 Days (Pre-ceremony + Main Day)</option>
                  <option value="multi-day-3">3 Days (Traditional Multi-Function)</option>
                  <option value="multi-day-4">4+ Days (Grand Ceremonial Sprint)</option>
                  <option value="custom">Custom Schedule</option>
                </select>
              </div>
            </div>

            {/* Auspicious Timing Preference */}
            <div>
              <label htmlFor="wizard-timing" className="block text-xs font-semibold text-charcoal-700 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-forest-700" />
                Auspicious Timing / Shubh Muhurat Preference
              </label>
              <select
                id="wizard-timing"
                value={auspiciousTiming}
                onChange={(e) => setAuspiciousTiming(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-ivory-300 bg-white focus:outline-none focus:ring-2 focus:ring-forest-700"
              >
                {AUSPICIOUS_TIMINGS.map((tm) => (
                  <option key={tm.id} value={tm.label}>{tm.label}</option>
                ))}
              </select>
            </div>

            {/* Interactive Ceremony Checklist */}
            <div className="space-y-2 pt-2 border-t border-ivory-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-charcoal-700 block">
                  Select Ceremonies &amp; Functions ({selectedCeremonies.length} selected):
                </span>
                <span className="text-[10px] text-charcoal-500">
                  Click to include or remove
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {selectedCeremonies.map((ceremony) => (
                  <button
                    key={ceremony}
                    type="button"
                    onClick={() => toggleItem(selectedCeremonies, ceremony, setSelectedCeremonies)}
                    className="px-3 py-2 rounded-xl text-xs font-medium text-left border flex items-center justify-between bg-forest-100 text-forest-900 border-forest-300 hover:bg-forest-200/70 transition-colors"
                  >
                    <span className="truncate mr-2">{ceremony}</span>
                    <Check className="w-3.5 h-3.5 text-forest-700 shrink-0" />
                  </button>
                ))}
              </div>

              {/* Add Custom Family Ritual */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={customCeremonyInput}
                  onChange={(e) => setCustomCeremonyInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddCustomCeremony()
                    }
                  }}
                  placeholder="Add a family-specific ritual (e.g. Sangeet Antakshari, Pidi Dance)"
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-ivory-300 bg-white focus:outline-none focus:ring-1 focus:ring-forest-700"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleAddCustomCeremony}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  className="text-xs py-1.5"
                >
                  Add
                </Button>
              </div>
            </div>
          </div>

          {/* STEP 4: Budget & Guest Count */}
          <div className={currentStep === 4 ? 'space-y-4 animate-in fade-in duration-150' : 'hidden'}>
            <div>
              <h3 className="font-serif font-bold text-base text-charcoal-900">
                Guest Count &amp; Spending Cap
              </h3>
              <p className="text-xs text-charcoal-600 mt-0.5">
                Deterministic financial calculations will protect your contingency reserve.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="wizard-guests" className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Guest Count *
                </label>
                <input
                  id="wizard-guests"
                  aria-label="Guest Count"
                  type="number"
                  min="1"
                  max="10000"
                  value={guestCount}
                  onChange={(e) => setGuestCount(e.target.value)}
                  onBlur={() => handleBlur('guestCount')}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-ivory-300 bg-white focus:outline-none focus:ring-2 focus:ring-forest-700"
                />
                <div className="flex gap-1.5 mt-1.5">
                  {[100, 250, 500, 1000].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setGuestCount(String(count))}
                      className="text-[10px] px-2 py-0.5 rounded bg-ivory-100 hover:bg-ivory-200 text-charcoal-600 border border-ivory-200"
                    >
                      {count} guests
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="wizard-budget" className="text-xs font-semibold text-charcoal-700">
                    Total Budget Cap *
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="text-[11px] font-bold px-1.5 py-0.5 rounded border border-ivory-300 bg-white text-forest-900"
                  >
                    <option value="INR">₹ INR</option>
                    <option value="USD">$ USD</option>
                    <option value="EUR">€ EUR</option>
                    <option value="GBP">£ GBP</option>
                    <option value="AED">AED</option>
                  </select>
                </div>
                <input
                  id="wizard-budget"
                  aria-label="Total Budget Cap"
                  type="number"
                  min="500"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  onBlur={() => handleBlur('budget')}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-ivory-300 bg-white focus:outline-none focus:ring-2 focus:ring-forest-700"
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {currency === 'INR' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setBudget('1500000')}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-ivory-100 hover:bg-ivory-200 text-charcoal-600 border border-ivory-200"
                      >
                        ₹15 Lakhs
                      </button>
                      <button
                        type="button"
                        onClick={() => setBudget('3500000')}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-ivory-100 hover:bg-ivory-200 text-charcoal-600 border border-ivory-200"
                      >
                        ₹35 Lakhs
                      </button>
                      <button
                        type="button"
                        onClick={() => setBudget('6000000')}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-ivory-100 hover:bg-ivory-200 text-charcoal-600 border border-ivory-200"
                      >
                        ₹60 Lakhs
                      </button>
                      <button
                        type="button"
                        onClick={() => setBudget('12000000')}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-ivory-100 hover:bg-ivory-200 text-charcoal-600 border border-ivory-200"
                      >
                        ₹1.20 Cr
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setBudget('25000')}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-ivory-100 hover:bg-ivory-200 text-charcoal-600 border border-ivory-200"
                      >
                        $25K
                      </button>
                      <button
                        type="button"
                        onClick={() => setBudget('50000')}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-ivory-100 hover:bg-ivory-200 text-charcoal-600 border border-ivory-200"
                      >
                        $50K
                      </button>
                      <button
                        type="button"
                        onClick={() => setBudget('100000')}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-ivory-100 hover:bg-ivory-200 text-charcoal-600 border border-ivory-200"
                      >
                        $100K
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-forest-50 border border-forest-200 text-xs text-forest-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-forest-700" />
                Estimated Spend Per Guest
              </div>
              <p>
                At this target, approximate allocation is{' '}
                <strong>
                  {currency === 'INR' ? '₹' : '$'}
                  {guestCount && Number(guestCount) > 0
                    ? Math.round(Number(budget) / Number(guestCount)).toLocaleString()
                    : 0}
                </strong>{' '}
                per attendee (encompassing royal catering, mandap florals, entertainment &amp; hospitality).
              </p>
            </div>
          </div>

          {/* STEP 5: Food & Accessibility Requirements */}
          <div className={currentStep === 5 ? 'space-y-4 animate-in fade-in duration-150' : 'hidden'}>
            <div>
              <h3 className="font-serif font-bold text-base text-charcoal-900">
                Culinary Formats &amp; Accessibility Needs
              </h3>
              <p className="text-xs text-charcoal-600 mt-0.5">
                Ensure every elder, guest, and dietary preference is warmly accommodated.
              </p>
            </div>

            {/* Food Tradition Selector */}
            <div>
              <label htmlFor="wizard-food-tradition" className="block text-xs font-semibold text-charcoal-700 mb-1 flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5 text-forest-700" />
                Culinary Style &amp; Feast Tradition
              </label>
              <input
                id="wizard-food-tradition"
                type="text"
                value={foodTradition}
                onChange={(e) => setFoodTradition(e.target.value)}
                placeholder="e.g. Traditional Bengali Feast with Sandesh, South Indian Banana Leaf Sadya"
                className="w-full px-3 py-2 text-xs rounded-xl border border-ivory-300 bg-white focus:outline-none focus:ring-2 focus:ring-forest-700"
              />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-charcoal-700 flex items-center gap-1.5">
                Dietary Accommodations:
              </span>
              <div className="flex flex-wrap gap-2">
                {DIETARY_OPTIONS.map((item) => {
                  const isSelected = selectedDietary.includes(item)
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleItem(selectedDietary, item, setSelectedDietary)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                        isSelected
                          ? 'bg-forest-900 text-gold-300 border-forest-700'
                          : 'bg-white text-charcoal-700 border-ivory-300 hover:bg-ivory-50'
                      }`}
                    >
                      {item}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-ivory-200">
              <span className="text-xs font-semibold text-charcoal-700 flex items-center gap-1.5">
                <Accessibility className="w-3.5 h-3.5 text-forest-700" />
                Accessibility &amp; Elder Comfort:
              </span>
              <div className="flex flex-wrap gap-2">
                {ACCESSIBILITY_OPTIONS.map((item) => {
                  const isSelected = selectedAccessibility.includes(item)
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleItem(selectedAccessibility, item, setSelectedAccessibility)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                        isSelected
                          ? 'bg-forest-900 text-gold-300 border-forest-700'
                          : 'bg-white text-charcoal-700 border-ivory-300 hover:bg-ivory-50'
                      }`}
                    >
                      {item}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label htmlFor="wizard-dietary-notes" className="block text-xs font-semibold text-charcoal-700 mb-1">
                Specific Dietary Notes or Counter Requests
              </label>
              <textarea
                id="wizard-dietary-notes"
                rows={2}
                value={dietaryNotes}
                onChange={(e) => setDietaryNotes(e.target.value)}
                placeholder="e.g. Separate Jain chaat counter, nut-free dessert station, live filter coffee stall."
                className="w-full px-3 py-2 text-xs rounded-xl border border-ivory-300 bg-white focus:outline-none focus:ring-2 focus:ring-forest-700"
              />
            </div>

            <div>
              <label htmlFor="wizard-access-notes" className="block text-xs font-semibold text-charcoal-700 mb-1">
                Special Notes for Grandparents or Guests
              </label>
              <textarea
                id="wizard-access-notes"
                rows={2}
                value={accessibilityNotes}
                onChange={(e) => setAccessibilityNotes(e.target.value)}
                placeholder="e.g. Golf cart needed from parking to lawn; wheelchair ramp to mandap stage."
                className="w-full px-3 py-2 text-xs rounded-xl border border-ivory-300 bg-white focus:outline-none focus:ring-2 focus:ring-forest-700"
              />
            </div>
          </div>

          {/* STEP 6: Theme, Priorities & Review */}
          <div className={currentStep === 6 ? 'space-y-4 animate-in fade-in duration-150' : 'hidden'}>
            <div>
              <h3 className="font-serif font-bold text-base text-charcoal-900">
                Theme Preferences &amp; Celebration Review
              </h3>
              <p className="text-xs text-charcoal-600 mt-0.5">
                Confirm your parameters before launching your synchronized celebration workspace.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="wizard-theme" className="block text-xs font-semibold text-charcoal-700">
                Theme or Aesthetic Preference
              </label>
              <input
                id="wizard-theme"
                type="text"
                value={themePreference}
                onChange={(e) => setThemePreference(e.target.value)}
                placeholder="e.g. Royal Marigold & Terracotta, Botanical Lotus Mandap"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-ivory-300 bg-white focus:outline-none focus:ring-2 focus:ring-forest-700"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {THEME_PRESET_SUGGESTIONS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setThemePreference(preset)}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-ivory-100 hover:bg-ivory-200 text-charcoal-700 border border-ivory-200"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-charcoal-700 block">
                Planning Priorities:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRIORITY_OPTIONS.map((p) => {
                  const isChecked = selectedPriorities.includes(p)
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => toggleItem(selectedPriorities, p, setSelectedPriorities)}
                      className={`text-[11px] px-2.5 py-1 rounded-xl border transition-colors ${
                        isChecked
                          ? 'bg-forest-900 text-gold-300 border-forest-700'
                          : 'bg-white text-charcoal-700 border-ivory-300 hover:bg-ivory-50'
                      }`}
                    >
                      {p}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="wizard-venue-setting" className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Venue Environment
                </label>
                <select
                  id="wizard-venue-setting"
                  value={indoorOutdoor}
                  onChange={(e) => setIndoorOutdoor(e.target.value as 'indoor' | 'outdoor' | 'hybrid')}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-ivory-300 bg-white focus:outline-none focus:ring-2 focus:ring-forest-700"
                >
                  <option value="indoor">Indoor (Banquets / Palace Hall)</option>
                  <option value="outdoor">Outdoor (Lawn / Heritage Courtyard)</option>
                  <option value="hybrid">Hybrid (Lawn + Covered Mandap)</option>
                </select>
              </div>

              <div>
                <label htmlFor="wizard-dresscode" className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Dress Code
                </label>
                <input
                  id="wizard-dresscode"
                  type="text"
                  value={dressCode}
                  onChange={(e) => setDressCode(e.target.value)}
                  placeholder="e.g. Traditional Festive / Indo-Western"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-ivory-300 bg-white focus:outline-none focus:ring-2 focus:ring-forest-700"
                />
              </div>
            </div>

            <div>
              <label htmlFor="wizard-special-notes" className="block text-xs font-semibold text-charcoal-700 mb-1">
                Special Vision Notes
              </label>
              <input
                id="wizard-special-notes"
                type="text"
                value={specialNotes}
                onChange={(e) => setSpecialNotes(e.target.value)}
                placeholder="e.g. Royal fireworks finale, live shehnai at sunrise."
                className="w-full px-3 py-2 text-xs rounded-xl border border-ivory-300 bg-white focus:outline-none focus:ring-2 focus:ring-forest-700"
              />
            </div>

            {/* Summary Review Card */}
            <div className="p-4 rounded-xl bg-ivory-100/90 border border-ivory-300 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-ivory-300">
                <span className="font-serif font-bold text-sm text-charcoal-900 flex items-center gap-1.5">
                  <DiyaLampMotif size={16} className="text-gold-600" />
                  Celebration Review
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-forest-100 text-forest-800">
                  {category}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-charcoal-700">
                <div>
                  <span className="text-charcoal-500 block text-[10px]">Title:</span>
                  <strong>{title || 'Untitled Celebration'}</strong>
                </div>
                <div>
                  <span className="text-charcoal-500 block text-[10px]">Location:</span>
                  <strong>{city || 'Location TBD'}</strong>
                </div>
                <div>
                  <span className="text-charcoal-500 block text-[10px]">Date &amp; Schedule:</span>
                  <strong>{date} ({ceremonyScheduleType})</strong>
                </div>
                <div>
                  <span className="text-charcoal-500 block text-[10px]">Budget &amp; Guests:</span>
                  <strong>
                    {currency} {Number(budget).toLocaleString()} ({guestCount} guests)
                  </strong>
                </div>
              </div>

              <div className="pt-2 border-t border-ivory-200 text-[11px] text-charcoal-600 flex flex-wrap gap-2">
                <span>Tradition: <strong>{selectedTradition}</strong></span>
                <span>•</span>
                <span>Language: <strong>{preferredLanguage}</strong></span>
                <span>•</span>
                <span>Timing: <strong>{auspiciousTiming}</strong></span>
                <span>•</span>
                <span>Ceremonies: <strong>{selectedCeremonies.length}</strong></span>
                <span>•</span>
                <span>Dietary: <strong>{selectedDietary.length}</strong></span>
              </div>
            </div>
          </div>

          {/* Wizard Footer Controls */}
          <div className="pt-4 border-t border-ivory-300 flex items-center justify-between gap-3">
            {currentStep > 1 ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handlePrevStep}
                leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
              >
                Back
              </Button>
            ) : (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onClose}
              >
                Cancel
              </Button>
            )}

            <div className="flex items-center gap-2">
              {currentStep < 6 && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleNextStep}
                  rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                >
                  Next Step
                </Button>
              )}

              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isSubmitting}
                leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                className="bg-forest-900 hover:bg-forest-800 text-gold-300 font-semibold"
              >
                {isSubmitting ? 'Creating Plan...' : 'Create Celebration Plan'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
