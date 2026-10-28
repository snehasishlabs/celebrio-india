import { CelebrationEvent } from '@/types/event'
import { ThemeConcept } from '@/types/concept'

const PRICE_DISCLAIMER =
  'Estimated approximation based on regional vendor averages. Not a verified commercial quotation.'

export function generateThemeConcepts(event: CelebrationEvent): ThemeConcept[] {
  const budget = event.totalBudget
  const category = event.category
  const currSymbol = event.currency === 'INR' ? '₹' : (event.currency === 'EUR' ? '€' : (event.currency === 'GBP' ? '£' : '$'))
  const themeHint = event.themePreference ? ` inspired by "${event.themePreference}"` : ''
  const dietaryHighlights = event.dietaryRequirements.length > 0
    ? `Dedicated menus tailored for ${event.dietaryRequirements.slice(0, 3).join(', ')}`
    : 'Seasonal chef-curated selections'
  const accessibilityHighlights = event.accessibilityRequirements.length > 0
    ? `Accessibility accommodations including ${event.accessibilityRequirements.slice(0, 2).join(' & ')}`
    : 'Comfort seating and barrier-free circulation'

  // Category specific customizations
  switch (category) {
    case 'wedding':
      return [
        {
          id: `concept-${event.id}-budget`,
          eventId: event.id,
          tier: 'budget-conscious',
          title: 'Botanical Warmth & Candlelight',
          tagline: 'Refined intimacy with generous financial cushion',
          description: `An elegant celebration emphasizing architectural greenery, ambient candlelight, and shared dining${themeHint}.`,
          colorPalette: [
            { name: 'Warm Ivory', hex: '#FAF6F0' },
            { name: 'Forest Moss', hex: '#2D5A43' },
            { name: 'Muted Amber', hex: '#D8A059' },
            { name: 'Linen Taupe', hex: '#D8CEBF' },
          ],
          decor: {
            focalPoint: 'Cascading greenery archway with warm taper candles',
            lighting: 'Cluster pillar candles in brass hurricanes and soft perimeter wash',
            tableSettings: 'Natural flax linen runners, warm terracotta bud vases, and calligraphed kraft menus',
            botanicals: 'Locally foraged olive branches, eucalyptus garland, and baby’s breath clouds',
          },
          foodAndBeverage: {
            serviceStyle: 'Family-style artisanal sharing platters to foster guest connection',
            highlights: ['Braised short ribs with polenta', 'Wild mushroom risotto', dietaryHighlights],
            signatureDrink: 'Spiced Pear Spritz with Rosemary & Sparkling Wine',
          },
          entertainment: {
            mainAct: 'Acoustic guitar & cello duo for ceremony and cocktail hour, transitioning to DJ',
            interactiveElements: ['Vintage audio guestbook telephone', 'Polaroid memory collage board'],
          },
          guestExperience: {
            arrivalMoment: 'Warm spiced cider or champagne greeting accompanied by classical strings',
            takeawayFavor: 'Mini jars of regional wildflower honey with personalized wax seal',
            comfortFeatures: ['Wrap blankets for twilight reception', accessibilityHighlights],
          },
          costEstimation: {
            estimatedTotal: Math.round(budget * 0.82),
            varianceFromBudget: -Math.round(budget * 0.18),
            percentOfBudget: 82,
            disclaimer: PRICE_DISCLAIMER,
          },
          tradeoffs: {
            advantages: [
              `Preserves ~${currSymbol}${Math.round(budget * 0.18).toLocaleString()} as an untouched emergency buffer`,
              'Cozy, authentic ambiance with minimal rigid production stress',
              'Fast load-in and simplified setup logistics',
            ],
            compromises: [
              'Uses in-season local foliage rather than exotic imported blooms',
              'Family-style dining instead of individual synchronized plate service',
            ],
          },
        },
        {
          id: `concept-${event.id}-creative`,
          eventId: event.id,
          tier: 'creative-distinctive',
          title: 'Artisan Glasshouse & Terracotta Twilight',
          tagline: 'Distinctive architectural styling and bespoke guest interactions',
          description: `An immersive sensory celebration blending rich earthy terracotta, ambient fairy luminescence, and culinary theater${themeHint}.`,
          colorPalette: [
            { name: 'Terracotta Rust', hex: '#C86D51' },
            { name: 'Deep Sage', hex: '#1B4332' },
            { name: 'Antique Gold', hex: '#C5A059' },
            { name: 'Blush Sand', hex: '#F4D4CA' },
          ],
          decor: {
            focalPoint: 'Suspended botanical geometric installation illuminated with filament bulbs',
            lighting: 'Bespoke pin-spotting on centerpieces and amber bistro fairy canopy',
            tableSettings: 'Matte terracotta ceramic chargers, brushed gold flatware, and deckle-edge cotton menus',
            botanicals: 'Terracotta urns with garden roses, dried palms, and cascading jasmine',
          },
          foodAndBeverage: {
            serviceStyle: 'Interactive chef tasting stations paired with sommelier table pours',
            highlights: ['Pan-seared sea bass with saffron emulsion', 'Handmade burrata ravioli', dietaryHighlights],
            signatureDrink: 'Smoked Blood Orange Old Fashioned & Lavender Elderflower Fizz',
          },
          entertainment: {
            mainAct: '5-piece modern indie-jazz fusion collective with brass horn section',
            interactiveElements: ['Live watercolor guest portrait artist', 'Custom fragrance blending bar'],
          },
          guestExperience: {
            arrivalMoment: 'Champagne tower pour upon entering the conservatory foyer',
            takeawayFavor: 'Hand-poured soy candle with the celebration signature botanical scent',
            comfortFeatures: ['Lounge seating vignettes with velvet cushions', accessibilityHighlights],
          },
          costEstimation: {
            estimatedTotal: Math.round(budget * 0.98),
            varianceFromBudget: -Math.round(budget * 0.02),
            percentOfBudget: 98,
            disclaimer: PRICE_DISCLAIMER,
          },
          tradeoffs: {
            advantages: [
              'Highly photogenic aesthetic with memorable tactile guest experiences',
              'Flawless on-budget execution utilizing every dollar with intentionality',
              'Tailored specifically to couple’s personal narrative and priorities',
            ],
            compromises: [
              'Requires dedicated coordinator for multiple interactive vendor timelines',
              'Moderate setup lead time (minimum 4-hour pre-event load-in window)',
            ],
          },
        },
        {
          id: `concept-${event.id}-premium`,
          eventId: event.id,
          tier: 'premium',
          title: 'Regal Velvet & Gilded Conservatory',
          tagline: 'Uncompromising luxury, synchronized white-glove hospitality',
          description: `The pinnacle of celebratory elegance: 4-course French service, dramatic floral architecture, and 8-piece orchestral sound${themeHint}.`,
          colorPalette: [
            { name: 'Midnight Forest', hex: '#0E241B' },
            { name: 'Burnished Gold', hex: '#D4AF37' },
            { name: 'Royal Ivory', hex: '#FDFAF6' },
            { name: 'Deep Burgundy', hex: '#581825' },
          ],
          decor: {
            focalPoint: 'Towering floral arbor of white garden roses and orchid cascades',
            lighting: 'Custom crystal chandeliers hung from structural beams with architectural uplighting',
            tableSettings: 'Gold-rimmed French porcelain, cut crystal stemware, and custom embroidered monogram napkins',
            botanicals: 'Lush imported garden roses, calla lilies, and Italian ruscus tree installations',
          },
          foodAndBeverage: {
            serviceStyle: 'Synchronized white-glove 4-course plated service with French dome reveals',
            highlights: ['Prime beef tenderloin with truffle demi-glace', 'Lobster tail carpaccio', dietaryHighlights],
            signatureDrink: 'Vintage Rosé Champagne poured from jeroboams with spun gold rim',
          },
          entertainment: {
            mainAct: '8-piece high-energy showband with full brass section and choreographed medleys',
            interactiveElements: ['Late-night caviar & champagne cart', 'Slow-motion video portrait booth'],
          },
          guestExperience: {
            arrivalMoment: 'White-glove valet greeting, hand towel service, and caviar amuse-bouche',
            takeawayFavor: 'Custom embossed velvet keepsake box with Parisian artisanal macarons',
            comfortFeatures: ['Dedicated concierge team for guest assistance', accessibilityHighlights],
          },
          costEstimation: {
            estimatedTotal: budget,
            varianceFromBudget: 0,
            percentOfBudget: 100,
            disclaimer: PRICE_DISCLAIMER,
          },
          tradeoffs: {
            advantages: [
              'Unrivaled luxury impression and seamless hospitality standard',
              'Highest caliber photography, dining, and live sound production',
              'Leaves guests with an unforgettable, top-tier celebratory memory',
            ],
            compromises: [
              'Exhausts full budget cap; requires disciplined adherence to locked guest count',
              'Mandates rigid vendor contracts with zero room for late cancellations',
            ],
          },
        },
      ]

    case 'birthday':
      return [
        {
          id: `concept-${event.id}-budget`,
          eventId: event.id,
          tier: 'budget-conscious',
          title: 'Golden Hour Garden Gathering',
          tagline: 'Casual sophistication, music, and vibrant social energy',
          description: `A spirited birthday gathering celebrating with craft beverages, lawn games, and lively acoustic rhythms${themeHint}.`,
          colorPalette: [
            { name: 'Sunshine Ochre', hex: '#E5A93C' },
            { name: 'Olive Leaf', hex: '#3B5838' },
            { name: 'Cream Cotton', hex: '#FAF6ED' },
            { name: 'Sunset Terracotta', hex: '#C86D51' },
          ],
          decor: {
            focalPoint: 'Communal wooden feasting pergola with bistro festoon festivity',
            lighting: 'Festoon globe string lights and warm fire pits for evening glow',
            tableSettings: 'Wooden trestle tables, amber glassware, and potted herb centerpieces',
            botanicals: 'Sunflowers, rosemary sprigs, and dried lavender bunches',
          },
          foodAndBeverage: {
            serviceStyle: 'Wood-fired gourmet pizza ovens & craft beer flights',
            highlights: ['Artisan Neapolitan pizzas with hot honey', 'Crispy seasonal salads', dietaryHighlights],
            signatureDrink: 'Bourbon Peach Iced Tea with Fresh Mint',
          },
          entertainment: {
            mainAct: 'High-energy acoustic trio performing crowd-pleasing anthems',
            interactiveElements: ['Custom cornhole boards', 'Polaroid birthday memory book'],
          },
          guestExperience: {
            arrivalMoment: 'Welcome craft brew or sparkling cider poured into take-home etched glass',
            takeawayFavor: 'Custom branded spice rub or potted succulent',
            comfortFeatures: ['Soft flannel blankets by fire pits', accessibilityHighlights],
          },
          costEstimation: {
            estimatedTotal: Math.round(budget * 0.8),
            varianceFromBudget: -Math.round(budget * 0.2),
            percentOfBudget: 80,
            disclaimer: PRICE_DISCLAIMER,
          },
          tradeoffs: {
            advantages: [
              `Leaves $${Math.round(budget * 0.2).toLocaleString()} unspent for unexpected surprises`,
              'Relaxed, fun atmosphere where guests mingle freely without rigid formality',
            ],
            compromises: [
              'Self-service beverage station instead of dedicated mixologists',
            ],
          },
        },
        {
          id: `concept-${event.id}-creative`,
          eventId: event.id,
          tier: 'creative-distinctive',
          title: 'Speakeasy Velvet & Vinyl Soiree',
          tagline: 'Intriguing retro glamour and artisanal craft mixology',
          description: `An unforgettable milestone birthday styled after a hidden 1930s jazz club with secret password and vinyl spins${themeHint}.`,
          colorPalette: [
            { name: 'Deep Burgundy', hex: '#4A1521' },
            { name: 'Vintage Brass', hex: '#C5A059' },
            { name: 'Obsidian Black', hex: '#1C1917' },
            { name: 'Rich Ochre', hex: '#D97706' },
          ],
          decor: {
            focalPoint: 'Backlit brass back-bar with crystal decanters and custom neon signage',
            lighting: 'Low-light amber table lamps and warm art deco sconces',
            tableSettings: 'Velvet lounge banquettes, leather coasters, and brass matchstrikers',
            botanicals: 'Deep dark calla lilies and bronze magnolia leaves',
          },
          foodAndBeverage: {
            serviceStyle: 'Roaming savory dim sum & passed gourmet small plates',
            highlights: ['Wagyu beef sliders with truffle aioli', 'Smoked duck breast crostini', dietaryHighlights],
            signatureDrink: 'Barrel-aged Mezcal Negroni with flamed orange twist',
          },
          entertainment: {
            mainAct: 'Vinyl DJ spinning funk, soul, and rare grooves on turntables',
            interactiveElements: ['Custom vinyl listening station', 'Secret poker lounge corner'],
          },
          guestExperience: {
            arrivalMoment: 'Secret entrance door with bespoke password challenge and welcome coupe',
            takeawayFavor: 'Mini bottle of house-infused spiced bitters with recipe card',
            comfortFeatures: ['Plush velvet lounge corners', accessibilityHighlights],
          },
          costEstimation: {
            estimatedTotal: Math.round(budget * 0.97),
            varianceFromBudget: -Math.round(budget * 0.03),
            percentOfBudget: 97,
            disclaimer: PRICE_DISCLAIMER,
          },
          tradeoffs: {
            advantages: [
              'Unmatched atmosphere and conversational buzz among guests',
              'Immersive theme that feels custom-crafted for the milestone celebrant',
            ],
            compromises: [
              'Requires low-light venue approval and specialized mixologist booking',
            ],
          },
        },
        {
          id: `concept-${event.id}-premium`,
          eventId: event.id,
          tier: 'premium',
          title: 'Metropolitan Rooftop Champagne Extravaganza',
          tagline: 'High-altitude luxury, live sax, and skyline illumination',
          description: `A landmark birthday celebration framed against the sparkling city skyline with premium oyster bars and live brass beats${themeHint}.`,
          colorPalette: [
            { name: 'Night Sky Navy', hex: '#0F172A' },
            { name: 'Brushed Gold', hex: '#EAB308' },
            { name: 'Ivory Shimmer', hex: '#F8FAFC' },
            { name: 'Emerald Velvet', hex: '#064E3B' },
          ],
          decor: {
            focalPoint: 'Illuminated kinetic mirror backdrop for celebration toasts',
            lighting: 'Architectural skyline uplighting, laser ambient accents, and warm heat lamps',
            tableSettings: 'Black quartz cocktail high-tops with mirrored trays and crystal candleholders',
            botanicals: 'Architectural white orchids and trailing asparagus fern',
          },
          foodAndBeverage: {
            serviceStyle: 'Raw bar oyster shucking station & 5-star flying buffet',
            highlights: ['Pacific oysters shucked to order', 'A5 Wagyu skewers', dietaryHighlights],
            signatureDrink: 'Grand Cru Champagne & Smoked Rosemary Gin Cocktails',
          },
          entertainment: {
            mainAct: 'DJ performing in tandem with live electric saxophonist and percussionist',
            interactiveElements: ['360-degree video platform', 'Live custom cigar rolling station'],
          },
          guestExperience: {
            arrivalMoment: 'Private elevator express greeting with flutes of vintage Champagne',
            takeawayFavor: 'Personalized engraved crystal rocks glass',
            comfortFeatures: ['Heated rooftop lounge zones', accessibilityHighlights],
          },
          costEstimation: {
            estimatedTotal: budget,
            varianceFromBudget: 0,
            percentOfBudget: 100,
            disclaimer: PRICE_DISCLAIMER,
          },
          tradeoffs: {
            advantages: [
              'Astonishing skyline views and elite nightlife aesthetic',
              'Seamless luxury standard that wows every attendee',
            ],
            compromises: [
              'Requires strict weather contingency backup plan for rooftop venues',
            ],
          },
        },
      ]

    case 'anniversary':
      return [
        {
          id: `concept-${event.id}-budget`,
          eventId: event.id,
          tier: 'budget-conscious',
          title: 'Memory Lane Vineyard Picnic',
          tagline: 'Heartfelt storytelling, acoustic strings, and regional vintages',
          description: `A romantic outdoor gathering celebrating milestones through personal memorabilia and farmstead wines${themeHint}.`,
          colorPalette: [
            { name: 'Muted Rose', hex: '#BE185D' },
            { name: 'Warm Cream', hex: '#FFFBEB' },
            { name: 'Earthy Sage', hex: '#4D7C0F' },
            { name: 'Antique Gold', hex: '#D97706' },
          ],
          decor: {
            focalPoint: 'Gallery wall of framed milestone photographs spanning the decades',
            lighting: 'Fairy light canopies draped through orchard trees',
            tableSettings: 'Wooden communal tables with linen runners and wildflower arrangements',
            botanicals: 'Garden roses, lavender, and rosemary stems',
          },
          foodAndBeverage: {
            serviceStyle: 'Artisan cheese, charcuterie, and warm rustic breads',
            highlights: ['Local creamery cheeses', 'Heirloom tomato tarts', dietaryHighlights],
            signatureDrink: 'Elderflower Sparkling Rosé Punch',
          },
          entertainment: {
            mainAct: 'Acoustic violin and acoustic guitar duo playing couple’s favorite era hits',
            interactiveElements: ['Storytelling microphone and guest memory book'],
          },
          guestExperience: {
            arrivalMoment: 'Chilled rosé flute and guided tour of the memory gallery',
            takeawayFavor: 'Small personalized wine bottle with anniversary custom vintage label',
            comfortFeatures: ['Padded garden chair cushions', accessibilityHighlights],
          },
          costEstimation: {
            estimatedTotal: Math.round(budget * 0.85),
            varianceFromBudget: -Math.round(budget * 0.15),
            percentOfBudget: 85,
            disclaimer: PRICE_DISCLAIMER,
          },
          tradeoffs: {
            advantages: [
              'Deep emotional connection and personal storytelling focus',
              `Saves $${Math.round(budget * 0.15).toLocaleString()} for a future anniversary trip`,
            ],
            compromises: [
              'Daytime vineyard setting; earlier curfew than urban halls',
            ],
          },
        },
        {
          id: `concept-${event.id}-creative`,
          eventId: event.id,
          tier: 'creative-distinctive',
          title: 'Golden Era Dinner Club',
          tagline: 'Retro romance, candlelit cabaret, and nostalgic elegance',
          description: `Step back into mid-century supper club charm with velvet booths, classic steakhouse delicacies, and candlelit toasts${themeHint}.`,
          colorPalette: [
            { name: 'Burgundy Velvet', hex: '#831843' },
            { name: 'Champagne Gold', hex: '#FDE047' },
            { name: 'Charcoal Black', hex: '#18181B' },
            { name: 'Soft Pearl', hex: '#F4F4F5' },
          ],
          decor: {
            focalPoint: 'Curved velvet banquettes framing an intimate mahogany toast stage',
            lighting: 'Tabletop pleated silk lamps and warm perimeter amber glow',
            tableSettings: 'Heavy silver cutlery, crisp white double-damask linens, and crystal flutes',
            botanicals: 'Single long-stem burgundy roses in sterling silver bud vases',
          },
          foodAndBeverage: {
            serviceStyle: '3-course seated dinner club menu with tableside baked Alaska finish',
            highlights: ['Chateaubriand steak with béarnaise', 'Lobster thermidor bites', dietaryHighlights],
            signatureDrink: 'Classic Vesper Martini & French 75 in etched crystal',
          },
          entertainment: {
            mainAct: 'Live jazz crooner and piano trio performing classic Great American Songbook',
            interactiveElements: ['Vintage black & white portrait photo studio'],
          },
          guestExperience: {
            arrivalMoment: 'Velvet curtain reveal and personalized escort to reserved table booth',
            takeawayFavor: 'Box of two artisanal dark chocolate truffles infused with cognac',
            comfortFeatures: ['Generous booth seating and acoustic dampening', accessibilityHighlights],
          },
          costEstimation: {
            estimatedTotal: Math.round(budget * 0.96),
            varianceFromBudget: -Math.round(budget * 0.04),
            percentOfBudget: 96,
            disclaimer: PRICE_DISCLAIMER,
          },
          tradeoffs: {
            advantages: [
              'Intimate, cinematic atmosphere honoring the depth of the milestone',
              'Sublime acoustics that make every speech crystal clear',
            ],
            compromises: [
              'Space requires careful seating chart management for sightlines',
            ],
          },
        },
        {
          id: `concept-${event.id}-premium`,
          eventId: event.id,
          tier: 'premium',
          title: 'The Diamond Jubilee Gala',
          tagline: 'Grand ballroom grandeur, symphony strings, and Michelin dining',
          description: `A majestic black-tie gala honoring lasting love with 5-course culinary excellence and orchestral fanfare${themeHint}.`,
          colorPalette: [
            { name: 'Platinum Silver', hex: '#E2E8F0' },
            { name: 'Gilded Brass', hex: '#D97706' },
            { name: 'Royal Forest', hex: '#14532D' },
            { name: 'Warm Alabaster', hex: '#FFFFFF' },
          ],
          decor: {
            focalPoint: '12-foot floral cascading monument flanking the couple’s honor table',
            lighting: 'Grand crystal chandeliers with programmable architectural warmth',
            tableSettings: 'Platinum-rimmed bone china, Waterford crystal, and embroidered linens',
            botanicals: 'Abundant white peonies, avalanche roses, and cascading phalaenopsis orchids',
          },
          foodAndBeverage: {
            serviceStyle: 'Michelin-grade 5-course seated dining with paired prestige cuvées',
            highlights: ['Chilean sea bass with caviar sauce', 'Dry-aged beef Rossini with foie gras', dietaryHighlights],
            signatureDrink: 'Prestige Millésimé Champagne with 24k edible gold dust',
          },
          entertainment: {
            mainAct: '10-piece chamber orchestra opening for a 7-piece swing band',
            interactiveElements: ['Curated documentary video screening of the couple’s life journey'],
          },
          guestExperience: {
            arrivalMoment: 'Red carpet step-and-repeat with champagne sommelier greeting',
            takeawayFavor: 'Custom embossed leather-bound keepsake anniversary album',
            comfortFeatures: ['Full VIP white-glove table service', accessibilityHighlights],
          },
          costEstimation: {
            estimatedTotal: budget,
            varianceFromBudget: 0,
            percentOfBudget: 100,
            disclaimer: PRICE_DISCLAIMER,
          },
          tradeoffs: {
            advantages: [
              'Once-in-a-lifetime landmark scale that pays ultimate tribute',
              'Spectacular visual and culinary grandeur',
            ],
            compromises: [
              'Requires formal black-tie dress code coordination for all guests',
            ],
          },
        },
      ]

    case 'community':
    default:
      return [
        {
          id: `concept-${event.id}-budget`,
          eventId: event.id,
          tier: 'budget-conscious',
          title: 'Civic Commons Open Fair',
          tagline: 'Grassroots energy, local vendors, and open-air connection',
          description: `A community celebration designed for high inclusivity, neighborhood camaraderie, and cost-effective modular stalls${themeHint}.`,
          colorPalette: [
            { name: 'Community Blue', hex: '#2563EB' },
            { name: 'Meadow Green', hex: '#16A34A' },
            { name: 'Warm Sunlight', hex: '#CA8A04' },
            { name: 'Crisp Chalk', hex: '#F8FAFC' },
          ],
          decor: {
            focalPoint: 'Festive community mural board painted live during the event',
            lighting: 'Bistro string festoons between trees and portable lantern stations',
            tableSettings: 'Picnic tables with bright gingham runners and sunflower centerpieces',
            botanicals: 'Native potted plants later raffled off to neighborhood schools',
          },
          foodAndBeverage: {
            serviceStyle: 'Curated neighborhood food trucks & communal lemonade/cider kegs',
            highlights: ['Woodfired flatbreads', 'Street tacos', dietaryHighlights],
            signatureDrink: 'Honey Lavender Lemonade & Sparking Iced Green Tea',
          },
          entertainment: {
            mainAct: 'Local community youth orchestra followed by acoustic singer-songwriters',
            interactiveElements: ['Interactive community timeline wall', 'Kids craft creation corner'],
          },
          guestExperience: {
            arrivalMoment: 'Welcome welcome-tote with schedule map and commemorative festival pin',
            takeawayFavor: 'Seed packets for native pollinator wildflowers',
            comfortFeatures: ['Step-free accessibility ramps and shaded quiet seating tents', accessibilityHighlights],
          },
          costEstimation: {
            estimatedTotal: Math.round(budget * 0.8),
            varianceFromBudget: -Math.round(budget * 0.2),
            percentOfBudget: 80,
            disclaimer: PRICE_DISCLAIMER,
          },
          tradeoffs: {
            advantages: [
              `Protects 20% ($${Math.round(budget * 0.2).toLocaleString()}) for neighborhood community fund`,
              'Welcoming, family-friendly, and accessible for diverse age groups',
            ],
            compromises: [
              'Relies on outdoor park weather and volunteer logistics support',
            ],
          },
        },
        {
          id: `concept-${event.id}-creative`,
          eventId: event.id,
          tier: 'creative-distinctive',
          title: 'Urban Lantern & Artisan Night Market',
          tagline: 'Vibrant cultural illumination, live makers, and world street food',
          description: `Transform a community venue into a nocturnal wonderland of lantern illumination, artisan popups, and world music${themeHint}.`,
          colorPalette: [
            { name: 'Indigo Night', hex: '#1E1B4B' },
            { name: 'Lantern Amber', hex: '#F59E0B' },
            { name: 'Terracotta Clay', hex: '#C86D51' },
            { name: 'Mint Jade', hex: '#10B981' },
          ],
          decor: {
            focalPoint: '100-lantern canopy tunnel entrance illuminating the pathway',
            lighting: 'Suspended paper lanterns and projection-mapped cultural animations',
            tableSettings: 'Bespoke wooden standing bars with ceramic flower pots',
            botanicals: 'Bamboos, ferns, and seasonal flowering branches',
          },
          foodAndBeverage: {
            serviceStyle: 'Multi-cultural street food stations representing local culinary cultures',
            highlights: ['Artisan baos', 'Wood-fired empanadas', dietaryHighlights],
            signatureDrink: 'Spiced Hibiscus Lime Cooler & Ginger Mocktail',
          },
          entertainment: {
            mainAct: 'World music fusion ensemble featuring percussionists and brass',
            interactiveElements: ['Live printmaking workshop with tote bags', 'Community memory audio booth'],
          },
          guestExperience: {
            arrivalMoment: 'Entry through illuminated lantern gate with interactive light stick',
            takeawayFavor: 'Screenprinted community commemorative poster',
            comfortFeatures: ['Dedicated quiet sensory area and universal mobility paths', accessibilityHighlights],
          },
          costEstimation: {
            estimatedTotal: Math.round(budget * 0.95),
            varianceFromBudget: -Math.round(budget * 0.05),
            percentOfBudget: 95,
            disclaimer: PRICE_DISCLAIMER,
          },
          tradeoffs: {
            advantages: [
              'Vibrant night market buzz that delights all generations',
              'Strong promotion of local diverse small businesses',
            ],
            compromises: [
              'Requires coordinated municipal permitting and electrical generators',
            ],
          },
        },
        {
          id: `concept-${event.id}-premium`,
          eventId: event.id,
          tier: 'premium',
          title: 'The Civic Luminary Gala',
          tagline: 'Honoring civic leadership with symphonic grandeur and awards dining',
          description: `A prestigious community milestone honoring champions with orchestral fanfare, seated dinner, and civic keynotes${themeHint}.`,
          colorPalette: [
            { name: 'Regal Navy', hex: '#1E3A8A' },
            { name: 'Civic Gold', hex: '#EAB308' },
            { name: 'Pristine White', hex: '#FFFFFF' },
            { name: 'Deep Bronze', hex: '#78350F' },
          ],
          decor: {
            focalPoint: 'Illuminated glass award stage with high-definition media screen',
            lighting: 'DMX theatrical stage lighting with warm pin-spotting on banquet tables',
            tableSettings: 'Formal round banquet tables with gold chiavari chairs and satin linens',
            botanicals: 'Substantial floral centerpieces with white lilies and blue delphiniums',
          },
          foodAndBeverage: {
            serviceStyle: '3-course synchronized plated banquet service',
            highlights: ['Braised local beef with root vegetables', 'Pan-roasted barramundi', dietaryHighlights],
            signatureDrink: 'Blueberry Thyme Sparkling Mocktail & Regional Pinot Noir',
          },
          entertainment: {
            mainAct: 'Regional symphony chamber ensemble and keynote civic awards presentation',
            interactiveElements: ['Digital silent auction for community foundation', 'Step-and-repeat photography'],
          },
          guestExperience: {
            arrivalMoment: 'Champagne and sparkling elderflower reception in grand rotunda',
            takeawayFavor: 'Commemorative engraved civic milestone medallion in velvet box',
            comfortFeatures: ['Live ASL interpretation, hearing loops, and accessible seating', accessibilityHighlights],
          },
          costEstimation: {
            estimatedTotal: budget,
            varianceFromBudget: 0,
            percentOfBudget: 100,
            disclaimer: PRICE_DISCLAIMER,
          },
          tradeoffs: {
            advantages: [
              'Elevates the community initiative to top-tier institutional prestige',
              'Maximizes fundraising and donor recognition impact',
            ],
            compromises: [
              'Formal seating restricts spontaneous drop-in attendance',
            ],
          },
        },
      ]
  }
}

