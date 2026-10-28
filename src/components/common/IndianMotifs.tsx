import React from 'react'

interface MotifProps {
  className?: string
  size?: number
  color?: string
}

/**
 * Architectural Jaali Lattice Pattern Divider
 * Clean, restrained geometric diamonds inspired by Rajasthani and Mughal stone jali screens.
 */
export const JaaliDivider: React.FC<MotifProps> = ({ className = 'my-4 text-gold-400/40' }) => (
  <div className={`flex items-center justify-center gap-2 select-none pointer-events-none ${className}`} aria-hidden="true">
    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold-400/30 to-gold-400/60" />
    <svg width="24" height="12" viewBox="0 0 24 12" fill="none" className="shrink-0 text-gold-500/80">
      <path
        d="M12 1L16 6L12 11L8 6L12 1Z"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="currentColor"
        fillOpacity="0.15"
      />
      <circle cx="4" cy="6" r="1.5" fill="currentColor" fillOpacity="0.5" />
      <circle cx="20" cy="6" r="1.5" fill="currentColor" fillOpacity="0.5" />
    </svg>
    <div className="h-px flex-1 bg-gradient-to-l from-transparent via-gold-400/30 to-gold-400/60" />
  </div>
)

/**
 * Lotus Petal Crest Motif
 * Symbolic of purity, auspicious beginnings, and celebration across Indian traditions.
 */
export const LotusMotif: React.FC<MotifProps> = ({ className = 'text-gold-500', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
    aria-hidden="true"
  >
    {/* Central Petal */}
    <path
      d="M12 3C12 3 14.5 8 14.5 13C14.5 16.5 13.5 18 12 18C10.5 18 9.5 16.5 9.5 13C9.5 8 12 3 12 3Z"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinejoin="round"
      fill="currentColor"
      fillOpacity="0.15"
    />
    {/* Left Outer Petal */}
    <path
      d="M10 8C7 10 4 13.5 5 17C6 19 8.5 19 11 18"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
    />
    {/* Right Outer Petal */}
    <path
      d="M14 8C17 10 20 13.5 19 17C18 19 15.5 19 13 18"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
    />
    {/* Base Lotus Leaf Pod */}
    <path
      d="M7 19C9.5 21 14.5 21 17 19"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
    />
  </svg>
)

/**
 * Paisley / Kalka (Ambi) Motif
 * Iconic timeless motif found across Kashmiri Jamawar, Banarasi brocades, and Bengali Baluchari silks.
 */
export const PaisleyKalkaMotif: React.FC<MotifProps> = ({ className = 'text-terracotta-500', size = 22 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
    aria-hidden="true"
  >
    <path
      d="M12 2C8 4 6 8.5 6 13C6 17.4 9.6 21 14 21C18.4 21 21 17.5 20 13.5C19 9.5 15.5 8 13.5 8C11.5 8 10 6 11 4C11.5 3 12 2 12 2Z"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinejoin="round"
      fill="currentColor"
      fillOpacity="0.12"
    />
    <circle cx="13" cy="14" r="2" fill="currentColor" fillOpacity="0.6" />
  </svg>
)

/**
 * Alpana / Rangoli Geometric Circle
 * Symbolic of ritual thresholds, prosperity, and community welcoming.
 */
export const AlpanaMandalaMotif: React.FC<MotifProps> = ({ className = 'text-gold-500', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1" strokeDasharray="1.5 1.5" />
    <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="1" />
    <circle cx="12" cy="12" r="2.5" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1" />
    <path d="M12 3V5M12 19V21M3 12H5M19 12H21" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
)

/**
 * Traditional Brass Pradip / Diya Lamp Motif
 * Sacred oil lamp signifying auspiciousness, dispelling darkness, and celebratory joy.
 */
export const DiyaLampMotif: React.FC<MotifProps> = ({ className = 'text-gold-500', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
    aria-hidden="true"
  >
    {/* Flame */}
    <path
      d="M12 2C12 2 14 6 14 8C14 9.1 13.1 10 12 10C10.9 10 10 9.1 10 8C10 6 12 2 12 2Z"
      fill="#D5B463"
      stroke="#96442B"
      strokeWidth="0.75"
    />
    {/* Brass Lamp Base */}
    <path
      d="M5 14C5 17.5 8.1 20 12 20C15.9 20 19 17.5 19 14C19 13.5 18.5 13 18 13H6C5.5 13 5 13.5 5 14Z"
      stroke="currentColor"
      strokeWidth="1.2"
      fill="currentColor"
      fillOpacity="0.2"
    />
    {/* Stand */}
    <path d="M10 20H14M9 22H15" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
)

