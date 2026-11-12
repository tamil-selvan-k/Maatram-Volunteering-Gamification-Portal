import React from 'react'
import { Tabs } from 'expo-router'
import { Home, Search, BarChart2, Trophy, User, Bell, ShieldCheck } from 'lucide-react-native'
import { View, Text, StyleSheet } from 'react-native'
import { COLORS } from '@/constants/theme'
import { useAuthStore, selectVolunteer, selectIsAdmin } from '@/stores/auth.store'
import { useUnreadCount } from '@/hooks/useNotifications'
import { LevelUpModal } from '@/components/gamification/LevelUpModal'

function NotifIcon({ color, size }: { color: string | undefined; size: number }) {
  const volunteer = useAuthStore(selectVolunteer)
  const { data: count = 0 } = useUnreadCount(volunteer?.id)

  return (
    <View style={{ position: 'relative' }}>
      <Bell size={size} color={color ?? COLORS.muted} strokeWidth={2} />
      {count > 0 && (
        <View
          style={{
            position: 'absolute',
            top: -4,
            right: -6,
            minWidth: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: COLORS.gold,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 3,
          }}
        >
          <Text
            style={{ color: '#000', fontSize: 9, fontWeight: '800', lineHeight: 16 }}
          >
            {count > 99 ? '99+' : String(count)}
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  hiddenTab: { width: 0, overflow: 'hidden' },
})

export default function TabsLayout() {
  const isAdmin = useAuthStore(selectIsAdmin)

  return (
    <>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 56,
        },
        tabBarIconStyle: { marginTop: 8 },
        tabBarActiveTintColor: COLORS.gold,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2, marginBottom: 6 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="opportunities"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, size }) => <Search size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Impact',
          tabBarIcon: ({ color, size }) => <BarChart2 size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Leaders',
          tabBarIcon: ({ color, size }) => <Trophy size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color, size }) => <NotifIcon color={typeof color === 'string' ? color : undefined} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          tabBarButton: isAdmin ? undefined : () => <View style={styles.hiddenTab} />,
          tabBarIcon: ({ color, size }) => <ShieldCheck size={size} color={color} />,
        }}
      />
    </Tabs>
    <LevelUpModal />
    </>
  )
}
