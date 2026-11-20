import { create } from 'zustand'

interface AlertState {
  visible: boolean
  title: string
  message: string
  mode: 'alert' | 'confirm'
  onConfirm: (() => void) | null
  destructive: boolean
  confirmLabel: string
  showAlert: (title: string, message: string) => void
  showConfirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    options?: { destructive?: boolean; confirmLabel?: string }
  ) => void
  dismiss: () => void
}

export const useAlertStore = create<AlertState>((set) => ({
  visible: false,
  title: '',
  message: '',
  mode: 'alert',
  onConfirm: null,
  destructive: false,
  confirmLabel: 'Confirm',
  showAlert: (title, message) =>
    set({
      visible: true,
      title,
      message,
      mode: 'alert',
      onConfirm: null,
      destructive: false,
      confirmLabel: 'Confirm',
    }),
  showConfirm: (title, message, onConfirm, options) =>
    set({
      visible: true,
      title,
      message,
      mode: 'confirm',
      onConfirm,
      destructive: options?.destructive ?? false,
      confirmLabel: options?.confirmLabel ?? 'Confirm',
    }),
  dismiss: () =>
    set({
      visible: false,
      title: '',
      message: '',
      mode: 'alert',
      onConfirm: null,
      destructive: false,
      confirmLabel: 'Confirm',
    }),
}))
