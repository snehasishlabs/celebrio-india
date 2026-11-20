import { Heart, Cake, GlassWater, Building, type LucideIcon } from 'lucide-react'
import { EventCategory } from '@/types/event'

export interface CategoryOption {
  id: EventCategory
  label: string
  icon: LucideIcon
  desc: string
}

export const CATEGORY_OPTIONS: CategoryOption[] = [
  { id: 'wedding', label: 'Wedding', icon: Heart, desc: 'Multi-day ceremonial or contemporary wedding' },
  { id: 'birthday', label: 'Birthday', icon: Cake, desc: 'Milestone jubilee, 1st birthday, or gala' },
  { id: 'anniversary', label: 'Anniversary', icon: GlassWater, desc: 'Silver/golden jubilee or renewal of vows' },
  { id: 'community', label: 'Community Event', icon: Building, desc: 'Durga Puja, Diwali festival, or neighborhood gala' },
]

export const REGIONAL_TRADITIONS = [
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

export const DEFAULT_CEREMONIES_BY_TRADITION: Record<string, string[]> = {
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

export const PRIORITY_OPTIONS = [
  'Culinary Excellence & Live Counters',
  'Mandap & Floral Architecture',
  'Live Music, DJ & Dhol Artists',
  'Cinematic Photography & Film',
  'Guest Hospitality & Elder Comfort',
  'Artisan Invitations & Favors',
]

export const DIETARY_OPTIONS = [
  'Vegetarian',
  'Pure Vegetarian (No Onion/Garlic)',
  'Jain Specialty Menu',
  'Traditional Banana Leaf (Elai Saapadu)',
  'Halal Menu',
  'Vegan',
  'Gluten-Free',
  'Nut-Free',
]

export const ACCESSIBILITY_OPTIONS = [
  'Wheelchair Accessible',
  'Step-Free Entrance',
  'Wheelchair Ramp to Mandap / Stage',
  'Golf Cart Transit for Elders',
  'Quiet Sensory Zone for Seniors',
  'Accessible Restrooms',
]

export const THEME_PRESET_SUGGESTIONS = [
  'Royal Rajputana Heritage & Marigold',
  'Jasmine & Antique Brass Temple Elegance',
  'Alpona White & Terracotta Twilight',
  'Chikankari Ivory & Botanical Pastels',
  'Mirror-Work Garba & Sunset Gold',
  'Contemporary Indo-Western Rooftop',
]

export const INDIAN_CITIES = [
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

export const INDIAN_LANGUAGES = [
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

export const AUSPICIOUS_TIMINGS = [
  { id: 'brahma-muhurta', label: 'Brahma Muhurta (Dawn 4:30 AM – 7:00 AM)', desc: 'Traditional South Indian & Vedic dawn rituals' },
  { id: 'godhuli-lagna', label: 'Godhuli Lagna (Twilight Sunset)', desc: 'Traditional Bengali & North Indian sunset ceremonies' },
  { id: 'pradosh-kaal', label: 'Pradosh Kaal (Evening Twilight)', desc: 'Auspicious evening Lakshmi Puja & festivals' },
  { id: 'mid-morning', label: 'Mid-Morning Shubh Muhurat (9:30 AM – 12:00 PM)', desc: 'Lagnasohala, Anand Karaj & Griha Pravesh' },
  { id: 'flexible-secular', label: 'Flexible / Secular Schedule', desc: 'No astrological timing restrictions' },
]

export const WIZARD_STEPS = [
  { step: 1, label: 'Celebration Type' },
  { step: 2, label: 'Location & Dates' },
  { step: 3, label: 'Traditions & Rituals' },
  { step: 4, label: 'Budget & Guests' },
  { step: 5, label: 'Food & Access' },
  { step: 6, label: 'Theme & Review' },
]
