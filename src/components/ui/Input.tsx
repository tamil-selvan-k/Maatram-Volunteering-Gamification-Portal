import { View, Text, TextInput, type TextInputProps } from 'react-native'

interface InputProps extends TextInputProps {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
}

export function Input({ label, error, hint, leftIcon, className = '', ...props }: InputProps & { className?: string }) {
  return (
    <View className="gap-1.5">
      {label && <Text className="text-sm font-semibold text-white">{label}</Text>}
      <View
        className={`flex-row items-center bg-surface border rounded-xl px-4 ${error ? 'border-red-500' : 'border-border'}`}
      >
        {leftIcon && <View className="mr-2">{leftIcon}</View>}
        <TextInput
          className={`flex-1 py-3 text-white text-sm ${className}`}
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
          {...props}
        />
      </View>
      {error && <Text className="text-xs text-red-400">{error}</Text>}
      {hint && !error && <Text className="text-xs text-muted">{hint}</Text>}
    </View>
  )
}
