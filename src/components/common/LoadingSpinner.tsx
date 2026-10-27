import React from 'react'

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  message?: string
  className?: string
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message,
  className = '',
}) => {
  const sizeClass = {
    sm: 'w-4 h-4 border-2',
    md: 'w-7 h-7 border-2',
    lg: 'w-10 h-10 border-3',
  }[size]

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center p-6 gap-3 ${className}`}
    >
      <div
        className={`${sizeClass} rounded-full border-ivory-300 border-t-forest-700 animate-spin`}
        aria-hidden="true"
      />
      {message && <p className="text-xs font-medium text-charcoal-600">{message}</p>}
      <span className="sr-only">Loading...</span>
    </div>
  )
}
