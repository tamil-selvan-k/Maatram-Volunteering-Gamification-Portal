import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { COLORS } from '@/constants/theme'

interface ErrorBoundaryProps {
  children: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  errorMessage: string
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, errorMessage: '' }
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    const message =
      error instanceof Error ? error.message : 'An unexpected error occurred.'
    return { hasError: true, errorMessage: message }
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo): void {
    // In a production app, send to error reporting (e.g., Sentry)
    console.error('[ErrorBoundary] Caught error:', error, info.componentStack)
  }

  handleReset = (): void => {
    this.setState({ hasError: false, errorMessage: '' })
  }

  render() {
    if (this.state.hasError) {
      return (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: COLORS.bg,
            padding: 32,
          }}
        >
          <View
            style={{
              backgroundColor: COLORS.surface,
              borderWidth: 1,
              borderColor: COLORS.border,
              borderRadius: 20,
              padding: 28,
              width: '100%',
              maxWidth: 360,
              alignItems: 'center',
            }}
          >
            {/* Icon placeholder */}
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: `${COLORS.error}20`,
                borderWidth: 2,
                borderColor: `${COLORS.error}50`,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 24 }}>!</Text>
            </View>

            <Text
              style={{
                color: COLORS.white,
                fontWeight: '700',
                fontSize: 18,
                marginBottom: 8,
                textAlign: 'center',
              }}
            >
              Something went wrong
            </Text>

            {this.state.errorMessage ? (
              <Text
                style={{
                  color: COLORS.muted,
                  fontSize: 13,
                  textAlign: 'center',
                  marginBottom: 24,
                  lineHeight: 20,
                }}
                numberOfLines={4}
              >
                {this.state.errorMessage}
              </Text>
            ) : null}

            <TouchableOpacity
              onPress={this.handleReset}
              activeOpacity={0.8}
              style={{
                backgroundColor: COLORS.gold,
                borderRadius: 12,
                paddingVertical: 13,
                paddingHorizontal: 32,
                alignItems: 'center',
                width: '100%',
              }}
            >
              <Text
                style={{
                  color: COLORS.bg,
                  fontWeight: '700',
                  fontSize: 15,
                }}
              >
                Try again
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )
    }

    return this.props.children
  }
}
