import React from 'react'
import {
  Sparkles,
  ArrowRight,
  Coins,
  SlidersHorizontal,
  CheckCircle2,
  Flower2,
  Palette,
} from 'lucide-react'
import { usePlanner } from '@/context/PlannerContext'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { INDIAN_EVENT_TEMPLATES } from '@/constants/indianEventTemplates'
import { LotusMotif, JaaliDivider } from '@/components/common/IndianMotifs'

import { EventCategory } from '@/types/event'

interface TraditionCardProps {
  title: string
  region: string
  description: string
  rituals: string[]
  colorTheme: string
  palette: string[]
  recommendedCategory: EventCategory
  onSelect: () => void
}

const TraditionCard: React.FC<TraditionCardProps> = ({
  title,
  region,
  description,
  rituals,
  colorTheme,
  palette,
  onSelect,
}) => (
  <Card
    variant="default"
    className="p-5 sm:p-6 flex flex-col justify-between hover:border-gold-400/80 transition-all duration-200 hover:shadow-card bg-ivory-50/90 relative overflow-hidden group"
  >
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-forest-100 text-forest-800 border border-forest-200/60">
          {region}
        </span>
        <div className="flex items-center gap-1">
          {palette.map((hex, i) => (
            <span
              key={i}
              className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs"
              style={{ backgroundColor: hex }}
              title={`Color ${i + 1}`}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-serif font-bold text-lg text-charcoal-900 group-hover:text-forest-900 transition-colors">
          {title}
        </h3>
        <p className="text-xs text-charcoal-600 mt-1.5 leading-relaxed">
          {description}
        </p>
      </div>

      <div className="pt-2 border-t border-ivory-200">
        <span className="text-[11px] font-semibold text-charcoal-700 block mb-1.5">
          Signature Rituals &amp; Styling:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {rituals.map((r, idx) => (
            <span
              key={idx}
              className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-ivory-200 text-charcoal-800 border border-ivory-300"
            >
              {r}
            </span>
          ))}
        </div>
      </div>
    </div>

    <div className="pt-4 mt-4 border-t border-ivory-200/80 flex items-center justify-between">
      <span className="text-[11px] text-forest-800 font-medium">
        Theme: {colorTheme}
      </span>
      <Button
        variant="secondary"
        size="sm"
        onClick={onSelect}
        rightIcon={<ArrowRight className="w-3 h-3" />}
        className="text-xs"
      >
        Plan This
      </Button>
    </div>
  </Card>
)

export const LandingWelcomeView: React.FC = () => {
  const {
    setCurrentSection,
    setIsCreateEventOpen,
  } = usePlanner()

  const handleStartPlanning = () => {
    setIsCreateEventOpen(true)
  }

  return (
    <div className="space-y-12 sm:space-y-16 animate-in fade-in duration-200 pb-12">
      {/* 1. Hero Showcase Section */}
      <div className="relative rounded-3xl p-6 sm:p-10 lg:p-14 bg-gradient-to-br from-ivory-50 via-ivory-100 to-ivory-200/80 border border-ivory-300 shadow-card overflow-hidden">
        {/* Subtle decorative architectural motif background */}
        <div className="absolute -top-10 -right-10 text-forest-900/5 pointer-events-none" aria-hidden="true">
          <LotusMotif className="w-80 h-80" />
        </div>
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none bg-repeat"
          style={{
            backgroundImage: `radial-gradient(#1B4332 1.5px, transparent 1.5px)`,
            backgroundSize: '24px 24px',
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-900 text-gold-300 border border-forest-700 text-xs font-semibold tracking-wide shadow-subtle">
            <Sparkles className="w-3.5 h-3.5 text-gold-400" />
            <span>INTELLIGENT CELEBRATION TECH FOR INDIA</span>
          </div>

          <div className="space-y-3">
            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-forest-950 leading-[1.12]">
              Every Tradition.<br />
              <span className="text-terracotta-600">Every Budget.</span> Every Celebration.
            </h1>
            <p className="text-sm sm:text-base text-charcoal-700 leading-relaxed font-sans max-w-2xl pt-2">
              From intimate Bengali Gaye Holud and grand Punjabi Sangeets to sacred South Indian Muhurthams, vibrant Gujarati Garba nights, and community Durga Pujas — <strong>Celebrio India</strong> keeps every ritual, budget, and supplier in perfect synchronization.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              variant="primary"
              size="lg"
              onClick={handleStartPlanning}
              leftIcon={<Flower2 className="w-4 h-4 text-gold-300" />}
              className="shadow-md hover:shadow-lg transition-shadow"
            >
              Plan Your Celebration
            </Button>

            <Button
              variant="secondary"
              size="lg"
              onClick={() => setCurrentSection('dashboard')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Open Planning Workspace
            </Button>

            <Button
              variant="terracotta"
              size="lg"
              onClick={() => setCurrentSection('simulator')}
              leftIcon={<SlidersHorizontal className="w-4 h-4" />}
            >
              Simulate What-If Shifts
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-4 text-xs font-medium text-charcoal-600 border-t border-ivory-300/80">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-forest-700" />
              Deterministic ₹ INR Lakhs &amp; Crores Engine
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-forest-700" />
              Pan-India Regional Cultural Workflows
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-forest-700" />
              Adaptive Constraint-Aware Replanning
            </span>
          </div>
        </div>
      </div>

      {/* 2. Three Pillars of Indian Event Technology */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-ivory-300 pb-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-forest-700">
              ENGINEERED FOR INDIA
            </span>
            <h2 className="font-serif text-2xl font-bold text-charcoal-900 mt-1">
              Why Indian Celebrations Need Adaptive Planning
            </h2>
          </div>
          <p className="text-xs text-charcoal-500 sm:max-w-md">
            Indian events involve multiple days, fluctuating guest counts, auspicious mahurats, and multi-generation expectations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card variant="default" className="p-6 space-y-3 bg-ivory-50/90 border-ivory-300">
            <div className="w-10 h-10 rounded-xl bg-forest-100 text-forest-800 flex items-center justify-center font-bold">
              <Coins className="w-5 h-5 text-forest-700" />
            </div>
            <h3 className="font-serif font-bold text-lg text-charcoal-900">
              Deterministic Budget Guardian
            </h3>
            <p className="text-xs text-charcoal-600 leading-relaxed">
              No hallucinated sums or arithmetic drift. Automatically splits Lakhs and Crores across royal catering, mandap florals, photography, jewelry, and ring-fences a guaranteed 8–15% contingency reserve.
            </p>
          </Card>

          <Card variant="default" className="p-6 space-y-3 bg-ivory-50/90 border-ivory-300">
            <div className="w-10 h-10 rounded-xl bg-terracotta-100 text-terracotta-800 flex items-center justify-center font-bold">
              <SlidersHorizontal className="w-5 h-5 text-terracotta-700" />
            </div>
            <h3 className="font-serif font-bold text-lg text-charcoal-900">
              Ripple-Effect Replanning
            </h3>
            <p className="text-xs text-charcoal-600 leading-relaxed">
              When 100 extra guests RSVP or your mahurat date shifts by two weeks, Celebrio auto-recalculates per-plate catering, flags urgent vendor contracts, and suggests smart savings without losing locked deposits.
            </p>
          </Card>

          <Card variant="default" className="p-6 space-y-3 bg-ivory-50/90 border-ivory-300">
            <div className="w-10 h-10 rounded-xl bg-gold-100 text-gold-900 flex items-center justify-center font-bold">
              <Palette className="w-5 h-5 text-gold-800" />
            </div>
            <h3 className="font-serif font-bold text-lg text-charcoal-900">
              Regional Cultural Intelligence
            </h3>
            <p className="text-xs text-charcoal-600 leading-relaxed">
              Built-in domain intelligence for Bengali Biye, Punjabi Sangeet, South Indian Muhurtham, Gujarati Dandiya, Durga Puja, and contemporary fusion celebrations with tailored dietary and accessibility needs.
            </p>
          </Card>
        </div>
      </div>

      <JaaliDivider />

      {/* 3. Regional Celebration Styles Showcase */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-ivory-300 pb-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-forest-700">
              CULTURAL ARCHETYPES
            </span>
            <h2 className="font-serif text-2xl font-bold text-charcoal-900 mt-1">
              Explore Regional Traditions &amp; Aesthetics
            </h2>
          </div>
          <span className="text-xs text-charcoal-500">
            Choose any tradition to launch an adaptive planning template.
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {INDIAN_EVENT_TEMPLATES.map((tmpl) => (
            <TraditionCard
              key={tmpl.id}
              title={tmpl.name}
              region={tmpl.region}
              description={tmpl.description}
              rituals={tmpl.culturalPreferences.selectedCeremonies ? tmpl.culturalPreferences.selectedCeremonies.slice(0, 5) : []}
              colorTheme={tmpl.colorTheme}
              palette={tmpl.colorPalette.map((p) => p.hex)}
              recommendedCategory={tmpl.category}
              onSelect={handleStartPlanning}
            />
          ))}
        </div>
      </div>

      {/* 4. Bottom Call to Action */}
      <div className="p-8 sm:p-10 rounded-2xl bg-forest-900 text-ivory-50 text-center space-y-4 shadow-elevated border border-forest-700 relative overflow-hidden">
        <h3 className="font-serif text-2xl sm:text-3xl font-bold text-ivory-50">
          Ready to Coordinate Your Celebration with Total Confidence?
        </h3>
        <p className="text-xs sm:text-sm text-ivory-200/90 max-w-xl mx-auto leading-relaxed">
          Create your celebration plan in under 2 minutes. Generate budget breakdowns in ₹ INR, critical-path timelines, and stress-test what-if scenarios with zero arithmetic hallucinations.
        </p>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <Button
            variant="primary"
            size="lg"
            onClick={handleStartPlanning}
            className="bg-gold-500 hover:bg-gold-600 text-forest-950 font-bold"
          >
            Create Your Celebration
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => setCurrentSection('dashboard')}
            className="border-ivory-300 text-ivory-100 hover:text-white hover:bg-forest-800"
          >
            Go to Active Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}

