import React from 'react'

interface BrandLogoProps {
  collapsed?: boolean
  className?: string
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ collapsed = false, className = '' }) => {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Brand Emblem */}
      <div className="relative w-9 h-9 rounded-xl bg-forest-900 border border-forest-700/80 flex items-center justify-center shrink-0 shadow-subtle group">
        <svg
          viewBox="0 0 32 32"
          className="w-5 h-5"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Synchronized planning orbital rings */}
          <circle
            cx="14"
            cy="16"
            r="8"
            stroke="#C5A059"
            strokeWidth="1.75"
            strokeDasharray="2 1.5"
            opacity="0.9"
          />
          <circle
            cx="18"
            cy="16"
            r="8"
            stroke="#FAF6F0"
            strokeWidth="2"
          />
          {/* Synchronized Core Gem */}
          <circle cx="16" cy="16" r="2.5" fill="#C86D51" />
        </svg>
      </div>

      {!collapsed && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-serif text-lg font-bold tracking-tight text-forest-900">
              Celebrio
            </span>
            <span className="text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-terracotta-100 text-terracotta-700 border border-terracotta-200">
              AI
            </span>
          </div>
          <span className="text-[11px] text-charcoal-500 font-medium tracking-tight mt-0.5">
            Adaptive Event Planner
          </span>
        </div>
      )}
    </div>
  )
}

