import React from 'react'
import { Loader2 } from 'lucide-react'

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'terracotta'
  | 'gold'
  | 'ghost'
  | 'danger'

export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none'

  const variantStyles: Record<ButtonVariant, string> = {
    // Deep Forest Green
    primary:
      'bg-forest-700 hover:bg-forest-800 text-ivory-50 active:bg-forest-900 focus-visible:ring-forest-700 shadow-subtle',
    // Warm Ivory Border
    secondary:
      'bg-ivory-50 hover:bg-ivory-200 text-forest-800 border border-ivory-300 active:bg-ivory-300 focus-visible:ring-forest-700 shadow-subtle',
    // Muted Terracotta Accent
    terracotta:
      'bg-terracotta-500 hover:bg-terracotta-600 text-ivory-50 active:bg-terracotta-700 focus-visible:ring-terracotta-500 shadow-subtle',
    // Restrained Gold
    gold:
      'bg-gold-500 hover:bg-gold-600 text-ivory-50 active:bg-gold-700 focus-visible:ring-gold-500 shadow-subtle',
    // Subtle Ghost
    ghost:
      'text-forest-800 hover:bg-ivory-200 active:bg-ivory-300 focus-visible:ring-forest-700',
    // Danger / Critical
    danger:
      'bg-red-700 hover:bg-red-800 text-white active:bg-red-900 focus-visible:ring-red-600 shadow-subtle',
  }

  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  }

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" aria-hidden="true" />
      ) : (
        leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && (
        <span className="inline-flex shrink-0">{rightIcon}</span>
      )}
    </button>
  )
}

