import React from 'react'
import { BrandLogo } from './BrandLogo'
import { NAVIGATION_ITEMS } from '@/constants/navigation'
import { usePlanner } from '@/context/PlannerContext'
import { RefreshCw } from 'lucide-react'

export const Sidebar: React.FC = () => {
  const { currentSection, setCurrentSection, isSyncing, triggerManualSync } = usePlanner()

  return (
    <aside
      className="hidden md:flex flex-col w-64 lg:w-72 border-r border-ivory-300 bg-ivory-50/90 backdrop-blur-md h-screen sticky top-0 shrink-0 select-none z-20"
      aria-label="Main Navigation"
    >
      {/* Top Header / Wordmark */}
      <div className="p-6 border-b border-ivory-300/80">
        <BrandLogo />
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-charcoal-400 uppercase">
          Planner Workspace
        </div>
        {NAVIGATION_ITEMS.map((item) => {
          const isActive = currentSection === item.id
          const Icon = item.icon

          return (
            <button
              key={item.id}
              onClick={() => setCurrentSection(item.id)}
              className={`w-full group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-700 ${
                isActive
                  ? 'bg-forest-50 text-forest-900 border border-forest-200/70 shadow-subtle font-semibold'
                  : 'text-charcoal-600 hover:text-forest-900 hover:bg-ivory-200/70'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors shrink-0 ${
                    isActive
                      ? 'text-forest-700'
                      : 'text-charcoal-400 group-hover:text-forest-700'
                  }`}
                  aria-hidden="true"
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md ${
                    isActive
                      ? 'bg-gold-200/70 text-gold-900 border border-gold-300/60'
                      : 'bg-ivory-200 text-charcoal-600 border border-ivory-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Bottom Sync Engine USP Card */}
      <div className="p-4 border-t border-ivory-300/80">
        <div className="rounded-xl p-3.5 bg-forest-900 text-ivory-50 border border-forest-800 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gold-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Sync Engine Active
            </span>
            <button
              onClick={triggerManualSync}
              disabled={isSyncing}
              title="Recalculate sync states"
              className="p-1 rounded-md text-ivory-300 hover:text-ivory-50 hover:bg-forest-800 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-gold-400"
              aria-label="Trigger manual sync"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-gold-300' : ''}`}
              />
            </button>
          </div>
          <p className="text-xs text-ivory-200 leading-snug">
            Plans change. Budgets shift. Celebrio keeps everything in sync.
          </p>
        </div>
      </div>
    </aside>
  )
}
