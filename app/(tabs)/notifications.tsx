import React, { useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ListRenderItem,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Trophy, Star, Calendar, Bell, ArrowLeft } from 'lucide-react-native'
import { useAuthStore, selectVolunteer } from '@/stores/auth.store'
import { useNotifications, useMarkRead, useMarkAllRead } from '@/hooks/useNotifications'
import { Skeleton } from '@/components/ui/Skeleton'
import { COLORS } from '@/constants/theme'
import type { Notification } from '@/types'

function formatRelativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const secs = Math.floor(ms / 1000)
  if (secs < 60) return 'just now'
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function NotificationIcon({ type }: { type: Notification['type'] }) {
  const size = 20
  switch (type) {
    case 'badge_earned':
      return <Trophy size={size} color={COLORS.gold} />
    case 'points_awarded':
      return <Star size={size} color={COLORS.gold} />
    case 'opportunity_selected':
      return <Calendar size={size} color={COLORS.gold} />
    default:
      return <Bell size={size} color={COLORS.muted} />
  }
}

interface NotifRowProps {
  item: Notification
  onPress: (id: string, volunteerId: string) => void
  volunteerId: string
}

const NotifRow = React.memo(function NotifRow({
  item,
  onPress,
  volunteerId,
}: NotifRowProps) {
  return (
    <TouchableOpacity
      onPress={() => onPress(item.id, volunteerId)}
      activeOpacity={0.75}
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 12,
        borderLeftWidth: item.read ? 0 : 3,
        borderLeftColor: item.read ? 'transparent' : COLORS.gold,
        backgroundColor: item.read ? 'transparent' : `${COLORS.gold}08`,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: COLORS.surface,
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <NotificationIcon type={item.type} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text
          style={{
            color: item.read ? COLORS.muted : COLORS.white,
            fontWeight: item.read ? '400' : '600',
            fontSize: 14,
          }}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        <Text
          style={{ color: COLORS.muted, fontSize: 13, lineHeight: 18 }}
          numberOfLines={2}
        >
          {item.body}
        </Text>
        <Text style={{ color: COLORS.muted, fontSize: 11, marginTop: 2 }}>
          {formatRelativeTime(item.created_at)}
        </Text>
      </View>
      {!item.read && (
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: COLORS.gold,
            marginTop: 4,
            flexShrink: 0,
          }}
        />
      )}
    </TouchableOpacity>
  )
})

function SkeletonRows() {
  return (
    <View style={{ padding: 16, gap: 12 }}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <Skeleton height={36} className="w-9 rounded-full" />
          <View style={{ flex: 1, gap: 6 }}>
            <Skeleton height={14} className="w-3/4" />
            <Skeleton height={12} className="w-full" />
          </View>
        </View>
      ))}
    </View>
  )
}

function EmptyState() {
  return (
    <View
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 }}
    >
      <Bell size={48} color={COLORS.border} />
      <Text style={{ color: COLORS.muted, fontSize: 16, fontWeight: '600' }}>
        No notifications yet
      </Text>
      <Text style={{ color: COLORS.muted, fontSize: 13, textAlign: 'center', paddingHorizontal: 32 }}>
        You'll see badge awards, points updates and opportunities here.
      </Text>
    </View>
  )
}

export default function NotificationsScreen() {
  const router = useRouter()
  const volunteer = useAuthStore(selectVolunteer)
  const { data: notifications, isLoading } = useNotifications(volunteer?.id)
  const markRead = useMarkRead()
  const markAllRead = useMarkAllRead()

  const handlePress = useCallback(
    (notificationId: string, volunteerId: string) => {
      markRead.mutate({ notificationId, volunteerId })
    },
    [markRead]
  )

  const handleMarkAll = useCallback(() => {
    if (!volunteer) return
    markAllRead.mutate(volunteer.id)
  }, [volunteer, markAllRead])

  const renderItem: ListRenderItem<Notification> = useCallback(
    ({ item }) => (
      <NotifRow
        item={item}
        onPress={handlePress}
        volunteerId={volunteer?.id ?? ''}
      />
    ),
    [handlePress, volunteer?.id]
  )

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
          gap: 12,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <ArrowLeft size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={{ color: COLORS.white, fontWeight: '700', fontSize: 18, flex: 1 }}>
          Notifications
        </Text>
        <TouchableOpacity onPress={handleMarkAll} hitSlop={8}>
          <Text style={{ color: COLORS.gold, fontSize: 13, fontWeight: '600' }}>
            Mark all read
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <SkeletonRows />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={<EmptyState />}
          contentContainerStyle={
            (notifications?.length ?? 0) === 0 ? { flex: 1 } : undefined
          }
          ItemSeparatorComponent={() => (
            <View
              style={{ height: 1, backgroundColor: COLORS.border, marginLeft: 64 }}
            />
          )}
        />
      )}
    </SafeAreaView>
  )
}
