import { EventCategory, CulturalPreferences } from '@/types/event'
import { TimelinePhase, TaskPriority } from '@/types/timeline'
import { VendorService } from '@/types/vendor'

export interface CeremonyScheduleItem {
  id: string
  name: string
  dayOffset: number // 0 for main day, -1 for day before, 1 for day after
  timing: string
  description: string
  optional?: boolean
}

export interface TemplateMilestone {
  title: string
  offsetDays: number
  phase: TimelinePhase
  priority: TaskPriority
  category: string
  description: string
  isCriticalPath?: boolean
}

export interface TemplateVendor {
  name: string
  service: VendorService
  estimatedCostPercent: number
  questionsToAsk: string[]
  notes: string
  contractReminders?: string
}

export interface IndianEventTemplate {
  id: string
  name: string
  tagline: string
  category: EventCategory
  region: string
  description: string
  defaultDays: number
  defaultGuestCount: number
  defaultBudgetINR: number
  colorTheme: string
  colorPalette: { name: string; hex: string }[]
  culturalPreferences: CulturalPreferences
  defaultCeremonies: CeremonyScheduleItem[]
  defaultMilestones: TemplateMilestone[]
  defaultVendors: TemplateVendor[]
  decorThemes: string[]
  culinaryTraditions: string[]
  dietaryDefaults: string[]
  musicOptions: string[]
  whatIfAdviceTips: string[]
}

export const INDIAN_EVENT_TEMPLATES: IndianEventTemplate[] = [
  // 1. Bengali Wedding
  {
    id: 'bengali-wedding',
    name: 'Bengali Wedding (Biye & Gaye Holud)',
    tagline: 'Timeless literary romance, Alpona art, and royal culinary banquets',
    category: 'wedding',
    region: 'Eastern India / West Bengal',
    description:
      'A deeply ceremonial celebration featuring fragrant Rajnigandha florals, red and ivory silks, conch shell sounds, sacred Saat Paake Ghaura, and an iconic multi-course feast.',
    defaultDays: 3,
    defaultGuestCount: 200,
    defaultBudgetINR: 3500000,
    colorTheme: 'Alpona White, Sindoor Red, Tuberose Cream & Antique Brass',
    colorPalette: [
      { name: 'Alpona White', hex: '#FAF6F0' },
      { name: 'Sindoor Terracotta', hex: '#B4573B' },
      { name: 'Tuberose Cream', hex: '#FDFBF7' },
      { name: 'Antique Gold', hex: '#C5A059' },
      { name: 'Forest Green', hex: '#1B4332' },
    ],
    culturalPreferences: {
      traditionId: 'bengali-wedding',
      regionOrState: 'West Bengal',
      preferredLanguage: 'Bengali',
      ceremonyScheduleType: 'multi-day-3',
      selectedCeremonies: [
        'Aiburobhat (Bachelor Feast)',
        'Gaye Holud (Turmeric Ceremony)',
        'Borjatri & Saat Paake Ghaura (Ceremony)',
        'Subho Drishti & Mala Badal',
        'Sindoor Daan',
        'Bou Bhaat (Reception Feast)',
      ],
      auspiciousTimingPreference: 'Godhuli Lagna (Twilight Sunset)',
      foodTradition: 'Bengali Traditional Feast (Fish & Mishti)',
      musicAndVibe: 'Rabindra Sangeet, Shehnai & Classical Dhak',
      decorStyle: 'Alpana, Brass & Fresh Rajnigandha',
      isReligiousOrCultural: true,
      guestHospitalityNotes: 'Separate sweet service area with warm Sandesh and Mishti Doi clay pots',
    },
    defaultCeremonies: [
      {
        id: 'cer-aiburobhat',
        name: 'Aiburobhat',
        dayOffset: -2,
        timing: 'Afternoon 1:00 PM',
        description: 'Traditional celebratory pre-wedding feast cooked by family elders with authentic Bengali delicacies.',
        optional: true,
      },
      {
        id: 'cer-gaye-holud',
        name: 'Gaye Holud & Tattwa Exchange',
        dayOffset: -1,
        timing: 'Morning 10:00 AM',
        description: 'Turmeric application ritual accompanied by the arrival of the bridal Tattwa gifts, fresh fish basket, and sweets.',
        optional: false,
      },
      {
        id: 'cer-biye-main',
        name: 'Biye (Saat Paake Ghaura & Subho Drishti)',
        dayOffset: 0,
        timing: 'Evening 7:00 PM (Godhuli Lagna)',
        description: 'Seven circumambulations on the pidi, auspicious first glance behind betel leaves, garland exchange, and Sindoor Daan.',
        optional: false,
      },
      {
        id: 'cer-bou-bhaat',
        name: 'Bou Bhaat & Reception',
        dayOffset: 1,
        timing: 'Evening 7:30 PM',
        description: 'Grand reception banquet hosted by the groom’s family welcoming the bride with formal rice serving (Bhat Kapor).',
        optional: false,
      },
    ],
    defaultMilestones: [
      {
        title: 'Book Rajbari or Heritage Banquet Venue in Kolkata',
        offsetDays: -75,
        phase: 'concept-planning',
        priority: 'critical',
        category: 'venue',
        description: 'Lock heritage premises with courtyard for mandap fire and separate dining halls.',
        isCriticalPath: true,
      },
      {
        title: 'Lock Traditional Bengali Caterer & Menu Tasting',
        offsetDays: -60,
        phase: 'vendor-curation',
        priority: 'critical',
        category: 'catering',
        description: 'Finalize Ilish/Bhetki fish procurement, Basanti Pulao, and artisan Sandesh/Mishti Doi suppliers.',
        isCriticalPath: true,
      },
      {
        title: 'Commission Artisanal Alpona Artist & Shola Mandap Stylist',
        offsetDays: -45,
        phase: 'vendor-curation',
        priority: 'high',
        category: 'decor',
        description: 'Plan white rice-paste floor drawings, brass water urlis, and pure tuberose garlands.',
      },
      {
        title: 'Finalize Pidi, Topor, Mukut & Shankha Conches',
        offsetDays: -25,
        phase: 'logistics-coordination',
        priority: 'high',
        category: 'clothing',
        description: 'Verify handcrafted Shola Topor for groom, bridal Mukut, painted wooden Pidis, and betel leaves.',
      },
      {
        title: 'Confirm Live Dhak Troupe & Shehnai Ensemble',
        offsetDays: -15,
        phase: 'vendor-curation',
        priority: 'medium',
        category: 'entertainment',
        description: 'Schedule traditional musicians for Borjatri entrance, Gaye Holud, and Bou Bhaat ceremony.',
      },
      {
        title: 'Assemble Custom Tattwa Trays & Confectionery Hampers',
        offsetDays: -7,
        phase: 'rehearsal-prep',
        priority: 'high',
        category: 'stationery',
        description: 'Decorate presentation platters for sweets, dry fruits, cosmetics, and decorated Rohu fish.',
      },
    ],
    defaultVendors: [
      {
        name: 'Heritage Banquet & Courtyard Mandap',
        service: 'venue',
        estimatedCostPercent: 0.28,
        questionsToAsk: [
          'Is sacred fire (havan) permitted inside the mandap area?',
          'What is the electricity load capacity for floral chandeliers and halogen lights?',
          'Are external culinary caterers and halwais permitted in the prep kitchen?',
        ],
        notes: 'Mandatory heritage courtyard setup with backup indoor banquet hall for weather security.',
      },
      {
        name: 'Master Bengali Caterer & Halwai Guild',
        service: 'catering',
        estimatedCostPercent: 0.32,
        questionsToAsk: [
          'What is your supply line for fresh Bhetki and Golda Chingri on the ceremony day?',
          'Do you supply earthen clay cups (bhar) for Mishti Doi?',
          'What is your dedicated server ratio for table buffet stations?',
        ],
        notes: 'Requires authentic Kolkata preparation with dedicated counters for vegetarian options.',
      },
      {
        name: 'Alpona Floor Art & Tuberose Botanical Stylist',
        service: 'florals-decor',
        estimatedCostPercent: 0.14,
        questionsToAsk: [
          'Can you create freehand alpona on both entry threshold and mandap stages?',
          'Are fresh Rajnigandha and Marigold strands procured the morning of the wedding?',
        ],
        notes: 'Focus on authentic handcrafted Shola florals rather than artificial plastic backdrops.',
      },
      {
        name: 'Cinematography & Documentary Storytellers',
        service: 'photography-video',
        estimatedCostPercent: 0.1,
        questionsToAsk: [
          'Have you covered traditional Bengali rituals like Subho Drishti and Sindoor Daan?',
          'What is your delivery timeline for ceremony highlight reels?',
        ],
        notes: 'Documentary style capturing candid emotional moments and ceremonial depth.',
      },
      {
        name: 'Traditional Dhak Players & Shehnai Ustads',
        service: 'live-music-dj',
        estimatedCostPercent: 0.08,
        questionsToAsk: [
          'How many dhakis will perform during the Borjatri reception?',
          'Can you provide morning Shehnai during Gaye Holud and evening accompaniment?',
        ],
        notes: 'Acoustic instruments honoring regional musical traditions without excessive amplification.',
      },
    ],
    decorThemes: [
      'Alpona White & Terracotta Twilight',
      'Shola Pith Floral Geometry with Brass Diyas',
      'Rajbari Courtyard Jasmine & Marigold Canopy',
    ],
    culinaryTraditions: [
      'Authentic Bengali Feast (Bhetki Paturi, Chingri Malai Curry, Kosha Mangsho)',
      'Vegetarian Bengali Bhojan (Dhokar Dalna, Chhanar Kalia, Basanti Pulao)',
      'Live Artisan Phuchka, Singara & Radhaballabhi Breakfast Counter',
      'Traditional Sandesh (Nolen Gur in season), Mishti Doi & Rosogolla Bar',
    ],
    dietaryDefaults: ['Fish & Seafood', 'Non-Vegetarian', 'Vegetarian'],
    musicOptions: ['Rabindra Sangeet & Shehnai', 'Acoustic Dhak Troupe', 'Modern Bengali Folk & Contemporary'],
    whatIfAdviceTips: [
      'If budget contracts: Switch dinner from sit-down multi-course service to an elegant buffet; keep fresh Bhetki/Chingri for main ceremony while using seasonal sweets.',
      'If guest count grows: Ensure venue holds at least 25% surplus dining seats so elders can dine comfortably without waiting.',
      'Never trim the Gaye Holud or Biye ceremonial core; prioritize reducing high-wattage AV lighting or imported exotic blooms.',
    ],
  },

  // 2. Punjabi Wedding
  {
    id: 'punjabi-wedding',
    name: 'Punjabi Wedding (Anand Karaj / Phere & Sangeet)',
    tagline: 'High-energy dhol, exuberant hospitality, royal Awadhi spreads, and marigold canopies',
    category: 'wedding',
    region: 'North India / Punjab',
    description:
      'A spirited, joyous celebration characterized by pulsating dhol beats, vibrant Phulkari textiles, glamorous Sangeet performances, sacred ceremony, and legendary culinary generosity.',
    defaultDays: 3,
    defaultGuestCount: 350,
    defaultBudgetINR: 4500000,
    colorTheme: 'Marigold Amber, Rani Pink, Antique Brass & Royal Emerald',
    colorPalette: [
      { name: 'Marigold Amber', hex: '#D5B463' },
      { name: 'Rani Vermilion', hex: '#B4573B' },
      { name: 'Deep Emerald', hex: '#1B4332' },
      { name: 'Warm Ivory', hex: '#FAF6F0' },
      { name: 'Antique Brass', hex: '#C5A059' },
    ],
    culturalPreferences: {
      traditionId: 'punjabi-wedding',
      regionOrState: 'Punjab / North India',
      preferredLanguage: 'Punjabi / Hindi',
      ceremonyScheduleType: 'multi-day-3',
      selectedCeremonies: [
        'Roka & Chunni Ceremony',
        'Mehndi & Chooda Ceremony',
        'High-Energy Sangeet & Jaggo Night',
        'Baraat Procession & Milni',
        'Anand Karaj / Vedic Phere',
        'Grand Reception Banquet',
      ],
      auspiciousTimingPreference: 'Morning Anand Karaj / Evening Phere',
      foodTradition: 'Punjabi Tandoori & Halwai Feast',
      musicAndVibe: 'Live Dhol, Bhangra & Bollywood Dance',
      decorStyle: 'Phulkari Canopies & Marigold Carpets',
      isReligiousOrCultural: true,
      guestHospitalityNotes: 'Live Chaat bazaar, Amritsari kulcha counter, and midnight piping-hot jalebis',
    },
    defaultCeremonies: [
      {
        id: 'cer-punjabi-mehndi',
        name: 'Mehndi & Chooda Ceremony',
        dayOffset: -2,
        timing: 'Afternoon 2:00 PM',
        description: 'Intimate gathering for henna application, bridal chooda blessing, and folk music.',
        optional: false,
      },
      {
        id: 'cer-punjabi-sangeet',
        name: 'Sangeet & Jaggo Night',
        dayOffset: -1,
        timing: 'Evening 7:00 PM',
        description: 'Vibrant musical extravaganza with family choreographed dances, live dhol beats, and late-night Jaggo procession.',
        optional: false,
      },
      {
        id: 'cer-punjabi-main',
        name: 'Baraat, Milni & Wedding Ceremony',
        dayOffset: 0,
        timing: 'Morning 10:00 AM (Anand Karaj) or Evening (Phere)',
        description: 'Grand Baraat procession with brass band and dhol, warm Milni floral greetings, followed by sacred marriage ceremony.',
        optional: false,
      },
      {
        id: 'cer-punjabi-reception',
        name: 'Royal Reception Banquet',
        dayOffset: 0,
        timing: 'Evening 8:00 PM',
        description: 'Opulent evening banquet celebrating the newlyweds with live orchestra and gala dining.',
        optional: false,
      },
    ],
    defaultMilestones: [
      {
        title: 'Lock Luxury Lawn or Ballroom Venue with Sound Clearance',
        offsetDays: -80,
        phase: 'concept-planning',
        priority: 'critical',
        category: 'venue',
        description: 'Ensure outdoor sound permit until 10:00 PM and soundproofed indoor ballroom for afterparty.',
        isCriticalPath: true,
      },
      {
        title: 'Contract Elite Punjabi Catering & Live Chaat Stations',
        offsetDays: -65,
        phase: 'vendor-curation',
        priority: 'critical',
        category: 'catering',
        description: 'Lock live tandoor stations, Amritsari kulcha tandoors, Dal Makhani slow-brew, and live halwai dessert bar.',
        isCriticalPath: true,
      },
      {
        title: 'Book Master Dhol Troupe, DJ & Sangeet Choreographer',
        offsetDays: -50,
        phase: 'vendor-curation',
        priority: 'high',
        category: 'entertainment',
        description: 'Schedule family rehearsal sessions and coordinate audio track mashups.',
      },
      {
        title: 'Design Floral Marigold Mandap & Phulkari Lounge Staging',
        offsetDays: -35,
        phase: 'vendor-curation',
        priority: 'high',
        category: 'decor',
        description: 'Create vibrant day-decor with marigold curtains, brass urns, and canopy seating.',
      },
      {
        title: 'Baraat Ghodi / Vintage Car & Royal Milni Malas Procurement',
        offsetDays: -14,
        phase: 'logistics-coordination',
        priority: 'medium',
        category: 'transport',
        description: 'Organize decorated mare/carriage or open vintage vehicle and ceremonial Milni blankets/shawls.',
      },
    ],
    defaultVendors: [
      {
        name: 'Grand Lawn & Regal Banquet Ballroom',
        service: 'venue',
        estimatedCostPercent: 0.3,
        questionsToAsk: [
          'What is the curfew for outdoor brass band and dhol procession?',
          'Is outside catering permitted or do you have a panel of luxury culinary partners?',
          'How many guest rooms are bundled with the event package?',
        ],
        notes: 'Generous parking and valet arrangements required for high guest volume.',
      },
      {
        name: 'Royal North Indian & Tandoori Caterers',
        service: 'catering',
        estimatedCostPercent: 0.34,
        questionsToAsk: [
          'How many live cooking counters are staffed simultaneously during peak arrival?',
          'Can you accommodate a dedicated Pure Vegetarian / Jain live station?',
          'Are fresh Kulchas and Naans baked directly on clay tandoors on-site?',
        ],
        notes: 'Generous food quantities with continuous live replenishment until the last guest departs.',
      },
      {
        name: 'Phulkari & Marigold Architectural Decorators',
        service: 'florals-decor',
        estimatedCostPercent: 0.15,
        questionsToAsk: [
          'Do you have structural trusses for suspended floral domes and fairy light ceilings?',
          'Are fresh marigolds procured locally to prevent wilting during warm afternoon festivities?',
        ],
        notes: 'Rich color contrasts with warm ambient lighting throughout the venue.',
      },
      {
        name: 'Celebrity DJ, Dhol Beats & AV Production',
        service: 'live-music-dj',
        estimatedCostPercent: 0.1,
        questionsToAsk: [
          'What is the audio wattage and line array configuration for the ballroom?',
          'Do you provide wireless lapel microphones for ceremony chanting/hymns?',
        ],
        notes: 'Seamless sound management with strict compliance with local decibel limits.',
      },
    ],
    decorThemes: [
      'Phulkari Marigold Canopies & Brass Lanterns',
      'Royal Mughal Court with Velvet & Gilded Arches',
      'Contemporary Sangeet Starlight with LED Tunnel',
    ],
    culinaryTraditions: [
      'Amritsari Live Station (Crispy Kulchas, Pindi Chole, Chutneys)',
      'Royal Awadhi & Mughlai Specialties (Dal Makhani, Dum Biryani, Shahi Paneer)',
      'Delhi Street Chaat Bazaar (Gol Gappe, Dahi Bhalla, Papdi Chaat)',
      'Live Artisan Halwai (Kadhai Jalebi with Rabri, Malpua, Kulfi Falooda)',
    ],
    dietaryDefaults: ['Vegetarian', 'Non-Vegetarian', 'Jain Specialty Menu'],
    musicOptions: ['Live Dhol & Bhangra Collective', 'Bollywood & Punjabi Folk Mashups', 'Acoustic Sufi Strings'],
    whatIfAdviceTips: [
      'If budget shrinks: Keep live tandoor and chaat counters high quality while simplifying Sangeet LED screen backdrops.',
      'If guest count swells: Expand chaat stations from 2 to 4 to eliminate queuing friction during the initial 90 minutes.',
      'Never compromise on warm food hospitality; it is the cornerstone of Punjabi celebratory warmth.',
    ],
  },

  // 3. South Indian Wedding
  {
    id: 'south-indian-wedding',
    name: 'South Indian Wedding (Muhurtham & Reception)',
    tagline: 'Sacred Vedic hymns, Mallipoo jasmine aromas, Kuthuvilakku lamps, and authentic banana-leaf Sadya',
    category: 'wedding',
    region: 'Peninsular India (Tamil / Telugu / Kerala / Karnataka)',
    description:
      'An auspicious celebration elevated by sacred Nadaswaram melodies, fragrant jasmine garlands, silk Kanjeevarams, traditional Oonjal swing rituals, and an exquisite Elai Saapadu on plantain leaves.',
    defaultDays: 2,
    defaultGuestCount: 250,
    defaultBudgetINR: 3200000,
    colorTheme: 'Jasmine White, Kanjeevaram Gold, Deep Forest & Temple Red',
    colorPalette: [
      { name: 'Jasmine White', hex: '#FDFBF7' },
      { name: 'Kanjeevaram Gold', hex: '#D5B463' },
      { name: 'Temple Kumkum', hex: '#96442B' },
      { name: 'Deep Forest', hex: '#1B4332' },
      { name: 'Warm Cream', hex: '#FAF6F0' },
    ],
    culturalPreferences: {
      traditionId: 'south-indian-wedding',
      regionOrState: 'Tamil Nadu / Karnataka / Andhra / Kerala',
      preferredLanguage: 'Tamil / Telugu / Kannada / Malayalam',
      ceremonyScheduleType: 'multi-day-2',
      selectedCeremonies: [
        'Vratham / Sumangali Prarthanai',
        'Nichayathartham (Engagement Blessing)',
        'Oonjal (Swing Ritual) & Nagaswaram',
        'Kanyadanam & Mangalya Dharanam',
        'Saptapadi & Laja Homam',
        'Grand Reception & Classical Concert',
      ],
      auspiciousTimingPreference: 'Brahma Muhurta (Dawn / Early Morning)',
      foodTradition: 'South Indian Elai Saapadu (Banana Leaf)',
      musicAndVibe: 'Nadaswaram & Carnatic Instrumental',
      decorStyle: 'Temple Kolam & Brass Diyas',
      isReligiousOrCultural: true,
      guestHospitalityNotes: 'Traditional freshly brewed Kumbakonam Degree Filter Coffee served round the clock',
    },
    defaultCeremonies: [
      {
        id: 'cer-south-pre',
        name: 'Vratham & Nichayathartham',
        dayOffset: -1,
        timing: 'Morning 9:00 AM & Evening 6:00 PM',
        description: 'Sacred preliminary vows invoking ancestral blessings, followed by formal exchange of engagement gifts.',
        optional: false,
      },
      {
        id: 'cer-south-oonjal',
        name: 'Oonjal (Swing Ceremony)',
        dayOffset: 0,
        timing: 'Morning 6:30 AM',
        description: 'The couple is seated on a flower-draped swing, serenaded by family women singing traditional Oonjal songs to signify stability amidst life’s oscillations.',
        optional: false,
      },
      {
        id: 'cer-south-muhurtham',
        name: 'Mangalya Dharanam & Saptapadi',
        dayOffset: 0,
        timing: 'Morning 7:30 AM (Shubh Muhurtham)',
        description: 'Tying of the sacred Thali/Mangalsutra to the crescendo of the Getti Melam, followed by seven sacred steps around the Agni.',
        optional: false,
      },
      {
        id: 'cer-south-sadya',
        name: 'Kalyana Elai Saapadu',
        dayOffset: 0,
        timing: 'Afternoon 11:30 AM',
        description: 'Elaborate traditional multi-course satvik feast served on fresh whole plantain leaves.',
        optional: false,
      },
      {
        id: 'cer-south-reception',
        name: 'Evening Reception & Carnatic Fusion',
        dayOffset: 0,
        timing: 'Evening 6:30 PM',
        description: 'Celebratory evening greeting for extended guests with contemporary buffet and live instrumental performance.',
        optional: true,
      },
    ],
    defaultMilestones: [
      {
        title: 'Lock Traditional Kalyana Mandapam or Temple Courtyard',
        offsetDays: -75,
        phase: 'concept-planning',
        priority: 'critical',
        category: 'venue',
        description: 'Verify early dawn 4:00 AM hall opening for Muhurtham rituals and breakfast prep.',
        isCriticalPath: true,
      },
      {
        title: 'Contract Master Chef for Traditional Elai Saapadu',
        offsetDays: -60,
        phase: 'vendor-curation',
        priority: 'critical',
        category: 'catering',
        description: 'Lock pure vegetarian culinary team, fresh plantain leaves supplier, and filter coffee stall.',
        isCriticalPath: true,
      },
      {
        title: 'Book Renowned Nadaswaram & Thavil Vidwans',
        offsetDays: -45,
        phase: 'vendor-curation',
        priority: 'high',
        category: 'entertainment',
        description: 'Ensure traditional instrumentalists for dawn Muhurtham and Getti Melam crescendo.',
      },
      {
        title: 'Commission Rice Kolam & Madurai Malli Floral Mandap',
        offsetDays: -30,
        phase: 'vendor-curation',
        priority: 'high',
        category: 'decor',
        description: 'Plan entrance Kolam patterns, banana tree entry pillars, and fresh jasmine garlands.',
      },
      {
        title: 'Procure Kuthuvilakku Brass Lamps & Tamboolam Gift Bags',
        offsetDays: -14,
        phase: 'logistics-coordination',
        priority: 'medium',
        category: 'stationery',
        description: 'Organize coconuts, betel leaves, turmeric, and silk cloth packets for guest farewells.',
      },
    ],
    defaultVendors: [
      {
        name: 'Traditional Kalyana Mandapam',
        service: 'venue',
        estimatedCostPercent: 0.26,
        questionsToAsk: [
          'Are early morning electricity and generator backups operational from 4:30 AM?',
          'What is the seated dining hall capacity for banana-leaf batch seating?',
        ],
        notes: 'Must accommodate batch seating (Pankthi) for rapid, gracious banquet service.',
      },
      {
        name: 'Master South Indian Caterer & Coffee Artisans',
        service: 'catering',
        estimatedCostPercent: 0.34,
        questionsToAsk: [
          'Can your team handle sequential course service for 250 guests within a 45-minute batch?',
          'Do you provide brass filter coffee tumblers and live counters?',
        ],
        notes: 'Strict adherence to traditional satvik recipes without onion/garlic during Muhurtham lunch.',
      },
      {
        name: 'Temple Florals & Botanical Kolam Designers',
        service: 'florals-decor',
        estimatedCostPercent: 0.15,
        questionsToAsk: [
          'Are fresh Madurai Mallipoo (jasmine) and Samangi (tuberose) strung fresh on the wedding morning?',
          'Do you supply genuine brass Kuthuvilakku lamps and oil reserves?',
        ],
        notes: 'Elegant temple architecture styling with pure organic materials.',
      },
      {
        name: 'Traditional Nadaswaram & Carnatic Ensemble',
        service: 'live-music-dj',
        estimatedCostPercent: 0.08,
        questionsToAsk: [
          'Will you provide accompanying Thavil percussionists for the Getti Melam moment?',
        ],
        notes: 'Acoustic mastery honoring centuries of temple celebratory music.',
      },
    ],
    decorThemes: [
      'Temple Gopuram Elegance with Brass Kuthuvilakku & Jasmine',
      'Banana Leaf Green & Marigold Torans with Lotus Ponds',
      'Contemporary Ivory Pavilion with Carnatic Motif Screens',
    ],
    culinaryTraditions: [
      'Authentic Elai Saapadu (Parippu & Ghee, Drumstick Sambar, Mysore Rasam, Avial, Kootu, Appalam)',
      'Traditional Payasam Duo (Paal Payasam & Parippu Pradhaman)',
      'Kumbakonam Degree Filter Coffee & Masala Vadai Breakfast',
      'Tiffin Evening Reception (Live Ghee Roast Dosa, Idiyappam, Kuzhi Paniyaram)',
    ],
    dietaryDefaults: ['Pure Vegetarian (No Onion/Garlic)', 'Traditional Banana Leaf (Elai Saapadu)', 'Satvik'],
    musicOptions: ['Nadaswaram & Thavil Live', 'Carnatic Classical & Veena', 'Contemporary Instrumental Fusion'],
    whatIfAdviceTips: [
      'If budget changes: Preserve the traditional banana leaf lunch intact; trim evening reception stage decor or Western lighting packages.',
      'If schedule tightens: Optimize dining hall turnaround by staggering guest invitations for the morning Muhurtham and subsequent feast.',
      'Never omit the fresh jasmine or traditional brass lamps; they define the sacred sensory soul of a South Indian wedding.',
    ],
  },

  // 4. Maharashtrian Wedding
  {
    id: 'maharashtrian-wedding',
    name: 'Maharashtrian Wedding (Lagnasohala)',
    tagline: 'Paithani grace, Mundavalya pearls, sacred Mangalashtak, and authentic Puran Poli feasts',
    category: 'wedding',
    region: 'Western India / Maharashtra',
    description:
      'A warm, joyous celebration marked by Paithani silks, Mundavalya pearl headbands, sacred Antarpat cloth, melodic Mangalashtak chanting, and generous hospitality with traditional regional feasts.',
    defaultDays: 2,
    defaultGuestCount: 200,
    defaultBudgetINR: 2800000,
    colorTheme: 'Paithani Peacock Blue, Saffron Gold, Kumkum Red & Earthen Cream',
    colorPalette: [
      { name: 'Peacock Paithani', hex: '#1B4332' },
      { name: 'Saffron Gold', hex: '#D5B463' },
      { name: 'Kumkum Red', hex: '#96442B' },
      { name: 'Earthen Cream', hex: '#FAF6F0' },
      { name: 'Warm Terracotta', hex: '#C86D51' },
    ],
    culturalPreferences: {
      traditionId: 'maharashtrian-wedding',
      regionOrState: 'Maharashtra',
      preferredLanguage: 'Marathi',
      ceremonyScheduleType: 'multi-day-2',
      selectedCeremonies: [
        'Sakharpuda (Sugar Blessing & Engagement)',
        'Kelvan Feast with Extended Family',
        'Halad Ceremony',
        'Seemant Pujan & Guruthana',
        'Antarpat & Mangalashtak Recitation',
        'Kanyadaan & Saptapadi',
        'Varat (Bridal Procession)',
      ],
      auspiciousTimingPreference: 'Morning Shubh Muhurat',
      foodTradition: 'Traditional Maharashtrian Feast (Puran Poli & Masale Bhat)',
      musicAndVibe: 'Sahnai, Tutari & Sanai Chaughada',
      decorStyle: 'Mango Leaves, Marigold & Paithani Fabric Canopies',
      isReligiousOrCultural: true,
      guestHospitalityNotes: 'Warm Puran Poli with pure clarified butter (tup) and cold Mattha buttermilk',
    },
    defaultCeremonies: [
      {
        id: 'cer-sakharpuda',
        name: 'Sakharpuda & Kelvan',
        dayOffset: -1,
        timing: 'Morning 10:00 AM',
        description: 'Engagement ceremony where the groom’s family gifts a packet of sugar (sakhar) and saree to the bride, followed by pre-wedding feast.',
        optional: false,
      },
      {
        id: 'cer-halad',
        name: 'Halad Chadavane',
        dayOffset: -1,
        timing: 'Evening 5:00 PM',
        description: 'Family elders apply auspicious turmeric paste accompanied by Marathi folk songs.',
        optional: false,
      },
      {
        id: 'cer-antarpat',
        name: 'Lagna Ceremony & Mangalashtak',
        dayOffset: 0,
        timing: 'Morning 10:30 AM (Muhurat)',
        description: 'Couple separated by Antarpat silk curtain while priests and family recite sacred Mangalashtak verses; curtain drops as guests shower Akshata rice.',
        optional: false,
      },
      {
        id: 'cer-lagna-feast',
        name: 'Traditional Lagnasohala Pangat Feast',
        dayOffset: 0,
        timing: 'Afternoon 1:00 PM',
        description: 'Community feast served in traditional Pangat rows on banana leaves or copper thalis.',
        optional: false,
      },
    ],
    defaultMilestones: [
      {
        title: 'Secure Traditional Karyalaya or Heritage Lawn in Maharashtra',
        offsetDays: -70,
        phase: 'concept-planning',
        priority: 'critical',
        category: 'venue',
        description: 'Verify mandap ventilation and seating capacity for traditional Pangat meal service.',
        isCriticalPath: true,
      },
      {
        title: 'Contract Authentic Maharashtrian Maharaj / Caterer',
        offsetDays: -55,
        phase: 'vendor-curation',
        priority: 'critical',
        category: 'catering',
        description: 'Confirm live Puran Poli hot plate, spiced Masale Bhat, Kothimbir Vadi, and chilled Mattha.',
        isCriticalPath: true,
      },
      {
        title: 'Book Sanai Chaughada & Tutari Musicians',
        offsetDays: -40,
        phase: 'vendor-curation',
        priority: 'high',
        category: 'entertainment',
        description: 'Schedule regal Tutari fanfare for bride & groom entries and auspicious Sanai melodies.',
      },
      {
        title: 'Arrange Pearl Mundavalya, Antarpat Silk & Akshata',
        offsetDays: -20,
        phase: 'logistics-coordination',
        priority: 'high',
        category: 'clothing',
        description: 'Procure authentic pearl Mundavalya brow decorations, embroidered Antarpat, and colored Akshata rice grains.',
      },
    ],
    defaultVendors: [
      {
        name: 'Traditional Maharashtrian Karyalaya',
        service: 'venue',
        estimatedCostPercent: 0.28,
        questionsToAsk: [
          'Is open flame permitted for the Vivaha Homa fire ritual?',
          'Does the hall have dedicated dressing suites for both bride and groom families?',
        ],
        notes: 'Classic Maharashtrian celebratory venue with high ceilings and spacious dining Pangat.',
      },
      {
        name: 'Master Maharashtrian Maharaj & Culinary Guild',
        service: 'catering',
        estimatedCostPercent: 0.32,
        questionsToAsk: [
          'Do you serve hot Puran Poli right from the pan with fresh Tup (ghee)?',
          'Can you organize sequential Pangat service with trained traditional servers?',
        ],
        notes: 'Flavorful, authentic recipes using coconut, sesame, and signature goda masala.',
      },
      {
        name: 'Ghenda (Marigold) & Paithani Motif Decorators',
        service: 'florals-decor',
        estimatedCostPercent: 0.14,
        questionsToAsk: [
          'Can you incorporate authentic Paithani textile motifs into the mandap backdrop?',
        ],
        notes: 'Bright yellow and orange marigolds with mango leaf torans.',
      },
    ],
    decorThemes: [
      'Paithani Borders & Yellow Ghenda (Marigold) Canopies',
      'Terracotta Earthen Pots with Brass Samai Lamps',
      'Peshwa Palace Courtyard Architectural Styling',
    ],
    culinaryTraditions: [
      'Authentic Lagnasohala Pangat (Puran Poli with Saajuk Tup, Katachi Amti, Masale Bhat)',
      'Traditional Starters (Crispy Kothimbir Vadi, Aluvadi, Batata Vada)',
      'Dessert Highlights (Amrakhand, Shrikhand, Basundi with Charoli nuts)',
      'Digestive Finale (Chilled Spiced Mattha buttermilk & Paan counter)',
    ],
    dietaryDefaults: ['Vegetarian', 'Pure Vegetarian (No Onion/Garlic)'],
    musicOptions: ['Sanai Chaughada & Live Tutari', 'Bhavgeet & Marathi Classical', 'Contemporary Marathi Fusion'],
    whatIfAdviceTips: [
      'If budget changes: Protect the traditional Puran Poli feast; savings can be gained by choosing local seasonal marigolds over imported flowers.',
      'If headcount rises: Organize Pangat dining into two distinct shifts so every guest receives personal hospitality.',
    ],
  },

  // 5. Gujarati Wedding
  {
    id: 'gujarati-wedding',
    name: 'Gujarati Wedding (Lagan & Garba Night)',
    tagline: 'Vibrant mirror-work textiles, synchronized Dandiya rhythms, and legendary Farsan banquets',
    category: 'wedding',
    region: 'Western India / Gujarat',
    description:
      'An exuberant celebration bursting with kaleidoscopic bandhani textiles, joyful Garba circles, energetic Dandiya Raas, sacred Hasta Melap rituals, and rich multi-course vegetarian feasts.',
    defaultDays: 3,
    defaultGuestCount: 300,
    defaultBudgetINR: 4000000,
    colorTheme: 'Coral Terracotta, Mirror Gold, Saffron & Olive Green',
    colorPalette: [
      { name: 'Coral Terracotta', hex: '#C86D51' },
      { name: 'Mirror Gold', hex: '#D5B463' },
      { name: 'Bandhani Red', hex: '#96442B' },
      { name: 'Saffron Olive', hex: '#21543E' },
      { name: 'Warm Cream', hex: '#FAF6F0' },
    ],
    culturalPreferences: {
      traditionId: 'gujarati-wedding',
      regionOrState: 'Gujarat',
      preferredLanguage: 'Gujarati',
      ceremonyScheduleType: 'multi-day-3',
      selectedCeremonies: [
        'Mandva Mahurat & Griha Shanti',
        'Mameru / Mosalu Ceremony',
        'Grand Garba & Dandiya Raas Night',
        'Jaan Arrival & Ponkhana Welcome',
        'Jaimala & Madhuparka',
        'Kanya Daan, Hasta Melap & Mangal Pheras',
      ],
      auspiciousTimingPreference: 'Daytime / Evening Lagan',
      foodTradition: 'Gujarati Kathiyawadi & Farsan Feast',
      musicAndVibe: 'Live Garba Band & Dholak Beats',
      decorStyle: 'Bandhani Drapes, Mirrorwork & Earthen Matkas',
      isReligiousOrCultural: true,
      guestHospitalityNotes: 'Live Farsan counter with streaming hot Jalebi-Fafda and Dhokla',
    },
    defaultCeremonies: [
      {
        id: 'cer-gujarati-garba',
        name: 'Garba & Dandiya Raas Night',
        dayOffset: -1,
        timing: 'Evening 7:30 PM',
        description: 'Vibrant musical dance night where all generations dance in concentric circles with decorated wooden Dandiya sticks.',
        optional: false,
      },
      {
        id: 'cer-gujarati-lagan',
        name: 'Ponkhana, Hasta Melap & Pheras',
        dayOffset: 0,
        timing: 'Morning 11:00 AM',
        description: 'Groom welcomed by mother-in-law pulling his nose playfully (Ponkhana), sacred Hasta Melap, and four Mangal Pheras representing Dharma, Artha, Kama, and Moksha.',
        optional: false,
      },
      {
        id: 'cer-gujarati-reception',
        name: 'Grand Vegetarian Gala Reception',
        dayOffset: 0,
        timing: 'Evening 7:30 PM',
        description: 'Celebratory banquet featuring live counters, traditional Gujarati delicacies, and celebratory speeches.',
        optional: false,
      },
    ],
    defaultMilestones: [
      {
        title: 'Lock Expansive Lawn or Hall with High Ceiling for Garba',
        offsetDays: -75,
        phase: 'concept-planning',
        priority: 'critical',
        category: 'venue',
        description: 'Ensure smooth wooden or non-slip flooring suitable for energetic barefoot Dandiya dancing.',
        isCriticalPath: true,
      },
      {
        title: 'Contract Master Gujarati Maharaj & Farsan Chefs',
        offsetDays: -60,
        phase: 'vendor-curation',
        priority: 'critical',
        category: 'catering',
        description: 'Confirm live Farsan counter (Khandvi, Dhokla, Patra), seasonal Undhiyu, and Jalebi live fry.',
        isCriticalPath: true,
      },
      {
        title: 'Book Authentic Live Garba Orchestra & Vocalists',
        offsetDays: -45,
        phase: 'vendor-curation',
        priority: 'high',
        category: 'entertainment',
        description: 'Book traditional Gujarati folk singers with dholak and synth for synchronized Raas.',
      },
      {
        title: 'Procure Decorated Dandiya Sticks & Bandhani Shawls',
        offsetDays: -20,
        phase: 'logistics-coordination',
        priority: 'medium',
        category: 'stationery',
        description: 'Order 300+ pairs of cloth-wrapped wooden Dandiya sticks and guest favor pouches.',
      },
    ],
    defaultVendors: [
      {
        name: 'Grand Party Plot or Heritage Lawn',
        service: 'venue',
        estimatedCostPercent: 0.28,
        questionsToAsk: [
          'What is the sound curfew for outdoor Garba playing?',
          'Is open space available for 5+ live cooking stalls?',
        ],
        notes: 'Spacious circular layout to support multiple dance rings.',
      },
      {
        name: 'Authentic Gujarati Vegetarian Culinary Masters',
        service: 'catering',
        estimatedCostPercent: 0.35,
        questionsToAsk: [
          'Do you have a dedicated 100% Jain culinary station completely separate from root-vegetable prep?',
          'Will hot Jalebis and Fafda be prepared live in front of guests?',
        ],
        notes: 'High culinary standard with balance of sweet, savory, and spicy flavors.',
      },
      {
        name: 'Mirrorwork & Bandhani Stage Stylist',
        service: 'florals-decor',
        estimatedCostPercent: 0.14,
        questionsToAsk: [
          'Can you construct a floral-canopy mandap with painted earthen pots (Chori)?',
        ],
        notes: 'Rich festive textiles and warm golden illumination.',
      },
    ],
    decorThemes: [
      'Bandhani Canopies with Kutch Mirrorwork & Brass Bells',
      'Painted Earthen Pot (Chori) Mandap with Marigold Torans',
      'Contemporary Saffron & Gold Lantern Pavilions',
    ],
    culinaryTraditions: [
      'Live Artisan Farsan (Steamed Khaman, Khandvi rolls, Corn Kachori, Lilva Patra)',
      'Signature Gujarati Feast (Surti Undhiyu, Gujarati Kadi, Dal-Bhat, Ringna No Oro)',
      'Live Sweet Halwai (Kesar Jalebi, Basundi, Mohanthal, Aamras in season)',
    ],
    dietaryDefaults: ['Pure Vegetarian (No Onion/Garlic)', 'Jain Specialty Menu', 'Vegetarian'],
    musicOptions: ['Live Folk Garba & Dandiya Band', 'Sanedo & Gujarati Folk', 'Contemporary Bollywood Raas'],
    whatIfAdviceTips: [
      'If budget contracts: Focus decoration spend on the Garba dance center and the sacred mandap; simplify perimeter fencing.',
      'Always maintain separate, clearly labeled Jain counters with zero root vegetables (onion, garlic, potato).',
    ],
  },

  // 6. Durga Puja & Community Festival
  {
    id: 'durga-puja',
    name: 'Durga Puja (Sharodotsav Community Celebration)',
    tagline: 'Magnificent architectural pandals, Dhunuchi Aarti, sacred Bhog, and communal celebration',
    category: 'community',
    region: 'Eastern India / Pan-India Community',
    description:
      'A monumental five-day celebration of art, culture, and devotion featuring architectural pandals, mesmerizing Dhak rhythms, daily community Bhog, evening cultural theater, and joyous Sindoor Khela.',
    defaultDays: 5,
    defaultGuestCount: 600,
    defaultBudgetINR: 5000000,
    colorTheme: 'Kash Phool White, Terracotta Clay, Brass Gold & Vermilion',
    colorPalette: [
      { name: 'Kash Phool White', hex: '#FDFBF7' },
      { name: 'Terracotta Red', hex: '#B4573B' },
      { name: 'Brass Gold', hex: '#D5B463' },
      { name: 'Sacred Sindoor', hex: '#96442B' },
      { name: 'Deep Forest', hex: '#1B4332' },
    ],
    culturalPreferences: {
      traditionId: 'durga-puja',
      regionOrState: 'West Bengal / Community Association',
      preferredLanguage: 'Bengali / Hindi / English',
      ceremonyScheduleType: 'custom',
      selectedCeremonies: [
        'Maha Sasthi (Bodhon & Amantran)',
        'Maha Saptami (Kola Bou Snan & Puja)',
        'Maha Ashtami (Kumari Puja & Sandhi Puja with 108 Lotuses)',
        'Maha Nabami (Maha Aarti & Dhunuchi Naach Competition)',
        'Bijoya Dashami (Sindoor Khela & Shanti Jol)',
      ],
      auspiciousTimingPreference: 'Sandhi Puja Muhurat (Ashtami-Nabami Confluence)',
      foodTradition: 'Traditional Community Bhog (Khichuri, Labra & Payesh)',
      musicAndVibe: 'Dhak Rhythms, Shankha & Rabindra Sangeet',
      decorStyle: 'Architectural Theme Pandal with Terracotta & Jute',
      isReligiousOrCultural: true,
      guestHospitalityNotes: 'Free community Bhog distribution with separate seating for senior citizens',
    },
    defaultCeremonies: [
      {
        id: 'cer-sasthi',
        name: 'Maha Sasthi (Bodhon)',
        dayOffset: -3,
        timing: 'Evening 6:00 PM',
        description: 'Unveiling of the deity’s face and awakening ritual under the Bel tree.',
        optional: false,
      },
      {
        id: 'cer-ashtami',
        name: 'Maha Ashtami & Sandhi Puja',
        dayOffset: -1,
        timing: 'Morning 9:30 AM & Sandhi Puja Window',
        description: 'Most sacred puja of the festival with 108 lotus offerings and 108 lit clay lamps at the confluence of Ashtami and Nabami.',
        optional: false,
      },
      {
        id: 'cer-nabami-dhunuchi',
        name: 'Maha Nabami & Dhunuchi Dance',
        dayOffset: 0,
        timing: 'Evening 7:00 PM',
        description: 'Spectacular rhythmic Dhunuchi Aarti competition accompanied by thunderous Dhak drumming.',
        optional: false,
      },
      {
        id: 'cer-dashami-sindoor',
        name: 'Bijoya Dashami & Sindoor Khela',
        dayOffset: 1,
        timing: 'Afternoon 2:00 PM',
        description: 'Women apply vermilion to the deity and each other, followed by tearful farewell and Bisorjon procession.',
        optional: false,
      },
    ],
    defaultMilestones: [
      {
        title: 'Obtain Civic Permits, Fire Marshal Clearance & Sound Licenses',
        offsetDays: -90,
        phase: 'concept-planning',
        priority: 'critical',
        category: 'permits',
        description: 'Ensure municipality venue permission, police bandobast, electrical inspector signoff, and fire safety clearance.',
        isCriticalPath: true,
      },
      {
        title: 'Commission Pandal Architects & Traditional Clay Idol Sculptor',
        offsetDays: -75,
        phase: 'concept-planning',
        priority: 'critical',
        category: 'decor',
        description: 'Lock eco-friendly clay pratima from Kumartuli artisans and structural pandal fabrication.',
        isCriticalPath: true,
      },
      {
        title: 'Contract Volunteer Roster & Security Crowd Management',
        offsetDays: -45,
        phase: 'logistics-coordination',
        priority: 'critical',
        category: 'venue',
        description: 'Plan crowd barricades, CCTV monitoring, senior citizen fast-track lanes, and medical first-aid tent.',
        isCriticalPath: true,
      },
      {
        title: 'Organize Daily Maha Bhog Procurement & Kitchen Setup',
        offsetDays: -30,
        phase: 'vendor-curation',
        priority: 'high',
        category: 'catering',
        description: 'Order Govindobhog rice, Sona Moong dal, pure mustard oil, cashews, raisins, and earthen handis.',
      },
      {
        title: 'Book Dhakis Troupe, Shankha Players & Cultural Artists',
        offsetDays: -20,
        phase: 'vendor-curation',
        priority: 'high',
        category: 'entertainment',
        description: 'Coordinate master Dhak drummers for all five days and program evening community performances.',
      },
    ],
    defaultVendors: [
      {
        name: 'Pandal Structural Engineers & Theme Decorators',
        service: 'decor',
        estimatedCostPercent: 0.38,
        questionsToAsk: [
          'Is all structural fabric treated with mandatory fire-retardant chemical solution?',
          'What are the designated emergency exit dimensions and signage provisions?',
        ],
        notes: 'Strict compliance with municipality safety codes and eco-friendly guidelines.',
      },
      {
        name: 'Community Bhog Kitchen Guild & Halwai',
        service: 'catering',
        estimatedCostPercent: 0.25,
        questionsToAsk: [
          'Can the kitchen safely cook 600+ servings of Bhog per batch with hygienic standards?',
          'Are eco-friendly biodegradable leaf plates (sal pata) used for dining?',
        ],
        notes: 'Pavitra preparation following strict hygiene and satvik guidelines.',
      },
      {
        name: 'Master Dhak Troupe & Folk Percussionists',
        service: 'live-music-dj',
        estimatedCostPercent: 0.1,
        questionsToAsk: [
          'Will the lead dhakis be available for both morning Pushpanjali and evening Aarti?',
        ],
        notes: 'Authentic feather-adorned Dhak drums for high-energy ceremonial beats.',
      },
    ],
    decorThemes: [
      'Eco-Friendly Terracotta & Handloom Pandal Architecture',
      'Traditional Shobhabazar Rajbari Heritage Courtyard',
      'Kash Phool Autumnal Canvas with Earthen Diyas',
    ],
    culinaryTraditions: [
      'Daily Sacred Maha Bhog (Khichuri, Labra mixed vegetables, Beguni, Tomato-Khejur chutney, Payesh)',
      'Evening Anandamela Community Food Stalls (Phuchka, Ghugni, Roll, Chop)',
      'Bijoya Dashami Sweets (Nimki, Gaja, Sandesh, Kacha Golla)',
    ],
    dietaryDefaults: ['Pure Vegetarian (No Onion/Garlic)', 'Satvik', 'Vegetarian'],
    musicOptions: ['Sacred Dhak Beats & Conch Shells', 'Rabindra Sangeet & Bengali Folk', 'Classical Agomoni Songs'],
    whatIfAdviceTips: [
      'If crowd footfall exceeds forecast: Activate pre-planned outer perimeter queue holding areas and stagger Bhog dining tokens.',
      'Never compromise on fire safety equipment or wheelchair accessibility ramps at the pandal entrance.',
    ],
  },

  // 7. Diwali Festival of Lights Gala
  {
    id: 'diwali-gala',
    name: 'Diwali (Festival of Lights Gala)',
    tagline: 'Golden luminescence, brass Urlis, festive fireworks, and handcrafted mithai hampers',
    category: 'community',
    region: 'Pan-India Festive',
    description:
      'A warm, illuminating festival celebrating light over darkness with clay diyas, floating marigolds, Lakshmi Puja blessings, lavish royal dining, and heartfelt family gifting.',
    defaultDays: 1,
    defaultGuestCount: 150,
    defaultBudgetINR: 1800000,
    colorTheme: 'Antique Gold, Deep Terracotta, Warm Amber & Emerald Green',
    colorPalette: [
      { name: 'Antique Gold', hex: '#C5A059' },
      { name: 'Warm Amber', hex: '#D5B463' },
      { name: 'Terracotta Flame', hex: '#B4573B' },
      { name: 'Emerald Velvet', hex: '#1B4332' },
      { name: 'Warm Ivory', hex: '#FAF6F0' },
    ],
    culturalPreferences: {
      traditionId: 'diwali-gala',
      regionOrState: 'All India',
      preferredLanguage: 'Hindi / English',
      ceremonyScheduleType: 'single-day',
      selectedCeremonies: [
        'Welcome with Chandan Tilak & Rosewater Spritz',
        'Traditional Rangoli Display & Diya Lighting',
        'Lakshmi-Ganesh Puja & Aarti',
        'Gourmet Festive Feast & Mithai Lounge',
        'Eco-Friendly Green Fireworks & Music',
      ],
      auspiciousTimingPreference: 'Evening Pradosh Kaal Muhurat',
      foodTradition: 'Royal Festive Vegetarian & Mithai Banquet',
      musicAndVibe: 'Acoustic Sufi, Ghazals & Instrumental Santoor',
      decorStyle: 'Terracotta Diyas & Floating Brass Urli',
      isReligiousOrCultural: true,
      guestHospitalityNotes: 'Artisan mithai gift hamper presented to every attending family on departure',
    },
    defaultCeremonies: [
      {
        id: 'cer-diwali-puja',
        name: 'Lakshmi-Ganesh Puja & 108 Diya Lighting',
        dayOffset: 0,
        timing: 'Evening 6:30 PM (Pradosh Kaal)',
        description: 'Sacred chanting invoking prosperity and wisdom, followed by guests lighting 108 oil diyas across courtyards and verandas.',
        optional: false,
      },
      {
        id: 'cer-diwali-gala',
        name: 'Diwali Festive Gala & Musical Night',
        dayOffset: 0,
        timing: 'Evening 8:00 PM',
        description: 'Exquisite dinner with live chaat stalls, slow-cooked royal delicacies, live instrumental music, and sweet distribution.',
        optional: false,
      },
    ],
    defaultMilestones: [
      {
        title: 'Reserve Heritage Courtyard or Terrace Venue',
        offsetDays: -45,
        phase: 'concept-planning',
        priority: 'critical',
        category: 'venue',
        description: 'Ensure open-air space safe for diyas and festive sparkler staging.',
        isCriticalPath: true,
      },
      {
        title: 'Contract Gourmet Festive Catering & Live Mithai Maker',
        offsetDays: -30,
        phase: 'vendor-curation',
        priority: 'critical',
        category: 'catering',
        description: 'Organize fresh hot Jalebi-Rabri counter, rich paneer dishes, and artisan welcome drinks.',
        isCriticalPath: true,
      },
      {
        title: 'Procure Handcrafted Clay Diyas, Brass Urlis & Marigold Strings',
        offsetDays: -15,
        phase: 'vendor-curation',
        priority: 'high',
        category: 'decor',
        description: 'Order 500+ organic terracotta diyas, pure mustard/sesame oil, and fresh marigold garlands.',
      },
      {
        title: 'Assemble Custom Artisan Mithai Gift Hampers',
        offsetDays: -7,
        phase: 'logistics-coordination',
        priority: 'medium',
        category: 'stationery',
        description: 'Curate luxury boxes with Kaju Katli, Motichoor Ladoos, roasted nuts, and brass diyas.',
      },
    ],
    defaultVendors: [
      {
        name: 'Heritage Courtyard & Candlelight Terrace',
        service: 'venue',
        estimatedCostPercent: 0.3,
        questionsToAsk: [
          'Are open terracotta oil lamps allowed on perimeter parapets and steps?',
        ],
        notes: 'Atmospheric venue with architectural stone arches and warm ambient lighting.',
      },
      {
        name: 'Royal Festive Culinary Team & Halwai',
        service: 'catering',
        estimatedCostPercent: 0.36,
        questionsToAsk: [
          'Can you provide live preparation of hot desserts and signature chaat?',
        ],
        notes: 'Rich festive menu with pure vegetarian options and fresh dry fruit curations.',
      },
      {
        name: 'Diya & Architectural Lighting Designers',
        service: 'florals-decor',
        estimatedCostPercent: 0.16,
        questionsToAsk: [
          'Can you create intricate floral rangoli carpets at the entrance?',
        ],
        notes: 'Blend of organic flame glow and warm architectural fairy light cascades.',
      },
    ],
    decorThemes: [
      'Gilded Brass Urli with Floating Tea Lights & Yellow Marigolds',
      'Artisan Terracotta Lamp Pathways with Colorful Rangoli',
      'Royal Mughal Palace Starlight with Hanging Lanterns',
    ],
    culinaryTraditions: [
      'Festive Royal Feast (Dal Bukhara, Shahi Paneer, Dum Pulao, Stuffed Kulcha)',
      'Live Chaat Bazaar (Pani Puri with 3 waters, Papdi Chaat, Palak Patta Chaat)',
      'Artisanal Mithai Counter (Hot Jalebi with Rabri, Malpua, Motichoor Ladoos)',
    ],
    dietaryDefaults: ['Pure Vegetarian (No Onion/Garlic)', 'Vegetarian'],
    musicOptions: ['Live Santoor & Flute Duet', 'Acoustic Sufi & Ghazal Ensemble', 'Celebratory Festive Medleys'],
    whatIfAdviceTips: [
      'If budget tightens: Prioritize warm clay diya lighting and authentic mithai hampers over high-priced imported sound rigs.',
    ],
  },

  // 8. Eid Gathering (Eid Milan)
  {
    id: 'eid-gathering',
    name: 'Eid Gathering (Eid Milan)',
    tagline: 'Warm family blessings, fragrant attar, Awadhi Dum Biryani, and rich Sheer Khurma',
    category: 'community',
    region: 'Pan-India Community',
    description:
      'A hospitable, heartwarming gathering celebrating brotherhood, generosity, and gratitude with exquisite Mughlai culinary artistry, elegant Moroccan lanterns, and traditional hospitality.',
    defaultDays: 1,
    defaultGuestCount: 175,
    defaultBudgetINR: 2000000,
    colorTheme: 'Emerald Velvet, Antique Gold, Jasmine White & Ivory',
    colorPalette: [
      { name: 'Emerald Velvet', hex: '#1B4332' },
      { name: 'Antique Gold', hex: '#D5B463' },
      { name: 'Jasmine White', hex: '#FDFBF7' },
      { name: 'Warm Ivory', hex: '#FAF6F0' },
      { name: 'Rich Ochre', hex: '#C5A059' },
    ],
    culturalPreferences: {
      traditionId: 'eid-gathering',
      regionOrState: 'All India',
      preferredLanguage: 'Urdu / Hindi / English',
      ceremonyScheduleType: 'single-day',
      selectedCeremonies: [
        'Eid Morning Prayer Coordination',
        'Warm Welcoming with Ittar & Rose Water',
        'Eidi Distribution Ceremony for Children',
        'Royal Dastarkhwan Feast',
        'Evening Mehfil-e-Ghazal',
      ],
      auspiciousTimingPreference: 'Afternoon / Evening Milan',
      foodTradition: 'Awadhi & Hyderabadi Dum Cooking',
      musicAndVibe: 'Live Ghazal & Instrumental Sufi',
      decorStyle: 'Mughal Jaali Screens, Jasmine Curtains & Brass Lanterns',
      isReligiousOrCultural: true,
      guestHospitalityNotes: 'Welcoming station with pure sandalwood ittar application and fresh cardamom tea',
    },
    defaultCeremonies: [
      {
        id: 'cer-eid-welcome',
        name: 'Warm Welcome & Eidi Distribution',
        dayOffset: 0,
        timing: 'Afternoon 1:00 PM',
        description: 'Traditional welcoming with fragrant attar and rosewater, followed by elders presenting Eidi envelopes to all young guests.',
        optional: false,
      },
      {
        id: 'cer-eid-feast',
        name: 'Royal Dastarkhwan Feast',
        dayOffset: 0,
        timing: 'Afternoon 1:30 PM',
        description: 'Grand communal dining featuring authentic slow-simmered dum biryani, tender kebabs, and hot Sheer Khurma.',
        optional: false,
      },
    ],
    defaultMilestones: [
      {
        title: 'Secure Spacious Banquet Hall or Garden Pavilion',
        offsetDays: -40,
        phase: 'concept-planning',
        priority: 'critical',
        category: 'venue',
        description: 'Verify prayer room availability and comfortable lounge seating for elders.',
        isCriticalPath: true,
      },
      {
        title: 'Contract Renowned Awadhi / Hyderabadi Master Chefs',
        offsetDays: -30,
        phase: 'vendor-curation',
        priority: 'critical',
        category: 'catering',
        description: 'Confirm slow-cooked Dum Biryani, Galouti/Shami Kebabs, and artisan Sheer Khurma with pistachios.',
        isCriticalPath: true,
      },
      {
        title: 'Design Mughal Jaali Backdrops & Jasmine Flower Curtains',
        offsetDays: -15,
        phase: 'vendor-curation',
        priority: 'high',
        category: 'decor',
        description: 'Curate brass lanterns, low velvet seating diwans, and fragrant white florals.',
      },
    ],
    defaultVendors: [
      {
        name: 'Grand Garden Pavilion or Heritage Banquet',
        service: 'venue',
        estimatedCostPercent: 0.3,
        questionsToAsk: [
          'Is a quiet, carpeted prayer area available on-site?',
        ],
        notes: 'Generous circulation for family minglings and multi-generational comfort.',
      },
      {
        name: 'Master Dum Biryani & Kebabs Guild',
        service: 'catering',
        estimatedCostPercent: 0.38,
        questionsToAsk: [
          'Is all meat 100% Halal certified with documented supplier verification?',
          'Do you serve hot Sheer Khurma continuously throughout the reception?',
        ],
        notes: 'Exceptional slow-cooked authentic recipes.',
      },
    ],
    decorThemes: [
      'Mughal Geometric Jaali with Cascading Jasmine',
      'Emerald Velvet Diwans with Brass Moroccan Lanterns',
    ],
    culinaryTraditions: [
      'Royal Dastarkhwan (Mutton Dum Biryani, Chicken Korma, Mirchi Ka Salan, Sheermal)',
      'Vegetarian Mughlai (Subz Biryani, Paneer Lababdar, Dal Makhani)',
      'Signature Sweets (Sheer Khurma with chironji & saffron, Shahi Tukda, Phirni in earthen pots)',
    ],
    dietaryDefaults: ['Halal Menu', 'Vegetarian'],
    musicOptions: ['Live Ghazal Ensemble', 'Acoustic Sufi Strings', 'Instrumental Santoor & Flute'],
    whatIfAdviceTips: [
      'Halal meat sourcing and dedicated prayer spaces are non-negotiable; never compromise these for budget trade-offs.',
    ],
  },

  // 9. Onam Celebration
  {
    id: 'onam-celebration',
    name: 'Onam Celebration (Thiruvonam & Grand Sadya)',
    tagline: 'Vibrant Athapookalam, 26-dish Onasadya on plantain leaves, and Chenda Melam beats',
    category: 'community',
    region: 'Peninsular India / Kerala',
    description:
      'The harvest festival of Kerala celebrating King Mahabali’s homecoming with spectacular floral carpets (Pookalam), classical Thiruvathira dance, thunderous Chenda Melam, and the legendary 26-dish Onasadya.',
    defaultDays: 1,
    defaultGuestCount: 200,
    defaultBudgetINR: 1500000,
    colorTheme: 'Kasavu Gold, Plantain Leaf Green, Marigold Yellow & Pure Cream',
    colorPalette: [
      { name: 'Kasavu Gold', hex: '#D5B463' },
      { name: 'Leaf Green', hex: '#1B4332' },
      { name: 'Marigold Yellow', hex: '#C5A059' },
      { name: 'Pure Cream', hex: '#FDFBF7' },
      { name: 'Warm Ivory', hex: '#FAF6F0' },
    ],
    culturalPreferences: {
      traditionId: 'onam-celebration',
      regionOrState: 'Kerala',
      preferredLanguage: 'Malayalam / English',
      ceremonyScheduleType: 'single-day',
      selectedCeremonies: [
        'Dawn Athapookalam (Floral Carpet Assembly)',
        'King Mahabali Procession & Welcoming',
        'Chenda Melam Percussion Performance',
        'Thiruvathirakali Traditional Dance',
        'The Grand 26-Dish Onasadya Feast',
      ],
      auspiciousTimingPreference: 'Thiruvonam Morning & Afternoon Feast',
      foodTradition: 'Traditional 26-Dish Kerala Sadya (Banana Leaf)',
      musicAndVibe: 'Chenda Melam Percussion & Sopanam',
      decorStyle: 'Kasavu Drapes, Banana Stems & Fresh Floral Pookalam',
      isReligiousOrCultural: true,
      guestHospitalityNotes: 'Every guest welcomed with traditional sandalwood paste and fresh jasmine spray',
    },
    defaultCeremonies: [
      {
        id: 'cer-pookalam',
        name: 'Community Pookalam & Chenda Melam',
        dayOffset: 0,
        timing: 'Morning 8:30 AM',
        description: 'Volunteer teams assemble an elaborate 10-foot geometric floral carpet, followed by ceremonial Chenda Melam performance.',
        optional: false,
      },
      {
        id: 'cer-sadya',
        name: 'The Grand Onasadya Feast',
        dayOffset: 0,
        timing: 'Afternoon 12:00 PM',
        description: 'Exquisite 26-dish vegetarian feast served strictly on whole fresh plantain leaves in traditional sequence.',
        optional: false,
      },
    ],
    defaultMilestones: [
      {
        title: 'Book Traditional Auditorium or Cultural Center',
        offsetDays: -45,
        phase: 'concept-planning',
        priority: 'critical',
        category: 'venue',
        description: 'Verify dining space for batch banana-leaf seating of 100 guests simultaneously.',
        isCriticalPath: true,
      },
      {
        title: 'Contract Authentic Kerala Sadya Master Chef',
        offsetDays: -30,
        phase: 'vendor-curation',
        priority: 'critical',
        category: 'catering',
        description: 'Lock pure satvik Kerala team, Matta rice, coconut oil, fresh plantain leaves, and Payasam duo.',
        isCriticalPath: true,
      },
      {
        title: 'Procure 50+ kg Fresh Floral Petals for Athapookalam',
        offsetDays: -10,
        phase: 'vendor-curation',
        priority: 'high',
        category: 'decor',
        description: 'Order marigold, rose petals, jasmine, and gomphrena blooms for the entrance centerpiece.',
      },
    ],
    defaultVendors: [
      {
        name: 'Cultural Auditorium & Dining Hall',
        service: 'venue',
        estimatedCostPercent: 0.28,
        questionsToAsk: [
          'Are trash disposal facilities available for biodegradable plantain leaves?',
        ],
        notes: 'Requires large hall for both cultural dance and seated dining.',
      },
      {
        name: 'Master Kerala Sadya Culinary Artists',
        service: 'catering',
        estimatedCostPercent: 0.38,
        questionsToAsk: [
          'Do your servers know the exact order of serving all 26 dishes on the leaf?',
        ],
        notes: 'Uncompromising authentic taste cooked strictly with fresh grated coconut and pure coconut oil.',
      },
    ],
    decorThemes: [
      'Athapookalam Floral Geometry with Brass Nilavilakku Lamps',
      'Kasavu Gold Fabric Draping with Fresh Banana Stems',
    ],
    culinaryTraditions: [
      'The 26-Dish Grand Sadya (Inji Puli, Parippu & Ghee, Sambar, Rasam, Avial, Thoran, Kalan, Olan, Pachadi, Kichadi, Pappadam, Sharkara Varatti, Banana Chips)',
      'Traditional Payasams (Ada Pradhaman with jaggery & coconut milk, Palada Payasam)',
    ],
    dietaryDefaults: ['Pure Vegetarian (No Onion/Garlic)', 'Traditional Banana Leaf (Elai Saapadu)', 'Satvik'],
    musicOptions: ['Chenda Melam Live', 'Sopana Sangeetham', 'Malayalam Folk & Instrumental'],
    whatIfAdviceTips: [
      'The 26-dish Sadya on fresh banana leaves is the non-negotiable crown of Onam; never substitute it with a self-service buffet.',
    ],
  },

  // 10. Housewarming (Griha Pravesh)
  {
    id: 'griha-pravesh',
    name: 'Housewarming (Griha Pravesh & Vastu Shanti)',
    tagline: 'Sacred Vastu blessings, boiling milk ritual, threshold Alpana, and warm celebratory lunch',
    category: 'private-celebration',
    region: 'Pan-India Tradition',
    description:
      'An auspicious ceremony blessing a new home with sacred Vedic mantras, the sacred Doodh Ubalna (milk boiling) ritual, threshold torans, and an intimate family feast.',
    defaultDays: 1,
    defaultGuestCount: 75,
    defaultBudgetINR: 800000,
    colorTheme: 'Mango Leaf Green, Turmeric Yellow, Terracotta & White',
    colorPalette: [
      { name: 'Mango Leaf Green', hex: '#1B4332' },
      { name: 'Turmeric Yellow', hex: '#D5B463' },
      { name: 'Warm Ivory', hex: '#FAF6F0' },
      { name: 'Terracotta Red', hex: '#B4573B' },
      { name: 'Antique Gold', hex: '#C5A059' },
    ],
    culturalPreferences: {
      traditionId: 'griha-pravesh',
      regionOrState: 'All India',
      preferredLanguage: 'Hindi / Regional',
      ceremonyScheduleType: 'single-day',
      selectedCeremonies: [
        'Auspicious Entry with Right Foot (Shubh Muhurat)',
        'Vastu Shanti Puja & Navagraha Havan',
        'Doodh Ubalna (Sacred Milk Boiling Ritual)',
        'Threshold Toran & Alpana Blessing',
        'Family Celebratory Bhojan',
      ],
      auspiciousTimingPreference: 'Early Morning Shubh Muhurat Window',
      foodTradition: 'Satvik Traditional Feast',
      musicAndVibe: 'Live Classical Flute / Shenai Recording',
      decorStyle: 'Mango Leaf Toran, Marigold Strings & Threshold Alpana',
      isReligiousOrCultural: true,
      guestHospitalityNotes: 'Home walkthrough and small silver/brass coin or mithai box gift for guests',
    },
    defaultCeremonies: [
      {
        id: 'cer-griha-puja',
        name: 'Vastu Puja & Milk Boiling (Doodh Ubalna)',
        dayOffset: 0,
        timing: 'Morning 7:30 AM (Shubh Muhurat)',
        description: 'First entry into home holding sacred Kalash, boiling pure milk until it gently overflows to symbolize eternal abundance.',
        optional: false,
      },
      {
        id: 'cer-griha-bhojan',
        name: 'Family Celebratory Bhojan',
        dayOffset: 0,
        timing: 'Afternoon 12:30 PM',
        description: 'Warm satvik feast prepared and served to extended family and close neighbors.',
        optional: false,
      },
    ],
    defaultMilestones: [
      {
        title: 'Consult Astrologer / Priest for Exact Shubh Muhurat Date & Hour',
        offsetDays: -30,
        phase: 'concept-planning',
        priority: 'critical',
        category: 'permits',
        description: 'Verify planetary alignment and ensure home construction is 100% complete.',
        isCriticalPath: true,
      },
      {
        title: 'Contract Pure Vegetarian Caterer for Fresh Home Feast',
        offsetDays: -20,
        phase: 'vendor-curation',
        priority: 'critical',
        category: 'catering',
        description: 'Plan satvik lunch menu without onion/garlic for ceremonial purity.',
      },
      {
        title: 'Procure Fresh Mango Leaves, Marigold Toran & Puja Samagri',
        offsetDays: -7,
        phase: 'logistics-coordination',
        priority: 'high',
        category: 'decor',
        description: 'Order brass havan kund, pure cow ghee, camphor, and fresh floral entrance decor.',
      },
    ],
    defaultVendors: [
      {
        name: 'Satvik Catering & Traditional Halwai',
        service: 'catering',
        estimatedCostPercent: 0.42,
        questionsToAsk: [
          'Can you set up a compact buffet counter on the apartment balcony or terrace?',
        ],
        notes: 'Delicious homestyle cooking honoring religious sanctity.',
      },
      {
        name: 'Floral Toran & Rangoli Artisan',
        service: 'florals-decor',
        estimatedCostPercent: 0.22,
        questionsToAsk: [
          'Can you string fresh mango leaves and marigold torans on the main entrance threshold?',
        ],
        notes: 'Natural botanicals creating an uplifting spiritual presence.',
      },
    ],
    decorThemes: [
      'Traditional Mango Leaf Torans with Earthen Brass Diyas',
      'Intricate White Alpana / Rangoli at Threshold with Marigold Urli',
    ],
    culinaryTraditions: [
      'Satvik Vegetarian Feast (Puri, Chhole, Shahi Paneer, Jeera Rice, Boondi Raita)',
      'Auspicious Sweets (Moong Dal Halwa, Kheer, Besan Ladoos)',
    ],
    dietaryDefaults: ['Pure Vegetarian (No Onion/Garlic)', 'Satvik', 'Vegetarian'],
    musicOptions: ['Sacred Vedic Chanting & Flute', 'Classical Shehnai Instrumental'],
    whatIfAdviceTips: [
      'Ensure the kitchen gas stove and primary water lines are fully functional prior to the milk boiling ritual.',
    ],
  },

  // 11. Contemporary Non-Religious / Civil Celebration
  {
    id: 'contemporary-fusion',
    name: 'Contemporary Indo-Western Celebration (Secular / Fusion)',
    tagline: 'Chic rooftop ambiance, acoustic fusion, progressive Indian tapas, and personalized vows',
    category: 'wedding',
    region: 'Cosmopolitan India',
    description:
      'A stylish, inclusive contemporary celebration free of religious mandates, featuring modern botanical installations, craft cocktails, live indie-fusion soundscapes, and progressive dining.',
    defaultDays: 1,
    defaultGuestCount: 150,
    defaultBudgetINR: 2500000,
    colorTheme: 'Forest Velvet, Brushed Champagne, Terracotta Sand & Warm Ivory',
    colorPalette: [
      { name: 'Forest Velvet', hex: '#1B4332' },
      { name: 'Brushed Champagne', hex: '#D5B463' },
      { name: 'Terracotta Sand', hex: '#C86D51' },
      { name: 'Warm Ivory', hex: '#FAF6F0' },
      { name: 'Charcoal Slate', hex: '#151715' },
    ],
    culturalPreferences: {
      traditionId: 'contemporary-fusion',
      regionOrState: 'Metropolitan Area',
      preferredLanguage: 'English / Multilingual',
      ceremonyScheduleType: 'single-day',
      selectedCeremonies: [
        'Welcome Cocktail & Grazing Tables',
        'Personalized Vow Exchange & Ring Ceremony',
        'Sunset Champagne Toast',
        'Progressive Indian Tasting Banquet',
        'Live Indie-Fusion Band & DJ Afterparty',
      ],
      auspiciousTimingPreference: 'Sunset Golden Hour (Godhuli)',
      foodTradition: 'Contemporary Indo-Global Fusion',
      musicAndVibe: 'Live Indie Acoustic & Global Beats',
      decorStyle: 'Minimalist Contemporary Greenery & Filament Bulbs',
      isReligiousOrCultural: false,
      guestHospitalityNotes: 'Interactive craft mocktail/cocktail station and Polaroid memory corner',
    },
    defaultCeremonies: [
      {
        id: 'cer-vows',
        name: 'Personal Vows & Ring Ceremony',
        dayOffset: 0,
        timing: 'Evening 5:30 PM (Golden Hour)',
        description: 'Intimate ceremony with customized personal promises, live acoustic guitar, and ring exchange.',
        optional: false,
      },
      {
        id: 'cer-dinner-party',
        name: 'Progressive Tasting Dinner & Party',
        dayOffset: 0,
        timing: 'Evening 7:30 PM',
        description: 'Curated 5-course tasting menu paired with craft beverages, toasts, and live band set.',
        optional: false,
      },
    ],
    defaultMilestones: [
      {
        title: 'Book Rooftop Conservatory or Boutique Vineyard',
        offsetDays: -60,
        phase: 'concept-planning',
        priority: 'critical',
        category: 'venue',
        description: 'Verify weather contingency plan and evening curfew restrictions.',
        isCriticalPath: true,
      },
      {
        title: 'Contract Progressive Fusion Culinary Team & Mixologists',
        offsetDays: -45,
        phase: 'vendor-curation',
        priority: 'critical',
        category: 'catering',
        description: 'Design tasting menu with vegan, gluten-free, and allergen-safe pairings.',
        isCriticalPath: true,
      },
      {
        title: 'Book 5-Piece Indie Band & Vinyl DJ',
        offsetDays: -30,
        phase: 'vendor-curation',
        priority: 'high',
        category: 'entertainment',
        description: 'Review custom playlist including soul, indie pop, and modern retro.',
      },
    ],
    defaultVendors: [
      {
        name: 'Conservatory Rooftop & Glasshouse Lounge',
        service: 'venue',
        estimatedCostPercent: 0.32,
        questionsToAsk: [
          'What is the sound policy after 10:00 PM?',
          'Is an indoor breakout room available in case of rain?',
        ],
        notes: 'Stunning city views and architectural natural lighting.',
      },
      {
        name: 'Modern Gastronomy & Craft Beverage Guild',
        service: 'catering',
        estimatedCostPercent: 0.34,
        questionsToAsk: [
          'How do you accommodate specialized dietary requests (vegan, nut-free, keto)?',
        ],
        notes: 'Interactive food stations and inventive flavor combinations.',
      },
    ],
    decorThemes: [
      'Botanical Glasshouse with Filament Bulbs & Wildflowers',
      'Terracotta Minimalism with Brushed Gold Geometric Arches',
    ],
    culinaryTraditions: [
      'Progressive Indian Tapas (Truffle Naan Pizza, Pulled Jackfruit Tacos, Avocado Bhel)',
      'Small Plate Tasting (Smoked Paneer Steak, Coconut Sea Bass, Wild Mushroom Pulao)',
      'Modern Confectionery (Filter Coffee Tiramisu, Kulfi Gelato Bar, Salted Caramel Kaju)',
    ],
    dietaryDefaults: ['Vegetarian', 'Vegan', 'Gluten-Free', 'Nut-Free'],
    musicOptions: ['Live Indie-Jazz & Acoustic Pop', 'Vinyl Soul DJ', 'Contemporary Electro-Acoustic'],
    whatIfAdviceTips: [
      'Secular events offer complete flexibility; feel free to eliminate any traditional element that does not feel authentic to your story.',
    ],
  },
]

/**
 * Retrieves a template by its ID or returns a fallback Pan-Indian classic template.
 */
export function getIndianTemplateById(id: string): IndianEventTemplate {
  const found = INDIAN_EVENT_TEMPLATES.find((t) => t.id === id)
  if (found) return found
  return INDIAN_EVENT_TEMPLATES[0] // Bengali wedding as primary classic fallback
}

