import { TouchableOpacity, Text, ActivityIndicator, type TouchableOpacityProps } from 'react-native'
import type { ReactElement } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  title: string
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactElement
  className?: string
  textClassName?: string
}

const variantClasses: Record<Variant, string> = {
  primary:   'bg-gold',
  secondary: 'bg-surface border border-border',
  ghost:     'bg-transparent',
  danger:    'bg-red-500/10 border border-red-500/30',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-2 rounded-lg',
  md: 'px-4 py-3 rounded-xl',
  lg: 'px-6 py-4 rounded-xl',
}

const textVariantClasses: Record<Variant, string> = {
  primary:   'text-black font-bold',
  secondary: 'text-white font-semibold',
  ghost:     'text-muted font-semibold',
  danger:    'text-red-400 font-semibold',
}

const textSizeClasses: Record<Size, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
}

const spinnerColors: Record<Variant, string> = {
  primary:   '#000000',
  secondary: '#F5B800',
  ghost:     '#9CA3AF',
  danger:    '#EF4444',
}

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  className = '',
  textClassName = '',
  ...props
}: ButtonProps) {
  return (
    <TouchableOpacity
      disabled={disabled || loading}
      className={`flex-row items-center justify-center gap-2 ${variantClasses[variant]} ${sizeClasses[size]} ${disabled || loading ? 'opacity-50' : ''} ${className}`}
      activeOpacity={0.75}
      {...props}
    >
      {loading && <ActivityIndicator size="small" color={spinnerColors[variant]} />}
      {!loading && icon}
      <Text className={`${textVariantClasses[variant]} ${textSizeClasses[size]} ${textClassName}`}>
        {title}
      </Text>
    </TouchableOpacity>
  )
}
