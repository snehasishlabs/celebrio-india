import React from 'react'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'forest-accent' | 'terracotta-accent' | 'gold-accent'
  isInteractive?: boolean
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  isInteractive = false,
  className = '',
  ...props
}) => {
  const baseStyles = 'rounded-2xl transition-all duration-200'

  const variantStyles = {
    default: 'bg-ivory-50 border border-ivory-300/80 shadow-subtle text-charcoal-900',
    elevated: 'bg-ivory-50 border border-ivory-300 shadow-card text-charcoal-900',
    'forest-accent':
      'bg-forest-900 border border-forest-800 text-ivory-50 shadow-elevated',
    'terracotta-accent':
      'bg-terracotta-50/70 border border-terracotta-200 text-charcoal-900 shadow-subtle',
    'gold-accent':
      'bg-gold-50/60 border border-gold-200 text-charcoal-900 shadow-subtle',
  }

  const interactiveStyles = isInteractive
    ? 'hover:border-forest-400 hover:shadow-card cursor-pointer'
    : ''

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${interactiveStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div
    className={`p-5 sm:p-6 border-b border-ivory-300/60 flex items-center justify-between ${className}`}
    {...props}
  >
    {children}
  </div>
)

export const CardBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`p-5 sm:p-6 ${className}`} {...props}>
    {children}
  </div>
)

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div
    className={`p-4 sm:p-6 border-t border-ivory-300/60 bg-ivory-100/50 rounded-b-2xl flex items-center justify-between ${className}`}
    {...props}
  >
    {children}
  </div>
)
