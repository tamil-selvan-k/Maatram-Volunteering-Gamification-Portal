import { Alert, Platform } from 'react-native'

export function confirmAction(
  title: string,
  message: string,
  onConfirm: () => void,
  options?: { destructive?: boolean; confirmLabel?: string }
) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm()
  } else {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: options?.confirmLabel ?? 'Confirm', style: options?.destructive ? 'destructive' : 'default', onPress: onConfirm },
    ])
  }
}

export function showAlert(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`)
  } else {
    Alert.alert(title, message)
  }
}
