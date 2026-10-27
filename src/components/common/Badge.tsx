import React from 'react'

export type BadgeVariant =
  | 'forest'
  | 'terracotta'
  | 'gold'
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?: 'sm' | 'md'
  dot?: boolean
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center font-medium rounded-full select-none'

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  }

  const variantStyles: Record<BadgeVariant, { pill: string; dot: string }> = {
    forest: {
      pill: 'bg-forest-100 text-forest-800 border border-forest-200',
      dot: 'bg-forest-600',
    },
    terracotta: {
      pill: 'bg-terracotta-100 text-terracotta-800 border border-terracotta-200',
      dot: 'bg-terracotta-500',
    },
    gold: {
      pill: 'bg-gold-100 text-gold-800 border border-gold-200',
      dot: 'bg-gold-600',
    },
    neutral: {
      pill: 'bg-ivory-200 text-charcoal-700 border border-ivory-300',
      dot: 'bg-charcoal-400',
    },
    success: {
      pill: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
      dot: 'bg-emerald-600',
    },
    warning: {
      pill: 'bg-amber-50 text-amber-800 border border-amber-200',
      dot: 'bg-amber-500',
    },
    danger: {
      pill: 'bg-rose-50 text-rose-800 border border-rose-200',
      dot: 'bg-rose-600',
    },
  }

  const selected = variantStyles[variant]

  return (
    <span
      className={`${baseStyles} ${sizeStyles[size]} ${selected.pill} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${selected.dot}`}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </span>
  )
}

