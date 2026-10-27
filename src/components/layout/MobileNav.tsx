import React, { useEffect } from 'react'
import { X, RefreshCw } from 'lucide-react'
import { BrandLogo } from './BrandLogo'
import { NAVIGATION_ITEMS } from '@/constants/navigation'
import { usePlanner } from '@/context/PlannerContext'

export const MobileNav: React.FC = () => {
  const {
    currentSection,
    setCurrentSection,
    isMobileNavOpen,
    setIsMobileNavOpen,
    isSyncing,
    triggerManualSync,
  } = usePlanner()

  // Close drawer on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileNavOpen) {
        setIsMobileNavOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMobileNavOpen, setIsMobileNavOpen])

  if (!isMobileNavOpen) return null

  return (
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-charcoal-900/40 backdrop-blur-sm transition-opacity"
        onClick={() => setIsMobileNavOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-72 max-w-[80vw] bg-ivory-50 border-r border-ivory-300 shadow-modal flex flex-col z-10 animate-in slide-in-from-left duration-200">
        {/* Top Header */}
        <div className="p-4 border-b border-ivory-300/80 flex items-center justify-between">
          <BrandLogo />
          <button
            onClick={() => setIsMobileNavOpen(false)}
            className="p-1.5 rounded-lg text-charcoal-500 hover:text-charcoal-800 hover:bg-ivory-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-700"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAVIGATION_ITEMS.map((item) => {
            const isActive = currentSection === item.id
            const Icon = item.icon

            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentSection(item.id)
                  setIsMobileNavOpen(false)
                }}
                className={`w-full group flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-forest-50 text-forest-900 border border-forest-200 font-semibold'
                    : 'text-charcoal-600 hover:text-forest-900 hover:bg-ivory-200/60'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-forest-700' : 'text-charcoal-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-gold-100 text-gold-800 border border-gold-200">
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-ivory-300/80 bg-ivory-100/50">
          <div className="rounded-xl p-3 bg-forest-900 text-ivory-50 text-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-semibold uppercase text-gold-300 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Adaptive Sync
              </span>
              <button
                onClick={triggerManualSync}
                disabled={isSyncing}
                className="text-ivory-300 hover:text-ivory-50"
                aria-label="Refresh sync engine"
              >
                <RefreshCw
                  className={`w-3 h-3 ${isSyncing ? 'animate-spin text-gold-300' : ''}`}
                />
              </button>
            </div>
            <p className="text-[11px] text-ivory-200">
              Celebrio keeps every budget, vendor, and timeline in sync.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

