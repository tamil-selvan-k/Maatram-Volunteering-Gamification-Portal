import { Modal, Pressable, Text, View } from 'react-native'
import { useAlertStore } from '@/stores/alert.store'

export function AppAlertModal() {
  const visible = useAlertStore((s) => s.visible)
  const title = useAlertStore((s) => s.title)
  const message = useAlertStore((s) => s.message)
  const mode = useAlertStore((s) => s.mode)
  const onConfirm = useAlertStore((s) => s.onConfirm)
  const destructive = useAlertStore((s) => s.destructive)
  const confirmLabel = useAlertStore((s) => s.confirmLabel)
  const dismiss = useAlertStore((s) => s.dismiss)

  const handleConfirm = () => {
    dismiss()
    onConfirm?.()
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={dismiss}
    >
      <Pressable
        className="flex-1 items-center justify-center bg-black/60"
        onPress={dismiss}
      >
        <Pressable
          className="mx-8 w-full max-w-sm rounded-2xl border border-border bg-surface-elevated p-6"
          onPress={(e) => e.stopPropagation()}
        >
          <Text className="mb-2 text-lg font-bold text-white">{title}</Text>
          <Text className="mb-6 text-sm text-muted">{message}</Text>

          {mode === 'alert' ? (
            <Pressable
              className="items-center rounded-xl bg-gold px-4 py-3"
              onPress={dismiss}
            >
              <Text className="font-bold text-black">OK</Text>
            </Pressable>
          ) : (
            <View className="flex-row gap-3">
              <Pressable
                className="flex-1 items-center rounded-xl border border-border bg-surface px-4 py-3"
                onPress={dismiss}
              >
                <Text className="font-semibold text-muted">Cancel</Text>
              </Pressable>
              <Pressable
                className={`flex-1 items-center rounded-xl px-4 py-3 ${
                  destructive ? 'bg-red-600' : 'bg-gold'
                }`}
                onPress={handleConfirm}
              >
                <Text
                  className={`font-bold ${destructive ? 'text-white' : 'text-black'}`}
                >
                  {confirmLabel}
                </Text>
              </Pressable>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  )
}
