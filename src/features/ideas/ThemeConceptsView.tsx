import React from 'react'
import {
  Sparkles,
  Check,
  AlertCircle,
  Coins,
  Palette,
  Utensils,
  Music,
  HeartHandshake,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react'
import { usePlanner } from '@/context/PlannerContext'
import { ThemeConcept, ConceptTier } from '@/types/concept'
import { Card, CardHeader, CardBody } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'

interface ThemeConceptsViewProps {
  onSelectConcept?: (conceptId: string) => void
}

const TIER_BADGES: Record<
  ConceptTier,
  { label: string; variant: 'forest' | 'terracotta' | 'gold'; desc: string }
> = {
  'budget-conscious': {
    label: 'Budget-Conscious',
    variant: 'forest',
    desc: 'Maximized savings & generous financial reserve',
  },
  'creative-distinctive': {
    label: 'Creative & Distinctive',
    variant: 'terracotta',
    desc: 'Signature aesthetic with bespoke guest touchpoints',
  },
  premium: {
    label: 'Premium Tier',
    variant: 'gold',
    desc: 'Uncompromising luxury & five-star hospitality standard',
  },
}

export const ThemeConceptsView: React.FC<ThemeConceptsViewProps> = ({ onSelectConcept }) => {
  const { activeEvent, themeConcepts, selectThemeConcept } = usePlanner()

  if (!activeEvent) {
    return (
      <div className="p-8 text-center text-charcoal-500">
        No active celebration selected.
      </div>
    )
  }

  const handleSelect = (concept: ThemeConcept) => {
    selectThemeConcept(concept.id)
    if (onSelectConcept) {
      onSelectConcept(concept.id)
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Editorial Header */}
      <div className="pb-4 border-b border-ivory-300">
        <div className="flex items-center gap-2 mb-1.5">
          <Badge variant="terracotta" size="sm">
            AI Architectural Curation
          </Badge>
          <span className="text-xs text-charcoal-500">
            Tailored to {activeEvent.title} ({activeEvent.category.replace('-', ' ')})
          </span>
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal-900 tracking-tight">
          Personalized Theme Concepts
        </h2>
        <p className="text-xs sm:text-sm text-charcoal-600 mt-1 max-w-3xl leading-relaxed">
          Three custom celebration concepts designed for your ${activeEvent.totalBudget.toLocaleString()}{' '}
          budget, {activeEvent.targetGuestCount} guests, and designated priorities. Select a concept to
          anchor your design language and budget allocations.
        </p>

        {/* Global Price Disclaimer Banner */}
        <div className="mt-4 p-3 rounded-xl bg-ivory-50 border border-ivory-300/80 flex items-start gap-2.5 text-xs text-charcoal-600">
          <ShieldAlert className="w-4 h-4 text-gold-600 shrink-0 mt-0.5" />
          <span>
            <strong>Pricing Notice:</strong> All figures displayed are intelligent estimate approximations
            derived from regional benchmarks and seasonal supplier averages. They are intended for
            strategic budgeting and are not formal vendor quotations.
          </span>
        </div>
      </div>

      {/* 3 Distinct Concepts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
        {themeConcepts.map((concept) => {
          const isSelected = activeEvent.selectedConceptId === concept.id
          const tierInfo = TIER_BADGES[concept.tier]

          return (
            <Card
              key={concept.id}
              variant="default"
              className={`flex flex-col h-full transition-all duration-300 relative ${
                isSelected
                  ? 'ring-2 ring-forest-700 border-forest-400 shadow-elevated bg-ivory-50'
                  : 'hover:border-forest-300 hover:shadow-card bg-ivory-50/80'
              }`}
            >
              {/* Selected Floating Pill */}
              {isSelected && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-forest-900 text-gold-300 shadow-card border border-forest-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Selected Concept
                  </span>
                </div>
              )}

              {/* Card Header */}
              <CardHeader className="flex-col items-start gap-2 pt-6">
                <div className="flex items-center justify-between w-full">
                  <Badge variant={tierInfo.variant} size="sm">
                    {tierInfo.label}
                  </Badge>
                  <span className="text-[11px] font-semibold text-charcoal-500">
                    {concept.costEstimation.percentOfBudget}% of budget
                  </span>
                </div>

                <div>
                  <h3 className="font-serif font-bold text-xl text-charcoal-900 mt-1">
                    {concept.title}
                  </h3>
                  <p className="text-xs font-medium text-forest-800 italic mt-0.5">
                    &ldquo;{concept.tagline}&rdquo;
                  </p>
                </div>
              </CardHeader>

              <CardBody className="space-y-6 flex-1 text-xs">
                {/* Concept Narrative */}
                <p className="text-charcoal-600 leading-relaxed">{concept.description}</p>

                {/* 1. Color Palette */}
                <div className="p-3.5 rounded-xl bg-ivory-100/70 border border-ivory-200">
                  <div className="flex items-center gap-1.5 font-semibold text-charcoal-800 mb-2.5">
                    <Palette className="w-3.5 h-3.5 text-forest-700" />
                    <span>Curated Color Palette</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {concept.colorPalette.map((color) => (
                      <div key={color.name} className="flex flex-col items-center text-center">
                        <div
                          className="w-full h-8 rounded-lg shadow-subtle border border-black/10 mb-1"
                          style={{ backgroundColor: color.hex }}
                          title={`${color.name}: ${color.hex}`}
                        />
                        <span className="text-[10px] font-semibold text-charcoal-800 truncate w-full">
                          {color.name}
                        </span>
                        <span className="text-[9px] text-charcoal-400 font-mono">
                          {color.hex}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Décor & Styling */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 font-semibold text-charcoal-800">
                    <Sparkles className="w-3.5 h-3.5 text-terracotta-500" />
                    <span>Décor &amp; Visual Architecture</span>
                  </div>
                  <div className="space-y-1.5 pl-4 border-l-2 border-ivory-300 text-charcoal-600">
                    <div>
                      <strong className="text-charcoal-800">Focal Point: </strong>
                      {concept.decor.focalPoint}
                    </div>
                    <div>
                      <strong className="text-charcoal-800">Lighting: </strong>
                      {concept.decor.lighting}
                    </div>
                    <div>
                      <strong className="text-charcoal-800">Table Settings: </strong>
                      {concept.decor.tableSettings}
                    </div>
                    <div>
                      <strong className="text-charcoal-800">Botanicals: </strong>
                      {concept.decor.botanicals}
                    </div>
                  </div>
                </div>

                {/* 3. Food & Beverage */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 font-semibold text-charcoal-800">
                    <Utensils className="w-3.5 h-3.5 text-forest-700" />
                    <span>Culinary &amp; Beverage Experience</span>
                  </div>
                  <div className="space-y-1.5 pl-4 border-l-2 border-ivory-300 text-charcoal-600">
                    <div>
                      <strong className="text-charcoal-800">Service: </strong>
                      {concept.foodAndBeverage.serviceStyle}
                    </div>
                    <div>
                      <strong className="text-charcoal-800">Highlights: </strong>
                      {concept.foodAndBeverage.highlights.join(' · ')}
                    </div>
                    <div>
                      <strong className="text-charcoal-800">Signature Drink: </strong>
                      {concept.foodAndBeverage.signatureDrink}
                    </div>
                  </div>
                </div>

                {/* 4. Entertainment */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 font-semibold text-charcoal-800">
                    <Music className="w-3.5 h-3.5 text-gold-600" />
                    <span>Entertainment &amp; Sound</span>
                  </div>
                  <div className="space-y-1.5 pl-4 border-l-2 border-ivory-300 text-charcoal-600">
                    <div>
                      <strong className="text-charcoal-800">Music: </strong>
                      {concept.entertainment.mainAct}
                    </div>
                    <div>
                      <strong className="text-charcoal-800">Interactive: </strong>
                      {concept.entertainment.interactiveElements.join(', ')}
                    </div>
                  </div>
                </div>

                {/* 5. Guest Experience & Hospitality */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 font-semibold text-charcoal-800">
                    <HeartHandshake className="w-3.5 h-3.5 text-terracotta-500" />
                    <span>Guest Experience &amp; Comfort</span>
                  </div>
                  <div className="space-y-1.5 pl-4 border-l-2 border-ivory-300 text-charcoal-600">
                    <div>
                      <strong className="text-charcoal-800">Arrival Moment: </strong>
                      {concept.guestExperience.arrivalMoment}
                    </div>
                    <div>
                      <strong className="text-charcoal-800">Keepsake: </strong>
                      {concept.guestExperience.takeawayFavor}
                    </div>
                    <div>
                      <strong className="text-charcoal-800">Accommodations: </strong>
                      {concept.guestExperience.comfortFeatures.join('; ')}
                    </div>
                  </div>
                </div>

                {/* 6. Cost Estimation */}
                <div className="p-3.5 rounded-xl bg-forest-50/60 border border-forest-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-forest-900 flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5 text-forest-700" />
                      Estimated Budget Implication
                    </span>
                    <span className="font-serif font-bold text-base text-forest-900">
                      ${concept.costEstimation.estimatedTotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-charcoal-600">
                    <span>Target Cap: ${activeEvent.totalBudget.toLocaleString()}</span>
                    <span
                      className={`font-semibold ${
                        concept.costEstimation.varianceFromBudget < 0
                          ? 'text-forest-700'
                          : 'text-charcoal-700'
                      }`}
                    >
                      {concept.costEstimation.varianceFromBudget < 0
                        ? `Saves $${Math.abs(
                            concept.costEstimation.varianceFromBudget,
                          ).toLocaleString()} buffer`
                        : 'Exact budget alignment'}
                    </span>
                  </div>
                  <p className="text-[10px] text-charcoal-400 mt-2 italic leading-tight">
                    * {concept.costEstimation.disclaimer}
                  </p>
                </div>

                {/* 7. Trade-offs */}
                <div className="space-y-2.5 pt-2">
                  <div className="text-xs font-semibold text-charcoal-800">
                    Strategic Trade-offs
                  </div>
                  <div className="space-y-1.5">
                    {concept.tradeoffs.advantages.map((adv) => (
                      <div
                        key={adv}
                        className="flex items-start gap-1.5 text-[11px] text-emerald-800"
                      >
                        <Check className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{adv}</span>
                      </div>
                    ))}
                    {concept.tradeoffs.compromises.map((comp) => (
                      <div
                        key={comp}
                        className="flex items-start gap-1.5 text-[11px] text-amber-800"
                      >
                        <AlertCircle className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
                        <span>{comp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardBody>

              {/* Action Button Footer */}
              <div className="p-5 border-t border-ivory-200 bg-ivory-100/50 rounded-b-2xl">
                <Button
                  variant={isSelected ? 'secondary' : 'primary'}
                  size="md"
                  onClick={() => handleSelect(concept)}
                  className="w-full"
                  leftIcon={
                    isSelected ? (
                      <Check className="w-4 h-4 text-forest-700" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-gold-300" />
                    )
                  }
                >
                  {isSelected ? 'Active Concept Selected' : 'Select This Concept'}
                </Button>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

