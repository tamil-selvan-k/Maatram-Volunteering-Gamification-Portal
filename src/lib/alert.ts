import { useAlertStore } from '@/stores/alert.store'

export function confirmAction(
  title: string,
  message: string,
  onConfirm: () => void,
  options?: { destructive?: boolean; confirmLabel?: string }
) {
  useAlertStore.getState().showConfirm(title, message, onConfirm, options)
}

export function showAlert(title: string, message: string) {
  useAlertStore.getState().showAlert(title, message)
}
