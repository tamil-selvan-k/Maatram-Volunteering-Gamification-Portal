import { View, type ViewProps } from 'react-native'

interface CardProps extends ViewProps {
  elevated?: boolean
  className?: string
}

export function Card({ elevated = false, className = '', children, ...props }: CardProps) {
  return (
    <View
      className={`${elevated ? 'bg-surface-elevated' : 'bg-surface'} rounded-2xl border border-border ${className}`}
      {...props}
    >
      {children}
    </View>
  )
}
