import * as ExpoNotifications from 'expo-notifications'
import { Platform } from 'react-native'
import { supabase } from '@/lib/supabase/client'
import { toAppError } from '@/lib/errors'
import type { Result } from '@/types'
import type { Opportunity } from '@/types'

// Configure how notifications appear when app is in foreground
ExpoNotifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowList: true,
  }),
})

export async function requestPushPermission(): Promise<Result<string>> {
  try {
    // Android requires notification channel
    if (Platform.OS === 'android') {
      await ExpoNotifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: ExpoNotifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#F5B800',
      })
    }

    const { status: existingStatus } = await ExpoNotifications.getPermissionsAsync()
    let finalStatus = existingStatus

    if (existingStatus !== 'granted') {
      const { status } = await ExpoNotifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== 'granted') {
      return {
        data: null,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Push notification permission was not granted.',
        },
      }
    }

    const tokenData = await ExpoNotifications.getExpoPushTokenAsync()
    return { data: tokenData.data, error: null }
  } catch (err) {
    return { data: null, error: toAppError(err) }
  }
}

export async function savePushToken(
  volunteerId: string,
  token: string
): Promise<Result<void>> {
  try {
    const { error } = await supabase
      .from('push_tokens')
      .upsert(
        { volunteer_id: volunteerId, token, updated_at: new Date().toISOString() },
        { onConflict: 'volunteer_id' }
      )

    if (error) return { data: null, error: toAppError(error) }
    return { data: undefined, error: null }
  } catch (err) {
    return { data: null, error: toAppError(err) }
  }
}

export async function scheduleLocalReminder(opportunity: Opportunity): Promise<Result<string>> {
  try {
    const eventDate = new Date(opportunity.event_date)
    const reminderDate = new Date(eventDate.getTime() - 24 * 60 * 60 * 1000) // 24h before

    // Don't schedule if reminder time is in the past
    if (reminderDate.getTime() <= Date.now()) {
      return {
        data: null,
        error: {
          code: 'PAST_DATE',
          message: 'Event is too soon to schedule a 24h reminder.',
        },
      }
    }

    const identifier = await ExpoNotifications.scheduleNotificationAsync({
      content: {
        title: `Reminder: ${opportunity.title}`,
        body: `Your volunteering event starts tomorrow. Don't forget to check in!`,
        data: { opportunityId: opportunity.id },
        sound: true,
      },
      trigger: {
        type: ExpoNotifications.SchedulableTriggerInputTypes.DATE,
        date: reminderDate,
      },
    })

    return { data: identifier, error: null }
  } catch (err) {
    return { data: null, error: toAppError(err) }
  }
}
